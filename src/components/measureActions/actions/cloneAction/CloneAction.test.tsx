import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure, Model } from "@madie/madie-models";
import CloneAction, {
  INELIGIBLE_CLONE_SELECTION,
  VALID_CLONE,
} from "./CloneAction";

const qiCoreMeasure = {
  id: "m-qicore",
  model: Model.QICORE,
  measureSetId: "set-1",
} as unknown as Measure;

const qdmMeasure = {
  id: "m-qdm",
  model: Model.QDM_5_6,
  measureSetId: "set-2",
} as unknown as Measure;

const tooltip = () => screen.getByTestId("clone-action-tooltip");
const button = () => screen.getByTestId("clone-action-btn");

describe("CloneAction", () => {
  it("is disabled when no measure is selected", () => {
    render(<CloneAction measures={[]} />);

    expect(button()).toBeDisabled();
    expect(button()).toHaveAccessibleName(VALID_CLONE);
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_CLONE_SELECTION);
  });

  it("is disabled when more than one measure is selected", () => {
    render(<CloneAction measures={[qiCoreMeasure, qdmMeasure]} />);

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_CLONE_SELECTION);
  });

  it.each([
    ["QI-Core", qiCoreMeasure],
    ["QDM", qdmMeasure],
  ])("is enabled when exactly one %s measure is selected", (_, measure) => {
    render(<CloneAction measures={[measure]} />);

    expect(button()).not.toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", VALID_CLONE);
  });

  it("does nothing when the enabled icon is clicked without a handler", () => {
    render(<CloneAction measures={[qiCoreMeasure]} />);

    expect(() => userEvent.click(button())).not.toThrow();
  });

  it("calls onClick when the enabled icon is clicked", () => {
    const onClick = jest.fn();
    render(<CloneAction measures={[qiCoreMeasure]} onClick={onClick} />);

    userEvent.click(button());

    expect(onClick).toHaveBeenCalled();
  });
});
