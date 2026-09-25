import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure } from "@madie/madie-models";
import ChangeVersionDialog, {
  VERSION_DUPLICATE_ERROR,
  VERSION_CHANGE_CRITERIA,
} from "./ChangeVersionDialog";
import { VERSION_LOWER_ERROR } from "../../../../util/versionUtils";

const mockGetMeasuresByMeasureSetId = jest.fn();
jest.mock("../../../../api/useMeasureServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getMeasuresByMeasureSetId: (...args: unknown[]) =>
      mockGetMeasuresByMeasureSetId(...args),
  })),
}));

const measure = (overrides: any = {}) =>
  ({
    id: "m-latest",
    measureSetId: "set-1",
    measureName: "Ambulatory Sensitive Conditions Admissions: Heart Failure",
    version: "3.2.003",
    lastModifiedAt: "2026-05-10T12:00:00.000Z",
    measureMetaData: { draft: false },
    ...overrides,
  } as unknown as Measure);

const selectedMeasure = measure();
const measureSet = [
  measure({ id: "m-1", version: "3.2.001", lastModifiedAt: "2026-04-12" }),
  selectedMeasure,
  measure({ id: "m-2", version: "3.2.002", lastModifiedAt: "2026-04-13" }),
];

const waitForVersionsLoaded = async (count: number) =>
  waitFor(() =>
    expect(screen.getByTestId("measure-versions-toggle")).toHaveTextContent(
      `Measure Versions (${count})`
    )
  );

describe("ChangeVersionDialog", () => {
  const renderDialog = (
    overrides: Partial<React.ComponentProps<typeof ChangeVersionDialog>> = {}
  ) => {
    const onClose = jest.fn();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
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
    mockGetMeasuresByMeasureSetId.mockResolvedValue(measureSet);
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
        open={false}
        onClose={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("renders nothing when more than one measure is selected", () => {
    const { container } = render(
      <ChangeVersionDialog
        measures={[selectedMeasure, measure({ id: "other" })]}
        open
        onClose={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title, criteria, selected measure and version fields", async () => {
    renderDialog();

    await waitForVersionsLoaded(3);
    expect(mockGetMeasuresByMeasureSetId).toHaveBeenCalledWith("set-1", true);

    expect(screen.getByText("Change Version #")).toBeInTheDocument();
    expect(screen.getByText("Indicates required field")).toBeInTheDocument();

    expect(screen.getByTestId("selected-measure-name")).toHaveTextContent(
      selectedMeasure.measureName
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
    renderDialog();

    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    userEvent.type(input, "4.0.000");
    await waitFor(() => expect(input).toHaveValue("4.0.000"));
  });

  it("toggles the measure versions panel and lists versions newest first", async () => {
    renderDialog();

    await waitForVersionsLoaded(3);
    const toggle = screen.getByTestId("measure-versions-toggle");
    expect(
      screen.queryByTestId("measure-versions-panel")
    ).not.toBeInTheDocument();

    userEvent.click(toggle);

    const panel = await screen.findByTestId("measure-versions-panel");
    expect(within(panel).getByText("Version #")).toBeInTheDocument();
    expect(within(panel).getByText("Measure Name")).toBeInTheDocument();
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
        screen.queryByTestId("measure-versions-panel")
      ).not.toBeInTheDocument()
    );
  });

  it("shows an empty panel when the measure set lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetMeasuresByMeasureSetId.mockRejectedValue(new Error("boom"));

    renderDialog();

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    userEvent.click(screen.getByTestId("measure-versions-toggle"));
    expect(await screen.findByText("No versions found.")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("closes when Cancel is clicked", async () => {
    const { onClose } = renderDialog();

    await waitForVersionsLoaded(3);
    userEvent.click(screen.getByTestId("change-version-cancel-button"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("keeps Save disabled on initial render", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

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

  it("shows duplicate version error when entered version already exists on another measure", async () => {
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

  it("keeps Save disabled for malformed input", async () => {
    renderDialog();
    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    await userEvent.type(input, "not a version");
    input.blur();

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

  it("does not treat the selected current measure row as a duplicate", async () => {
    mockGetMeasuresByMeasureSetId.mockResolvedValue([
      { ...selectedMeasure, version: "3.1.999" },
      measure({ id: "m-2", version: "3.1.998" }),
    ]);
    renderDialog({
      measures: [{ ...selectedMeasure, version: "3.2.003" }],
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
      measure: selectedMeasure,
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
