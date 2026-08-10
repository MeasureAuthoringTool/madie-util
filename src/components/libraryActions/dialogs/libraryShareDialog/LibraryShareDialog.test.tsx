import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import LibraryShareDialog, {
  convertDate,
  sortSharedLibraries,
  LIBRARY_SHARING_EXPORT_SUCCESS,
  LIBRARY_SHARING_EXPORT_ERROR,
} from "./LibraryShareDialog";
import { type CqlLibrary } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import { type CqlLibraryServiceApi } from "../../../../api/useCqlLibraryServiceApi";
import {
  useUserRoles,
  useCqlLibraryServiceApi,
  useUserServiceApi,
} from "../../../../madie-madie-util";

jest.mock("file-saver", () => ({ saveAs: jest.fn() }));

const testUser = "test-fake-user@email.com";

jest.mock("../../../../madie-madie-util", () => ({
  useCqlLibraryServiceApi: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => testUser,
  }),
  useUserRoles: jest.fn().mockReturnValue({ isAdmin: false, roles: [] }),
  useUserServiceApi: jest.fn(),
}));

// ============ Test Data Factories ============

const createMockLibrary = (
  id: string,
  name: string,
  acls = [
    { userId: "userId1", roles: ["SHARED_WITH"] },
    { userId: "userId2", roles: ["SHARED_WITH"] },
  ]
): CqlLibrary =>
  ({
    id,
    libraryId: id,
    cqlLibraryName: name,
    cqlErrors: false,
    cql: "library testCql version '1.0.000'",
    librarySetId: `LibrarySet${id}`,
    createdAt: "",
    createdBy: "",
    lastModifiedAt: "",
    lastModifiedBy: "",
    librarySet: { acls },
  } as CqlLibrary);

const mockCqlLibrary1 = createMockLibrary("TestLibraryId1", "mockCqlLibrary1");
const mockCqlLibrary2 = createMockLibrary("TestLibraryId2", "mockCqlLibrary2");

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

// ============ Mock Service Factories ============

const createSharedLibrariesResponse = (libraries: CqlLibrary[]) => {
  const response: Record<string, any[]> = {};
  libraries.forEach((lib) => {
    response[lib.id] =
      lib.librarySet?.acls?.map((acl) => ({
        userId: acl.userId,
        performedAt: yesterday.toISOString(),
      })) || [];
  });
  return response;
};

const createMockLibraryServiceApi = (overrides = {}) =>
  ({
    getSharedLibraries: jest
      .fn()
      .mockResolvedValue(
        createSharedLibrariesResponse([mockCqlLibrary1, mockCqlLibrary2])
      ),
    getRecentLibrariesByLibrarySetId: jest
      .fn()
      .mockResolvedValue([mockCqlLibrary1, mockCqlLibrary2]),
    shareLibraries: jest.fn().mockResolvedValue({
      [mockCqlLibrary1.id]: mockCqlLibrary1.librarySet?.acls,
      [mockCqlLibrary2.id]: mockCqlLibrary2.librarySet?.acls,
    }),
    unshareLibraries: jest.fn().mockResolvedValue({
      [mockCqlLibrary1.id]: mockCqlLibrary1.librarySet?.acls,
    }),
    ...overrides,
  } as unknown as CqlLibraryServiceApi);

const createMockUserServiceApi = (overrides = {}) => ({
  getOwnerDetails: jest.fn().mockResolvedValue({
    harpId: "madietestuser",
    firstName: "Madie",
    lastName: "Test",
    email: "nohid@example.com",
    userStatus: "ACTIVE",
  }),
  getBulkUserDetails: jest.fn().mockImplementation((ids: string[]) => {
    const result: Record<string, { userStatus: string }> = {};
    ids.forEach((id) => {
      result[id] = { userStatus: "ACTIVE" };
    });
    return Promise.resolve(result);
  }),
  ...overrides,
});

// ============ Helper Functions ============

const renderShareDialog = (
  props: Partial<React.ComponentProps<typeof LibraryShareDialog>> = {}
) => {
  const defaultProps = {
    libraries: [mockCqlLibrary1, mockCqlLibrary2],
    open: true,
    option: "Share With",
    onClose: jest.fn(),
  };
  return render(<LibraryShareDialog {...defaultProps} {...props} />);
};

