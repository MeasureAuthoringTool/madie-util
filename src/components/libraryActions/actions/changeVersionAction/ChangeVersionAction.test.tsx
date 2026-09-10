import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary } from "@madie/madie-models";
import ChangeVersionAction, {
  INELIGIBLE_SELECTION,
  VALID_CHANGE_VERSION,
} from "./ChangeVersionAction";

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
    cqlLibraryName: "TestLibrary",
    version: "3.2.003",
    draft: false,
    ...overrides,
  } as unknown as CqlLibrary);

const latest = library();
const older = library({ id: "l-older", version: "3.2.002" });
const draft = library({ id: "l-draft", draft: true });

const tooltip = () => screen.getByTestId("change-version-action-tooltip");
const button = () => screen.getByTestId("change-version-action-btn");

describe("Library ChangeVersionAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLibrariesByLibrarySetId.mockResolvedValue([latest, older]);
  });

  it("is disabled when no library is selected", async () => {
    render(<ChangeVersionAction libraries={[]} onClick={jest.fn()} />);

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("is disabled when more than one library is selected", async () => {
    render(
      <ChangeVersionAction libraries={[latest, older]} onClick={jest.fn()} />
    );

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("is enabled when the only selected library is the latest version and the set has no draft", async () => {
    render(<ChangeVersionAction libraries={[latest]} onClick={jest.fn()} />);

    await waitFor(() => expect(button()).not.toBeDisabled());
    expect(tooltip()).toHaveAttribute("aria-label", VALID_CHANGE_VERSION);
    expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith("set-1", true);
  });

  it("is disabled when the selected library is a draft", async () => {
    render(<ChangeVersionAction libraries={[draft]} onClick={jest.fn()} />);

    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("is disabled when the selected library is not the latest version in the set", async () => {
    render(<ChangeVersionAction libraries={[older]} onClick={jest.fn()} />);

    await waitFor(() =>
      expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith("set-1", true)
    );
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
  });

  it("is disabled when the set contains a draft, even for the latest version", async () => {
    mockGetLibrariesByLibrarySetId.mockResolvedValue([draft, latest, older]);

    render(<ChangeVersionAction libraries={[latest]} onClick={jest.fn()} />);

    await waitFor(() =>
      expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith("set-1", true)
    );
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
  });

  it("is disabled when the library set lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetLibrariesByLibrarySetId.mockRejectedValue(new Error("boom"));

    render(<ChangeVersionAction libraries={[latest]} onClick={jest.fn()} />);

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(button()).toBeDisabled();
    expect(tooltip()).toHaveAttribute("aria-label", INELIGIBLE_SELECTION);
    consoleError.mockRestore();
  });

  it("calls onClick when the enabled icon is clicked", async () => {
    const onClick = jest.fn();
    render(<ChangeVersionAction libraries={[latest]} onClick={onClick} />);

    await waitFor(() => expect(button()).not.toBeDisabled());
    userEvent.click(button());

    expect(onClick).toHaveBeenCalled();
  });
});
