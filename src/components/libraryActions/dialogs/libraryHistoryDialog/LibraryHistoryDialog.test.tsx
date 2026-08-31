import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LibraryHistoryDialog, {
  formatHistoryDate,
  HISTORY_FETCH_ERROR,
} from "./LibraryHistoryDialog";
import { CqlLibrary } from "@madie/madie-models";
import type { AuditRow } from "../../../../api/useCqlLibraryServiceApi";

const mockGetLibraryHistory = jest.fn();

jest.mock("../../../../api/useCqlLibraryServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getLibraryHistory: mockGetLibraryHistory,
  })),
}));

jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieDialog: ({ children }) => (
    <div data-testid="madie-dialog">{children}</div>
  ),
  Pagination: (props) => (
    <div data-testid="library-history-pagination">
      <button
        data-testid="pagination-prev"
        disabled={props.hidePrevButton}
        onClick={() => props.handlePageChange(null, props.page - 1)}
      >
        Prev
      </button>
      <button
        data-testid="pagination-next"
        disabled={props.hideNextButton}
        onClick={() => props.handlePageChange(null, props.page + 1)}
      >
        Next
      </button>
      <select
        data-testid="pagination-limit"
        value={props.limit}
        onChange={props.handleLimitChange}
      >
        {props.limitOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  ),
}));

jest.mock("@mui/material/Chip", () => (props) => (
  <div data-testid={props["data-testid"] || "chip"}>{props.label}</div>
));

const library = {
  id: "lib-1",
  cqlLibraryName: "Test Library",
  version: "1.0.0",
  draft: false,
} as CqlLibrary;

const logs: AuditRow[] = [
  {
    actionType: "CREATED",
    additionalActionMessage: "Initial creation",
    performedAt: "2023-01-01T12:00:00Z",
    performedBy: "user1",
  },
  {
    actionType: "UPDATED",
    additionalActionMessage: "Updated description",
    performedAt: "2023-01-02T13:00:00Z",
    performedBy: "user2",
  },
] as AuditRow[];

const manyLogs = (count: number): AuditRow[] =>
  Array.from({ length: count }, (_, i) => ({
    actionType: "ACTION",
    additionalActionMessage: `msg${i}`,
    performedAt: `2023-01-0${(i % 9) + 1}T12:00:00Z`,
    performedBy: `user${i}`,
  })) as AuditRow[];

const renderDialog = (props: any = {}) =>
  render(
    <LibraryHistoryDialog
      libraries={[library]}
      open={true}
      onClose={jest.fn()}
      {...props}
    />
  );

describe("LibraryHistoryDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLibraryHistory.mockResolvedValue(logs);
  });

  it("fetches history for the selected library when opened", async () => {
    renderDialog();
    await waitFor(() =>
      expect(mockGetLibraryHistory).toHaveBeenCalledWith(library)
    );
  });

  it("renders dialog with library name and version", async () => {
    renderDialog();
    expect(await screen.findByText("Test Library")).toBeInTheDocument();
    expect(screen.getByText("(Version 1.0.0)")).toBeInTheDocument();
    expect(screen.getByTestId("madie-dialog")).toBeInTheDocument();
  });

  it("renders table headers", async () => {
    renderDialog();
    expect(await screen.findByText("Date")).toBeInTheDocument();
    expect(screen.getByText("User Action")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Additional Info")).toBeInTheDocument();
    expect(screen.queryByText("HarpID")).not.toBeInTheDocument();
  });

  it("renders table rows with correct data", async () => {
    renderDialog();
    expect(await screen.findByText("CREATED")).toBeInTheDocument();
    expect(screen.getByText("UPDATED")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
    expect(screen.getByText("Initial creation")).toBeInTheDocument();
    expect(screen.getByText("Updated description")).toBeInTheDocument();
  });

  it("renders Draft chip if draft is true", async () => {
    renderDialog({ libraries: [{ ...library, draft: true } as CqlLibrary] });
    expect(
      await screen.findByTestId("library-history-draft-chip")
    ).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("shows '-' for empty additionalActionMessage", async () => {
    mockGetLibraryHistory.mockResolvedValue([
      { ...logs[0], additionalActionMessage: "" },
      { ...logs[1], additionalActionMessage: "[]" },
    ]);
    renderDialog();
    await waitFor(() =>
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2)
    );
  });

  it("does not fetch when the dialog is closed", () => {
    renderDialog({ open: false });
    expect(mockGetLibraryHistory).not.toHaveBeenCalled();
  });

  it("does not fetch unless exactly one library is selected", () => {
    renderDialog({ libraries: [library, library] });
    expect(mockGetLibraryHistory).not.toHaveBeenCalled();
  });

  it("shows an empty state when there is no history", async () => {
    mockGetLibraryHistory.mockResolvedValue([]);
    renderDialog();
    expect(await screen.findByText("No history found.")).toBeInTheDocument();
  });

  it("shows an error message, not an empty state, when the request fails", async () => {
    mockGetLibraryHistory.mockRejectedValue(new Error("boom"));
    renderDialog();
    expect(await screen.findByText(HISTORY_FETCH_ERROR)).toBeInTheDocument();
    expect(screen.queryByText("No history found.")).not.toBeInTheDocument();
  });

  it("renders pagination and handles page change", async () => {
    mockGetLibraryHistory.mockResolvedValue(manyLogs(15));
    renderDialog();

    await waitFor(() =>
      expect(screen.getAllByTestId(/library-history-row-/).length).toBe(10)
    );
    await userEvent.click(screen.getByTestId("pagination-next"));
    expect(screen.getAllByTestId(/library-history-row-/).length).toBe(5);
    await userEvent.click(screen.getByTestId("pagination-prev"));
    expect(screen.getAllByTestId(/library-history-row-/).length).toBe(10);
  });

  it("handles limit change", async () => {
    mockGetLibraryHistory.mockResolvedValue(manyLogs(12));
    renderDialog();

    await waitFor(() =>
      expect(screen.getAllByTestId(/library-history-row-/).length).toBe(10)
    );
    await userEvent.selectOptions(screen.getByTestId("pagination-limit"), "5");
    expect(screen.getAllByTestId(/library-history-row-/).length).toBe(5);
    await userEvent.selectOptions(screen.getByTestId("pagination-limit"), "25");
    expect(screen.getAllByTestId(/library-history-row-/).length).toBe(12);
  });
});

describe("formatHistoryDate", () => {
  it("renders a zero-padded MM/DD/YYYY hh:mm:ss A string", () => {
    expect(formatHistoryDate("2023-01-01T12:00:00Z")).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2} (AM|PM)$/
    );
  });
});
