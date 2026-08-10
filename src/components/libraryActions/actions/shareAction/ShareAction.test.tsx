import React from "react";
import { render, screen } from "@testing-library/react";
import ShareAction, {
  NOTHING_SELECTED,
  INVALID_SHARE_LIBRARY,
  VALID_SHARE_LIBRARY,
  SHARED_TAB_NOTHING_SELECTED,
  SHARED_TAB_INVALID_UNSHARE_LIBRARY,
  SHARED_TAB_UNSHARE,
} from "./ShareAction";
import userEvent from "@testing-library/user-event";
import { useUserRoles } from "../../../../madie-madie-util";

const defaultProps = {
  libraries: [{ id: "1", name: "Lib1" }] as any,
  onClick: jest.fn(),
  canEdit: true,
  userName: "testuser",
  owners: ["testuser"],
  isSharedWithUser: true,
  activeTab: 0,
};

const mockUser = "test user";

const mockLibrarySet = {
  librarySetId: "1-2-3-4",
  owner: mockUser,
} as unknown as LibrarySet;

const mockLibrary = {
  librarySet: { ...mockLibrarySet },
  librarySetId: "1-2-3-4",
} as unknown as CqlLibrary;

const onClick = jest.fn();

jest.mock("../../../../madie-madie-util", () => ({
  useUserRoles: jest.fn().mockReturnValue({ isAdmin: false, roles: [] }),
}));

describe("ShareAction", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should disable share action btn if no library is selected", () => {
    render(
      <ShareAction
        libraries={[]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={""}
        owners={[]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable share action btn if user selects one library but isOwner is false", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        canEdit={false}
        isSharedWithUser={false}
        activeTab={0}
        userName={""}
        owners={[]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      INVALID_SHARE_LIBRARY
    );
  });

  it("Should enable share action btn if user selects one library and isOwner is true", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_LIBRARY
    );
  });

  it("Should enable share action btn if user selects two Libraries and isOwner is true", () => {
    const mockLibrary2 = { ...mockLibrary, id: "2" };
    render(
      <ShareAction
        libraries={[mockLibrary, mockLibrary2]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_LIBRARY
    );
  });

  it("Should render both 'Share With' and 'Unshare' options on Owned Libraries tab", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    userEvent.click(shareButton);

    expect(screen.getByTestId("Share With-option")).toBeInTheDocument();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should render both 'Share With' and 'Unshare' options on All Libraries tab", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={2}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    userEvent.click(shareButton);

    expect(screen.getByTestId("Share With-option")).toBeInTheDocument();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Share With' menu item is clicked", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_LIBRARY
    );

    userEvent.click(shareButton);

    const shareWithMenuItem = screen.getByTestId("Share With-option");
    expect(shareWithMenuItem).toBeInTheDocument();

    userEvent.click(screen.getByRole("menuitem", { name: "Share With" }));
    expect(onClick).toHaveBeenCalledWith("Share With");
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Unshare' menu item is clicked", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={0}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_LIBRARY
    );

    userEvent.click(shareButton);

    const unshareMenuItem = screen.getByTestId("Unshare-option");
    expect(unshareMenuItem).toBeInTheDocument();

    userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));
    expect(onClick).toHaveBeenCalledWith("Unshare");
  });

  it("All Libraries tab: Should disable share action btn if no library selected", () => {
    render(
      <ShareAction
        libraries={[]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={2}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable share action btn if no library is selected in shared libraries", () => {
    render(
      <ShareAction
        libraries={[]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_NOTHING_SELECTED
    );
  });

  it("Should enable share action btn if user selects one library from shared libraries", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={false}
        isSharedWithUser={true}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );
  });

  it("Should enable share action btn if user selects more than one library from shared libraries", () => {
    const mockLibrary2 = { ...mockLibrary, id: "2" };
    render(
      <ShareAction
        libraries={[mockLibrary, mockLibrary2]}
        onClick={onClick}
        canEdit={false}
        isSharedWithUser={true}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );
  });

  it("Should render only 'Unshare' option on Shared Libraries tab", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={() => {}}
        canEdit={true}
        isSharedWithUser={true}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    userEvent.click(shareButton);

    expect(screen.queryByTestId("Share With-option")).toBeNull();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Unshare' menu item is clicked", () => {
    const onClick = jest.fn();

    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={true}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );

    userEvent.click(shareButton);

    const unshareMenuItem = screen.getByTestId("Unshare-option");
    expect(unshareMenuItem).toBeInTheDocument();

    userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));
    expect(onClick).toHaveBeenCalledWith("Unshare");
  });

  it("should display SHARED_TAB_INVALID_UNSHARE_LIBRARY error message for unshared libraries", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );

    // should disable unshare button and display SHARED_TAB_INVALID_UNSHARE_LIBRARY tooltip
    const shareActionTooltip = screen.getByTestId("share-action-tooltip");
    expect(shareActionTooltip).toHaveAttribute(
      "aria-label",
      SHARED_TAB_INVALID_UNSHARE_LIBRARY
    );
  });

  it("should disable share action btn if activeTab is invalid", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={true}
        isSharedWithUser={false}
        activeTab={3}
        userName={"test user"}
        owners={["test user"]}
      />
    );

    const shareActionBtn = screen.getByTestId("share-action-btn");
    expect(shareActionBtn).toBeDisabled();
  });
});

describe("Admin user share library", () => {
  beforeEach(() => {
    (useUserRoles as jest.Mock).mockReturnValue({ isAdmin: true });
  });

  it("Should enable share action btn for shared libraries even if user is not shared with and display appropriate tooltip", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={onClick}
        canEdit={false}
        isSharedWithUser={false}
        activeTab={1}
        userName={"test user"}
        owners={["test user"]}
      />
    );

    const shareActionTooltip = screen.getByTestId("share-action-tooltip");
    expect(shareActionTooltip).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );
  });
});
