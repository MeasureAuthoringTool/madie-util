import * as React from "react";
import { render, screen } from "@testing-library/react";
import HistoryAction, {
  NOTHING_SELECTED,
  VALID_HISTORY_LIBRARY,
} from "./HistoryAction";
import { CqlLibrary } from "@madie/madie-models";

describe("HistoryAction", () => {
  const baseLibrary: CqlLibrary = {
    id: "123",
    cqlLibraryName: "TestLib",
    model: "QI-Core v4.1.1",
    version: "0.0.000",
    draft: true,
  } as CqlLibrary;

  it("disables button when no library selected", () => {
    render(<HistoryAction libraries={[]} onClick={() => {}} />);
    expect(screen.getByTestId("library-history-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("library-history-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("enables button when exactly one library selected", () => {
    render(<HistoryAction libraries={[baseLibrary]} onClick={() => {}} />);
    expect(screen.getByTestId("library-history-action-btn")).not.toBeDisabled();
    expect(
      screen.getByTestId("library-history-action-tooltip")
    ).toHaveAttribute("aria-label", VALID_HISTORY_LIBRARY);
  });

  it("disables button when multiple libraries selected", () => {
    render(
      <HistoryAction
        libraries={[baseLibrary, { ...baseLibrary, id: "456" }]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("library-history-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("library-history-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });
});