const setupDefaultMocks = (
  apiOverrides = {},
  userApiOverrides = {},
  isAdmin = false
) => {
  (useUserRoles as jest.Mock).mockReturnValue({
    isAdmin,
    roles: isAdmin ? ["MADiE-Admin"] : [],
  });
  (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
    createMockLibraryServiceApi(apiOverrides)
  );
  (useUserServiceApi as jest.Mock).mockReturnValue(
    createMockUserServiceApi(userApiOverrides)
  );
};

const getHarpIdInput = async () =>
  (await screen.findByTestId("harp-id-input")) as HTMLInputElement;

const addHarpIdChip = async (userId: string) => {
  const input = await getHarpIdInput();
  fireEvent.change(input, { target: { value: userId } });
  fireEvent.keyDown(input, { key: "Enter" });
};

const clickAddUserButton = async () => {
  const btn = await screen.findByTestId("add-user-btn");
  fireEvent.click(btn);
};

const waitForDialog = async () => {
  expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
  await screen.findByTestId("share-library-tbl");
};

// ============ Tests ============

describe("LibraryShareDialog", () => {
  beforeEach(() => {
    jest.resetModules();
    setupDefaultMocks();
  });

  describe("Rendering", () => {
    it("renders share dialog with correct title", async () => {
      renderShareDialog();
      expect(screen.getByTestId("share-dialog")).toBeInTheDocument();
      expect(await screen.findByText("Share With...")).toBeInTheDocument();
    });

    it("renders unshare dialog with correct title", async () => {
      renderShareDialog({ option: "Unshare" });
      expect(await screen.findByText("Unshare From...")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      renderShareDialog({ open: false });
      expect(screen.queryByTestId("share-dialog")).toBeNull();
    });

    it("does not render for invalid option", () => {
      renderShareDialog({ option: "InvalidOption" });
      expect(screen.queryByTestId("share-dialog")).toBeNull();
    });

    it("shows HARP ID input only in Share With mode", async () => {
      renderShareDialog();
      expect(await screen.findByTestId("harp-id-input")).toBeInTheDocument();
    });

    it("hides HARP ID input in Unshare mode", async () => {
      renderShareDialog({ option: "Unshare" });
      await waitForDialog();
      expect(screen.queryByTestId("harp-id-input")).toBeNull();
    });

    it("displays share library table with correct headers", async () => {
      renderShareDialog();
      const table = await screen.findByTestId("share-library-tbl");
      const headers = table.querySelectorAll("thead th");
      expect(headers[0]).toHaveTextContent("Library");
      expect(headers[1]).toHaveTextContent("Shared With");
      expect(headers[2]).toHaveTextContent("Date Shared");
    });

    it("displays display name format for API-loaded users in grid", async () => {
      setupDefaultMocks({
        getSharedLibraries: jest.fn().mockResolvedValue({
          [mockCqlLibrary1.id]: [
            {
              userId: "userId1",
              displayName: "John Doe (userId1)",
              performedAt: yesterday.toISOString(),
            },
          ],
          [mockCqlLibrary2.id]: [],
        }),
      });
      renderShareDialog();
      await waitForDialog();

      expect(
        screen.getByTestId(`${mockCqlLibrary1.id} userId1_userId`)
      ).toHaveTextContent("John Doe (userId1)");
    });
  });

  describe("API Calls", () => {
    it("calls getSharedLibraries when libraries are provided", async () => {
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog();
      await waitForDialog();

      expect(mockApi.getSharedLibraries).toHaveBeenCalled();
      expect(mockApi.getRecentLibrariesByLibrarySetId).toHaveBeenCalled();
    });

    it("does not call getSharedLibraries when no libraries provided", () => {
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog({ libraries: [] });

      expect(mockApi.getSharedLibraries).not.toHaveBeenCalled();
    });

    it("displays error message when getSharedLibraries fails", async () => {
      const errorMessage =
        "Unable to retrieve users that the selected library(s) is shared with. If the error persists, please contact the help desk.";
      setupDefaultMocks({
        getSharedLibraries: jest
          .fn()
          .mockRejectedValue(new Error(errorMessage)),
      });

      renderShareDialog();

      expect(await screen.findByText(errorMessage)).toBeVisible();
    });
  });

  describe("Adding Users", () => {
    it("creates chip on Enter key", async () => {
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("newUser1");

      await waitFor(() => {
        expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
          "newUser1"
        );
      });
    });

    it("creates chip on comma key", async () => {
      renderShareDialog();
      await waitForDialog();

      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "newUser1" } });
      fireEvent.keyDown(input, { key: "," });

      await waitFor(() => {
        expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
          "newUser1"
        );
      });
    });

    it("trims whitespace from HARP IDs", async () => {
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("  trimmedUser  ");

      await waitFor(() => {
        expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
          "trimmedUser"
        );
      });
    });

    it("ignores whitespace-only input", async () => {
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("    ");

      await waitFor(() => {
        expect(screen.queryByTestId("harp-id-chip-0")).toBeNull();
      });
    });

    it("prevents duplicate chips", async () => {
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("duplicateUser");
      await addHarpIdChip("duplicateUser");

      await waitFor(() => {
        expect(screen.queryByTestId("harp-id-chip-1")).toBeNull();
      });
    });

    it("enables Add User button when chips exist", async () => {
      renderShareDialog();
      await waitForDialog();

      const addBtn = await screen.findByTestId("add-user-btn");
      expect(addBtn).toBeDisabled();

      await addHarpIdChip("newUser");

      await waitFor(() => expect(addBtn).toBeEnabled());
    });

    it("adds user rows when Add User is clicked", async () => {
      setupDefaultMocks(
        {},
        {
          getBulkUserDetails: jest.fn().mockResolvedValue({
            userId3: {
              userStatus: "ACTIVE",
              firstName: "John",
              lastName: "Doe",
            },
          }),
        }
      );
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("userId3");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByTestId("TestLibraryId1 userId3_userId")
        ).toHaveTextContent("John Doe (userId3)");
        expect(
          screen.getByTestId("TestLibraryId2 userId3_userId")
        ).toHaveTextContent("John Doe (userId3)");
      });
    });

    it("shows error when user already shared with all libraries", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("userId1");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      expect(
        await screen.findByText(
          "The selected library(s) are already shared with the entered user(s)."
        )
      ).toBeVisible();
    });

    it("clears chips after adding users", async () => {
      renderShareDialog();
      await waitForDialog();
      await addHarpIdChip("newUser");

      await waitFor(() =>
        expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument()
      );
      await clickAddUserButton();

      await waitFor(() =>
        expect(screen.queryByTestId("harp-id-chip-0")).toBeNull()
      );
    });

    it("enables Add User button when input has text without creating chip", async () => {
      renderShareDialog();
      await waitForDialog();

      const addBtn = await screen.findByTestId("add-user-btn");
      expect(addBtn).toBeDisabled();

      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "someUser" } });

      await waitFor(() => expect(addBtn).toBeEnabled());
    });

    it("adds user from input text without requiring chip creation", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();

      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "directInputUser" } });
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByTestId("TestLibraryId1 directInputUser_userId")
        ).toHaveTextContent("directInputUser");
      });
    });

    it("displays library name in new row when user is added", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("newUserId");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      await waitFor(() => {
        const newRowCell = screen.getByTestId(
          "TestLibraryId1 newUserId_cqlLibraryName"
        );
        expect(newRowCell).toHaveTextContent("mockCqlLibrary1");
      });
    });

    it("displays library name for each library when adding user to multiple libraries", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1, mockCqlLibrary2] });
      await waitForDialog();
      await addHarpIdChip("multiLibUser");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByTestId("TestLibraryId1 multiLibUser_cqlLibraryName")
        ).toHaveTextContent("mockCqlLibrary1");
        expect(
          screen.getByTestId("TestLibraryId2 multiLibUser_cqlLibraryName")
        ).toHaveTextContent("mockCqlLibrary2");
      });
    });

    it("processes both chips and trailing input value together", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();

      await addHarpIdChip("chipUser");
      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "trailingUser" } });
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByTestId("TestLibraryId1 chipUser_userId")
        ).toHaveTextContent("chipUser");
        expect(
          screen.getByTestId("TestLibraryId1 trailingUser_userId")
        ).toHaveTextContent("trailingUser");
      });
    });

    it("clears input value after adding users", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();

      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "userToClear" } });
      await clickAddUserButton();

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("does nothing when both harpIds and harpInputValue are empty", async () => {
      const mockUserApi = createMockUserServiceApi();
      (useUserServiceApi as jest.Mock).mockReturnValue(mockUserApi);

      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();

      await clickAddUserButton();

      expect(mockUserApi.getBulkUserDetails).not.toHaveBeenCalled();
    });

    it("deduplicates HARP IDs from chips and input", async () => {
      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();

      await addHarpIdChip("sameUser");
      const input = await getHarpIdInput();
      fireEvent.change(input, { target: { value: "sameUser" } });
      await clickAddUserButton();

      await waitFor(() => {
        const rows = screen.getAllByTestId(/TestLibraryId1 sameUser_userId/);
        expect(rows).toHaveLength(1);
      });
    });
  });

  describe("Bulk User Validation", () => {
    it("adds only valid users when some are invalid", async () => {
      setupDefaultMocks(
        {},
        {
          getBulkUserDetails: jest.fn().mockResolvedValue({
            validUser: { userStatus: "ACTIVE" },
            invalidUser: { userStatus: "INACTIVE" },
          }),
        }
      );

      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("validUser");
      await addHarpIdChip("invalidUser");
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByTestId("TestLibraryId1 validUser_userId")
        ).toHaveTextContent("validUser");
        expect(
          screen.getByText(
            /invalidUser.*is not associated with an active MADiE user/i
          )
        ).toBeInTheDocument();
      });
    });

    it("shows toast error when validation fails with server error", async () => {
      setupDefaultMocks(
        {},
        {
          getBulkUserDetails: jest
            .fn()
            .mockRejectedValue({ response: { status: 500 } }),
        }
      );

      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("someUser");
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByText(
            "Unable to validate the provided HARP ID. If the error persists, please contact the help desk."
          )
        ).toBeInTheDocument();
      });
    });

    it("shows field error when validation fails with 400 status", async () => {
      setupDefaultMocks(
        {},
        {
          getBulkUserDetails: jest
            .fn()
            .mockRejectedValue({ response: { status: 400 } }),
        }
      );

      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("badUser");
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByText(
            "The provided HARP ID is not associated with an active MADiE user."
          )
        ).toBeInTheDocument();
      });
    });

    it("shows error message listing multiple invalid users", async () => {
      setupDefaultMocks(
        {},
        {
          getBulkUserDetails: jest.fn().mockResolvedValue({
            invalidUser1: { userStatus: "INACTIVE" },
            invalidUser2: { userStatus: "INACTIVE" },
          }),
        }
      );

      renderShareDialog({ libraries: [mockCqlLibrary1] });
      await waitForDialog();
      await addHarpIdChip("invalidUser1");
      await addHarpIdChip("invalidUser2");
      await clickAddUserButton();

      await waitFor(() => {
        expect(
          screen.getByText(
            /invalidUser1, invalidUser2.*are not associated with an active MADiE user/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("Saving Changes", () => {
    it("saves successfully when sharing users", async () => {
      const mockOnClose = jest.fn();
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog({ onClose: mockOnClose });
      await waitForDialog();
      await addHarpIdChip("userId3");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      const saveBtn = await screen.findByTestId("share-save-button");
      await waitFor(() => expect(saveBtn).toBeEnabled());
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockApi.shareLibraries).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("shows error when shareLibraries API fails", async () => {
      const mockOnClose = jest.fn();
      setupDefaultMocks({
        shareLibraries: jest.fn().mockRejectedValue(new Error("API Error")),
      });

      renderShareDialog({ onClose: mockOnClose });
      await waitForDialog();
      await addHarpIdChip("userId3");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      const saveBtn = await screen.findByTestId("share-save-button");
      await waitFor(() => expect(saveBtn).toBeEnabled());
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith(
          "danger",
          "Unable to share the selected library(s) with the added users. If the error persists, please contact the help desk."
        );
      });
    });

    it("shows API error message when provided in response", async () => {
      const mockOnClose = jest.fn();
      const customErrorMessage = "Custom API error message";
      setupDefaultMocks({
        shareLibraries: jest.fn().mockRejectedValue({
          response: { data: { message: customErrorMessage } },
        }),
      });

      renderShareDialog({ onClose: mockOnClose });
      await waitForDialog();
      await addHarpIdChip("userId3");

      await waitFor(() =>
        expect(screen.findByTestId("add-user-btn")).resolves.toBeEnabled()
      );
      await clickAddUserButton();

      const saveBtn = await screen.findByTestId("share-save-button");
      await waitFor(() => expect(saveBtn).toBeEnabled());
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith("danger", customErrorMessage);
      });
    });

    it("shows error when unshareLibraries API fails", async () => {
      const mockOnClose = jest.fn();
      setupDefaultMocks({
        unshareLibraries: jest.fn().mockRejectedValue(new Error("API Error")),
      });

      renderShareDialog({ option: "Unshare", onClose: mockOnClose });
      await waitForDialog();

      const checkboxes = await screen.findAllByRole("checkbox");
      userEvent.click(checkboxes[0]);

      await waitFor(() => expect(checkboxes[0]).not.toBeChecked());

      const saveBtn = await screen.findByTestId("share-save-button");
      userEvent.click(saveBtn);

      const acceptBtn = await screen.findByTestId(
        "share-confirmation-dialog-accept-button"
      );
      userEvent.click(acceptBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith(
          "danger",
          "Unable to unshare the selected library(s) with the users who were unchecked. If the error persists, please contact the help desk."
        );
      });
    });
  });

  describe("Unsharing Users", () => {
    it("unshares user when checkbox unchecked and saved", async () => {
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog({ option: "Unshare" });
      await waitForDialog();

      const checkboxes = await screen.findAllByRole("checkbox");
      userEvent.click(checkboxes[0]);

      await waitFor(() => expect(checkboxes[0]).not.toBeChecked());

      const saveBtn = await screen.findByTestId("share-save-button");
      userEvent.click(saveBtn);

      const acceptBtn = await screen.findByTestId(
        "share-confirmation-dialog-accept-button"
      );
      userEvent.click(acceptBtn);

      await waitFor(() => expect(mockApi.unshareLibraries).toHaveBeenCalled());
    });

    it("shows confirmation dialog for UnshareFromMe option", () => {
      renderShareDialog({ option: "UnshareFromMe" });

      expect(
        screen.getByTestId("share-confirmation-dialog")
      ).toBeInTheDocument();
      expect(screen.queryByTestId("share-dialog")).toBeNull();
    });

    it("shows select all checkbox only in Unshare mode", async () => {
      renderShareDialog({ option: "Unshare" });
      await waitForDialog();
      expect(screen.getByTestId("shared-with-select-all")).toBeInTheDocument();
    });

    it("hides select all checkbox in Share mode", async () => {
      renderShareDialog({ option: "Share With" });
      await waitForDialog();
      expect(screen.queryByTestId("shared-with-select-all")).toBeNull();
    });

    it("closes confirmation dialog on cancel without unsharing", async () => {
      const mockOnClose = jest.fn();
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog({ option: "Unshare", onClose: mockOnClose });
      await waitForDialog();

      const checkboxes = await screen.findAllByRole("checkbox");
      userEvent.click(checkboxes[0]);

      const saveBtn = await screen.findByTestId("share-save-button");
      userEvent.click(saveBtn);

      const cancelBtn = await screen.findByTestId(
        "share-confirmation-dialog-cancel-button"
      );
      userEvent.click(cancelBtn);

      await waitFor(() => {
        expect(mockApi.unshareLibraries).not.toHaveBeenCalled();
      });
    });

    it("closes dialog when UnshareFromMe confirmation is cancelled", async () => {
      const mockOnClose = jest.fn();
      renderShareDialog({ option: "UnshareFromMe", onClose: mockOnClose });

      const cancelBtn = await screen.findByTestId(
        "share-confirmation-dialog-cancel-button"
      );
      userEvent.click(cancelBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("unshares current user when UnshareFromMe is accepted", async () => {
      const mockOnClose = jest.fn();
      const mockApi = createMockLibraryServiceApi();
      (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(mockApi);

      renderShareDialog({
        option: "UnshareFromMe",
        onClose: mockOnClose,
        libraries: [mockCqlLibrary1],
      });

      const acceptBtn = await screen.findByTestId(
        "share-confirmation-dialog-accept-button"
      );
      userEvent.click(acceptBtn);

      await waitFor(() => {
        expect(mockApi.unshareLibraries).toHaveBeenCalled();
      });
    });

    it("shows display name in confirmation dialog when unsharing", async () => {
      setupDefaultMocks({
        getSharedLibraries: jest.fn().mockResolvedValue({
          [mockCqlLibrary1.id]: [
            {
              userId: "userId1",
              displayName: "John Doe (userId1)",
              performedAt: yesterday.toISOString(),
            },
            {
              userId: "userId2",
              displayName: "Jane Doe (userId2)",
              performedAt: yesterday.toISOString(),
            },
          ],
          [mockCqlLibrary2.id]: [],
        }),
      });
      renderShareDialog({ option: "Unshare", libraries: [mockCqlLibrary1] });
      await waitForDialog();

      const checkboxes = await screen.findAllByRole("checkbox");
      userEvent.click(checkboxes[0]);
      await waitFor(() => expect(checkboxes[0]).not.toBeChecked());

      const saveBtn = await screen.findByTestId("share-save-button");
      userEvent.click(saveBtn);

      expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

      const userListItems = screen.getAllByRole("listitem");
      expect(userListItems[0]).toHaveTextContent("John Doe (userId1)");
    });

    it("shows display name in confirmation dialog for UnshareFromMe", async () => {
      setupDefaultMocks({
        getSharedLibraries: jest.fn().mockResolvedValue({
          [mockCqlLibrary1.id]: [
            {
              userId: testUser,
              displayName: `Test User (${testUser})`,
              performedAt: yesterday.toISOString(),
            },
          ],
        }),
        getRecentLibrariesByLibrarySetId: jest
          .fn()
          .mockResolvedValue([mockCqlLibrary1]),
      });

      renderShareDialog({
        option: "UnshareFromMe",
        libraries: [mockCqlLibrary1],
      });

      await waitFor(() => {
        const userListItems = screen.getAllByRole("listitem");
        expect(userListItems[0]).toHaveTextContent(`Test User (${testUser})`);
      });
    });
  });

  describe("Export Functionality", () => {
    it("shows export button when feature enabled", async () => {
      setupDefaultMocks({}, {}, true);
      renderShareDialog({ option: "Unshare" });

      expect(
        await screen.findByTestId("export-user-list-button")
      ).toBeInTheDocument();
    });

    it("hides export button when feature disabled", async () => {
      setupDefaultMocks({}, {}, false);
      renderShareDialog({ option: "Unshare" });
      await waitForDialog();

      expect(screen.queryByTestId("export-user-list-button")).toBeNull();
    });

    it("shows success toast on successful export", async () => {
      const mockBlob = new Blob(["test"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      setupDefaultMocks(
        {
          getSharedAccessReportForLibraries: jest
            .fn()
            .mockResolvedValue(mockBlob),
        },
        {},
        true
      );

      renderShareDialog({ option: "Unshare" });
      await waitForDialog();

      fireEvent.click(screen.getByTestId("export-user-list-button"));

      await waitFor(() => {
        expect(
          screen.getByText(LIBRARY_SHARING_EXPORT_SUCCESS)
        ).toBeInTheDocument();
      });
    });

    it("shows error toast on failed export", async () => {
      setupDefaultMocks(
        {
          getSharedAccessReportForLibraries: jest
            .fn()
            .mockRejectedValue(new Error()),
        },
        {},
        true
      );

      renderShareDialog({ option: "Unshare" });
      await waitForDialog();

      fireEvent.click(screen.getByTestId("export-user-list-button"));

      await waitFor(() => {
        expect(
          screen.getByText(LIBRARY_SHARING_EXPORT_ERROR)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Button", () => {
    it("calls onClose when clicked", async () => {
      const onCloseMock = jest.fn();
      renderShareDialog({ onClose: onCloseMock });
      await waitForDialog();

      fireEvent.click(await screen.findByTestId("share-cancel-button"));

      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});

describe("convertDate", () => {
  it.each([
    [null, ""],
    [undefined, ""],
    ["", ""],
    ["2025-01-15T12:00:00Z", "1/15/2025"],
    ["2025-12-25T12:00:00Z", "12/25/2025"],
    ["2025-03-01T12:00:00Z", "3/01/2025"],
  ])("converts %s to %s", (input, expected) => {
    expect(convertDate(input)).toBe(expected);
  });
});

describe("sortSharedLibraries", () => {
  const createLibrary = (dateShared: string) => ({
    dateShared,
    libraryId: "1",
    cqlLibraryName: "",
    userId: "",
    subRows: [],
  });

  it("returns -1 when either date is '-'", () => {
    expect(
      sortSharedLibraries(createLibrary("-"), createLibrary("2023-01-01"))
    ).toBe(-1);
    expect(
      sortSharedLibraries(createLibrary("2023-01-01"), createLibrary("-"))
    ).toBe(-1);
  });

  it("sorts by date in descending order", () => {
    expect(
      sortSharedLibraries(
        createLibrary("2023-01-01"),
        createLibrary("2023-06-01")
      )
    ).toBeGreaterThan(0);
    expect(
      sortSharedLibraries(
        createLibrary("2023-12-01"),
        createLibrary("2023-01-01")
      )
    ).toBeLessThan(0);
    expect(
      sortSharedLibraries(
        createLibrary("2023-06-15"),
        createLibrary("2023-06-15")
      )
    ).toBe(0);
  });
});
