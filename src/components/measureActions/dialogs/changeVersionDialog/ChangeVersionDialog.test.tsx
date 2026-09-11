import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure } from "@madie/madie-models";
import ChangeVersionDialog, {
  VERSION_CHANGE_CRITERIA,
} from "./ChangeVersionDialog";

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
    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
        open
        onClose={jest.fn()}
      />
    );

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
    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
        open
        onClose={jest.fn()}
      />
    );

    await waitForVersionsLoaded(3);

    const input = screen.getByTestId("new-version-number-input");
    userEvent.type(input, "4.0.000");
    await waitFor(() => expect(input).toHaveValue("4.0.000"));
  });

  it("toggles the measure versions panel and lists versions newest first", async () => {
    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
        open
        onClose={jest.fn()}
      />
    );

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

    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
        open
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    userEvent.click(screen.getByTestId("measure-versions-toggle"));
    expect(await screen.findByText("No versions found.")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("closes when Cancel is clicked", async () => {
    const onClose = jest.fn();
    render(
      <ChangeVersionDialog
        measures={[selectedMeasure]}
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
        measures={[selectedMeasure]}
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
