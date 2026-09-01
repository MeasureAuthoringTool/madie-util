import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransferAction, {
  NOTHING_SELECTED,
  CANNOT_TRANSFER,
  MORE_THAN_ONE_NOT_OWNED,
  TRANSFER,
} from "./TransferAction";
import { CqlLibrary, LibrarySet } from "@madie/madie-models";
import { useUserRoles } from "../../../../hooks/useUserRoles";
import checkUserCanEdit from "../../../../util/useCheckCanEdit";

const mockUser = "test user";

const mockLibrarySet = {
  librarySetId: "1-2-3-4",
  owner: mockUser,
} as unknown as LibrarySet;

const mockLibrary = {
  librarySet: { ...mockLibrarySet },
  librarySetId: "1-2-3-4",
} as unknown as CqlLibrary;

jest.mock("../../../../hooks/useUserRoles", () => ({
  useUserRoles: jest.fn(() => ({ roles: [], isAdmin: false })),
}));

jest.mock("../../../../util/useCheckCanEdit", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

describe("TransferAction Component", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    (useUserRoles as jest.Mock).mockReturnValue({ isAdmin: false, roles: [] });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => true);
  });

  it("disables the button and shows 'Select a library to transfer' tooltip when no libraries are selected", () => {
    render(<TransferAction libraries={[]} onClick={() => {}} activeTab={0} />);
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("disables the button and shows 'You cannot transfer a library you do not own' tooltip when activeTab is 1", () => {
    render(
      <TransferAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        activeTab={1}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", CANNOT_TRANSFER);
  });

  it("disables the button and shows 'You cannot transfer a library you do not own, you have selected at least 1 library that you do not own' tooltip when activeTab is 2 and user does not own all libraries", () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
    const testLibrarySet = { ...mockLibrarySet, owner: "anotherUser" };
    const testLibrary = { ...mockLibrary, librarySet: testLibrarySet };

    render(
      <TransferAction
        libraries={[testLibrary]}
        onClick={() => {}}
        activeTab={2}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", MORE_THAN_ONE_NOT_OWNED);
  });

  it("enables the button and shows 'Transfer' tooltip when user owns all selected libraries and activeTab is not 1 or 2", () => {
    render(
      <TransferAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        activeTab={0}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).not.toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", TRANSFER);
  });

  it("calls the onClick handler when the button is enabled and clicked", async () => {
    render(
      <TransferAction
        libraries={[mockLibrary]}
        onClick={mockOnClick}
        activeTab={0}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");

    await userEvent.click(button);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it("enables the button and shows 'Transfer' tooltip for admin user", () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      isAdmin: true,
      roles: ["MADiE-admin"],
    });

    render(
      <TransferAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        activeTab={1}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).not.toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", TRANSFER);
  });

  it("enables the button and shows 'Transfer' tooltip when activeTab is 2 and user owns all selected libraries", () => {
    render(
      <TransferAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        activeTab={2}
      />
    );
    const button = screen.getByTestId("transfer-action-btn");
    const tooltip = screen.getByTestId("transfer-action-tooltip");

    expect(button).not.toBeDisabled();
    expect(tooltip).toHaveAttribute("aria-label", TRANSFER);
  });
});
