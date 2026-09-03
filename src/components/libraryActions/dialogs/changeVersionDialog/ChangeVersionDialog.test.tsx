import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary } from "@madie/madie-models";
import ChangeVersionDialog, {
  VERSION_CHANGE_CRITERIA,
} from "./ChangeVersionDialog";

const mockGetLibrariesByLibrarySetId = jest.fn();
jest.mock("../../../../api/useCqlLibraryServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getLibrariesByLibrarySetId: (...args: unknown[]) =>
      mockGetLibrariesByLibrarySetId(...args),
  })),
}));

const library = (overrides: any = {}) =>
  ({
    id: "l-latest",
    librarySetId: "set-1",
    cqlLibraryName: "AmbulatorySensitiveConditionsLibrary",
    version: "3.2.003",
    lastModifiedAt: "2026-05-10T12:00:00.000Z",
    draft: false,
    ...overrides,
  } as unknown as CqlLibrary);

const selectedLibrary = library();
const librarySet = [
  library({ id: "l-1", version: "3.2.001", lastModifiedAt: "2026-04-12" }),
  selectedLibrary,
  library({ id: "l-2", version: "3.2.002", lastModifiedAt: "2026-04-13" }),
];

// the versions lookup resolves asynchronously; wait for it before asserting
const waitForVersionsLoaded = async (count: number) =>
  waitFor(() =>
    expect(screen.getByTestId("library-versions-toggle")).toHaveTextContent(
      `Library Versions (${count})`
    )
  );

describe("Library ChangeVersionDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLibrariesByLibrarySetId.mockResolvedValue(librarySet);
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open={false}
        onClose={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("renders nothing when more than one library is selected", () => {
    const { container } = render(
      <ChangeVersionDialog
        libraries={[selectedLibrary, library({ id: "other" })]}
        open
        onClose={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title, criteria, selected library and version fields", async () => {
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={jest.fn()}
      />
    );

    await waitForVersionsLoaded(3);
    expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith("set-1", true);

    expect(screen.getByText("Change Version #")).toBeInTheDocument();
    expect(screen.getByText("Indicates required field")).toBeInTheDocument();

    expect(screen.getByTestId("selected-library-name")).toHaveTextContent(
      selectedLibrary.cqlLibraryName
    );

    expect(screen.getByText("Version-change criteria:")).toBeInTheDocument();
    VERSION_CHANGE_CRITERIA.forEach((criterion) => {
      expect(screen.getByText(criterion)).toBeInTheDocument();
    });

    expect(screen.getByText("Current Version #")).toBeInTheDocument();
    expect(screen.getByTestId("current-version-value")).toHaveTextContent(
      "3.2.003"
    );
    expect(screen.getByTestId("new-version-number-input")).toHaveValue("");

    expect(
      screen.getByTestId("change-version-cancel-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("change-version-save-button")
    ).toBeInTheDocument();
  });

  it("accepts input in the New Version # field", async () => {
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={jest.fn()}
      />
    );

    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    userEvent.type(input, "4.0.000");
    await waitFor(() => expect(input).toHaveValue("4.0.000"));
  });

  it("toggles the library versions panel and lists versions newest first", async () => {
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={jest.fn()}
      />
    );

    await waitForVersionsLoaded(3);
    const toggle = screen.getByTestId("library-versions-toggle");
    expect(
      screen.queryByTestId("library-versions-panel")
    ).not.toBeInTheDocument();

    userEvent.click(toggle);

    const panel = await screen.findByTestId("library-versions-panel");
    expect(within(panel).getByText("Version #")).toBeInTheDocument();
    expect(within(panel).getByText("Library Name")).toBeInTheDocument();
    expect(within(panel).getByText("Version Date")).toBeInTheDocument();

    const rows = within(panel).getAllByTestId(/version-row-/);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("3.2.003 (Current)");
    expect(rows[0]).toHaveTextContent("5/10/2026");
    expect(rows[1]).toHaveTextContent("3.2.002");
    expect(rows[2]).toHaveTextContent("3.2.001");

    userEvent.click(toggle);
    await waitFor(() =>
      expect(
        screen.queryByTestId("library-versions-panel")
      ).not.toBeInTheDocument()
    );
  });

  it("shows an empty panel when the library set lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetLibrariesByLibrarySetId.mockRejectedValue(new Error("boom"));

    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    userEvent.click(screen.getByTestId("library-versions-toggle"));
    expect(await screen.findByText("No versions found.")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("closes when Cancel is clicked", async () => {
    const onClose = jest.fn();
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={onClose}
      />
    );

    await waitForVersionsLoaded(3);
    userEvent.click(screen.getByTestId("change-version-cancel-button"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("does nothing when Save is clicked - out of scope for this story", async () => {
    const onClose = jest.fn();
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={onClose}
      />
    );

    await waitForVersionsLoaded(3);
    userEvent.click(screen.getByTestId("change-version-save-button"));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("change-version-dialog")).toBeInTheDocument();
  });
});
