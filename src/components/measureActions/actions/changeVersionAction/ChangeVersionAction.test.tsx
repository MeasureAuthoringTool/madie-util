import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure } from "@madie/madie-models";
import ChangeVersionAction, {
  NOTHING_SELECTED,
  INELIGIBLE_MEASURE,
  VALID_CHANGE_VERSION,
} from "./ChangeVersionAction";

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
    measureName: "Test Measure",
    version: "3.2.003",
    measureMetaData: { draft: false },
    component: false,
    ...overrides,
  } as unknown as Measure);

const latest = measure();
const older = measure({ id: "m-older", version: "3.2.002" });
const draft = measure({
  id: "m-draft",
  version: "3.2.003",
  measureMetaData: { draft: true },
});

const tooltip = () => screen.getByTestId("change-version-action-tooltip");
const button = () => screen.getByTestId("change-version-action-btn");

describe("ChangeVersionAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMeasuresByMeasureSetId.mockResolvedValue([latest, older]);
  });

  it("is disabled with the nothing-selected tooltip when no measure is selected", async () => {
    render(<ChangeVersionAction measures={[]} onClick={jest.fn()} />);

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", NOTHING_SELECTED);
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("is disabled with the nothing-selected tooltip when more than one measure is selected", async () => {
    render(
      <ChangeVersionAction measures={[latest, older]} onClick={jest.fn()} />
    );

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", NOTHING_SELECTED);
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("is enabled when the only selected measure is the latest version and the set has no draft", async () => {
    render(<ChangeVersionAction measures={[latest]} onClick={jest.fn()} />);

    await waitFor(() => expect(button()).not.toBeDisabled());
    expect(tooltip()).toHaveAttribute("aria-label", VALID_CHANGE_VERSION);
    expect(mockGetMeasuresByMeasureSetId).toHaveBeenCalledWith("set-1", true);
  });

  it("is disabled when the selected measure is a draft", async () => {
    render(<ChangeVersionAction measures={[draft]} onClick={jest.fn()} />);

    await waitFor(() =>
      expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_MEASURE)
    );
    expect(button()).toBeDisabled();
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("is disabled when the selected measure is a component of a composite measure", async () => {
    render(
      <ChangeVersionAction
        measures={[measure({ component: true })]}
        onClick={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_MEASURE)
    );
    expect(button()).toBeDisabled();
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("is disabled when the selected measure is not the latest version in the set", async () => {
    render(<ChangeVersionAction measures={[older]} onClick={jest.fn()} />);

    await waitFor(() =>
      expect(mockGetMeasuresByMeasureSetId).toHaveBeenCalledWith("set-1", true)
    );
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_MEASURE);
  });

  it("is disabled when the set contains a draft, even for the latest version", async () => {
    mockGetMeasuresByMeasureSetId.mockResolvedValue([draft, latest, older]);

    render(<ChangeVersionAction measures={[latest]} onClick={jest.fn()} />);

    await waitFor(() =>
      expect(mockGetMeasuresByMeasureSetId).toHaveBeenCalledWith("set-1", true)
    );
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_MEASURE);
  });

  it("is disabled when the measure set lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetMeasuresByMeasureSetId.mockRejectedValue(new Error("boom"));

    render(<ChangeVersionAction measures={[latest]} onClick={jest.fn()} />);

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_MEASURE);
    consoleError.mockRestore();
  });

  it("calls onClick when the enabled icon is clicked", async () => {
    const onClick = jest.fn();
    render(<ChangeVersionAction measures={[latest]} onClick={onClick} />);

    await waitFor(() => expect(button()).not.toBeDisabled());
    userEvent.click(button());

    expect(onClick).toHaveBeenCalled();
  });
});
