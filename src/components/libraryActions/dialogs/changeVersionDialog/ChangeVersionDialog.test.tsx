import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary } from "@madie/madie-models";
import ChangeVersionDialog, {
  VERSION_CHANGE_CRITERIA,
  VERSION_DUPLICATE_ERROR,
} from "./ChangeVersionDialog";
import {
  VERSION_FORMAT_ERROR,
  VERSION_LOWER_ERROR,
  VERSION_REQUIRED_ERROR,
} from "../../../../util/versionUtils";

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

const waitForVersionsLoaded = async (count: number) =>
  waitFor(() =>
    expect(screen.getByTestId("library-versions-toggle")).toHaveTextContent(
      `Library Versions (${count})`
    )
  );

describe("Library ChangeVersionDialog", () => {
  const renderDialog = (
    overrides: Partial<React.ComponentProps<typeof ChangeVersionDialog>> = {}
  ) => {
    const onClose = jest.fn();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <ChangeVersionDialog
        libraries={[selectedLibrary]}
        open
        onClose={onClose}
        onSubmit={onSubmit}
        {...overrides}
      />
    );
    return { onClose, onSubmit };
  };

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

  it("keeps Save disabled on initial render", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("shows the required error when the field is blurred while empty", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    input.focus();
    input.blur();

    expect(await screen.findByText(VERSION_REQUIRED_ERROR)).toBeInTheDocument();
    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("shows the format error when the entered version is malformed", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.2.03");
    input.blur();

    expect(await screen.findByText(VERSION_FORMAT_ERROR)).toBeInTheDocument();
    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("shows lower version error when entered version is equal to current on blur", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.2.003");
    input.blur();

    expect(await screen.findByText(VERSION_LOWER_ERROR)).toBeInTheDocument();
    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("shows lower version error when entered version is higher than current", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.2.004");
    input.blur();

    expect(await screen.findByText(VERSION_LOWER_ERROR)).toBeInTheDocument();
    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("shows duplicate version error when entered version already exists in the library set", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.2.002");
    input.blur();

    expect(
      await screen.findByText(VERSION_DUPLICATE_ERROR)
    ).toBeInTheDocument();
    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });

  it("enables Save for a lower and unique version and clears stale errors", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.2.002");
    input.blur();
    expect(
      await screen.findByText(VERSION_DUPLICATE_ERROR)
    ).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "3.1.999");
    input.blur();

    await waitFor(() => {
      expect(
        screen.queryByText(VERSION_DUPLICATE_ERROR)
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("change-version-save-button")).toBeEnabled();
  });

  it("does not treat the selected current library row as a duplicate", async () => {
    mockGetLibrariesByLibrarySetId.mockResolvedValue([
      { ...selectedLibrary, version: "3.1.999" },
      library({ id: "l-2", version: "3.1.998" }),
    ]);
    renderDialog({
      libraries: [{ ...selectedLibrary, version: "3.2.003" } as CqlLibrary],
    });
    await waitForVersionsLoaded(2);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.1.999");
    input.blur();

    await waitFor(() => {
      expect(
        screen.queryByText(VERSION_DUPLICATE_ERROR)
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("change-version-save-button")).toBeEnabled();
  });

  it("calls submit with expected payload when Save is clicked", async () => {
    const { onSubmit } = renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.1.999");
    input.blur();
    await waitFor(() =>
      expect(screen.getByTestId("change-version-save-button")).toBeEnabled()
    );

    await userEvent.click(screen.getByTestId("change-version-save-button"));

    expect(onSubmit).toHaveBeenCalledWith({
      library: selectedLibrary,
      inCorrectVersion: "3.2.003",
      draftVersion: "3.1.999",
    });
  });

  it("disables Save while submit is in flight to prevent duplicate clicks", async () => {
    renderDialog({ isSubmitting: true });
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "3.1.999");
    input.blur();

    expect(screen.getByTestId("change-version-save-button")).toBeDisabled();
  });
});
