import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { CqlLibrary } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import TransferDialog, {
  INVALID_HARP_ID_MESSAGE,
  TRANSFER_LIBRARY_SUCCESS,
  TRANSFER_LIBRARY_FAILURE,
} from "./TransferDialog";
import { useUserRoles } from "../../../../hooks/useUserRoles";

jest.mock("../../../../hooks/useUserRoles", () => ({
  useUserRoles: jest.fn(() => ({ roles: [], isAdmin: false })),
}));

const mockTransferLibraries = jest.fn();
jest.mock("../../../../api/useCqlLibraryServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    transferLibraries: mockTransferLibraries,
  })),
}));

const mockUseUserRoles = useUserRoles as jest.Mock;

const librariesFixture: Partial<CqlLibrary>[] = [
  {
    id: "1",
    cqlLibraryName: "Library 1",
    model: "Model A" as any,
    librarySet: { id: "1", librarySetId: "ls1", owner: "owner1" },
  },
  {
    id: "2",
    cqlLibraryName: "Library 2",
    model: "Model B" as any,
    librarySet: { id: "2", librarySetId: "ls2", owner: "owner2" },
  },
  {
    id: "3",
    cqlLibraryName: "Library 3",
    model: "Model C" as any,
    librarySet: { id: "3", librarySetId: "ls3", owner: "owner1" },
  },
  {
    id: "4",
    cqlLibraryName: "Library 4",
    model: "Model D" as any,
    librarySet: { id: "4", librarySetId: "ls4", owner: "owner1" },
  },
  {
    id: "5",
    cqlLibraryName: "Library 5",
    model: "Model E" as any,
    librarySet: { id: "5", librarySetId: "ls5", owner: "owner1" },
  },
  {
    id: "6",
    cqlLibraryName: "Library 6",
    model: "Model F" as any,
    librarySet: { id: "6", librarySetId: "ls6", owner: "owner3" },
  },
];

describe("Transfer Libraries Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserRoles.mockReturnValue({ roles: [], isAdmin: false });
    mockTransferLibraries.mockResolvedValue({ status: 200 });
  });

  const checkDataRows = async (number: number) => {
    const tableBody = getByTestId("transfer-library-tbl-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };

  describe("Regular user (non-admin)", () => {
    it("renders the dialog correctly with all expected static elements", () => {
      const libraries = [
        {
          cqlLibraryName: "Library 1",
          model: "Model A",
          librarySet: { id: "1", librarySetId: "ls1", owner: "testOwner" },
        },
        {
          cqlLibraryName: "Library 2",
          model: "Model B",
          librarySet: { id: "2", librarySetId: "ls2", owner: "testOwner" },
        },
      ];
      render(
        <TransferDialog
          libraries={libraries as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      // dialog, title, and action buttons are present
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();
      expect(
        screen.getByText("Transfer Library Ownership")
      ).toBeInTheDocument();
      expect(getByTestId("transfer-cancel-button")).toBeInTheDocument();
      expect(getByTestId("transfer-save-button")).toBeInTheDocument();

      // info text with library count
      expect(
        screen.getByText(/You are about to Transfer ownership of the/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /selected library\(s\) below\. All versions and drafts will be transferred, but only the most recent library name appears in the list below\./i
        )
      ).toBeInTheDocument();

      // "This action cannot be undone." warning is shown for regular user
      expect(
        screen.getByText("This action cannot be undone.")
      ).toBeInTheDocument();

      // Owner section header and Current Library Owner ReadOnlyTextField are shown
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Current Library Owner")).toBeInTheDocument();

      // table does NOT have a "Current Library Owner" column
      const table = getByTestId("transfer-library-tbl");
      expect(
        within(table).queryByText("Current Library Owner")
      ).not.toBeInTheDocument();

      // New Library Owner input and retain share access checkbox are present
      expect(getByTestId("harp-id-input")).toBeInTheDocument();
      expect(getByTestId("retainShareAccess")).toBeInTheDocument();

      // Transfer button is disabled initially (form untouched)
      expect(getByTestId("transfer-save-button")).toBeDisabled();
    });

    it("enables the transfer button when a harp id is entered", () => {
      render(
        <TransferDialog
          libraries={[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newOwner" },
      });

      expect(getByTestId("transfer-save-button")).not.toBeDisabled();
    });

    it("keeps the transfer button disabled when only the retain share access checkbox is checked", () => {
      render(
        <TransferDialog
          libraries={[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      fireEvent.click(getByTestId("retainShareAccess"));

      expect(getByTestId("transfer-save-button")).toBeDisabled();
    });

    it("displays validation error when new library owner is not provided", async () => {
      render(
        <TransferDialog
          libraries={[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      fireEvent.blur(getByTestId("harp-id-input"));

      expect(
        await screen.findByText("New Library Owner is required.")
      ).toBeInTheDocument();
    });

    it("transfers the libraries and reports success when the form is submitted", async () => {
      const onCloseMock = jest.fn();
      const setStatusHandlerMock = jest.fn();
      const libraries = [
        { id: "1", cqlLibraryName: "Library 1", model: "Model A" },
      ];

      render(
        <TransferDialog
          libraries={libraries as CqlLibrary[]}
          open={true}
          onClose={onCloseMock}
          setStatusHandler={setStatusHandlerMock}
        />
      );

      await checkDataRows(1);

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newOwner" },
      });
      fireEvent.click(getByTestId("retainShareAccess"));
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(mockTransferLibraries).toHaveBeenCalledWith(
          ["1"],
          "newOwner",
          true
        );
      });
      expect(onCloseMock).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: TRANSFER_LIBRARY_SUCCESS,
        toastOpen: true,
      });
      // the parent status banner is reset before the call
      expect(setStatusHandlerMock).toHaveBeenCalled();
    });

    it("reports the libraries that could not be transferred on a partial success", async () => {
      const onCloseMock = jest.fn();
      const setStatusHandlerMock = jest.fn();
      mockTransferLibraries.mockResolvedValue({ status: 207, data: ["2"] });

      render(
        <TransferDialog
          libraries={librariesFixture as CqlLibrary[]}
          open={true}
          onClose={onCloseMock}
          setStatusHandler={setStatusHandlerMock}
        />
      );

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newOwner" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(setStatusHandlerMock).toHaveBeenCalledWith({
          warning: {
            status: true,
            primaryMessage:
              "1 library could not be transferred. Please try again, or contact help desk if the issue persists.",
            secondaryMessages: ["Library 2"],
          },
        });
      });
      // closes and refreshes without a toast
      expect(onCloseMock).toHaveBeenCalledWith({
        toastType: "success",
        toastOpen: false,
      });
    });

    it("pluralizes the partial success message when several libraries fail", async () => {
      const setStatusHandlerMock = jest.fn();
      mockTransferLibraries.mockResolvedValue({
        status: 207,
        data: ["1", "2"],
      });

      render(
        <TransferDialog
          libraries={librariesFixture as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={setStatusHandlerMock}
        />
      );

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newOwner" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(setStatusHandlerMock).toHaveBeenCalledWith({
          warning: {
            status: true,
            primaryMessage:
              "2 libraries could not be transferred. Please try again, or contact help desk if the issue persists.",
            secondaryMessages: ["Library 1", "Library 2"],
          },
        });
      });
    });

    it("displays a field level error and keeps the dialog open for an invalid harp id", async () => {
      const onCloseMock = jest.fn();
      mockTransferLibraries.mockRejectedValue({
        response: {
          status: 400,
          data: { message: INVALID_HARP_ID_MESSAGE },
        },
      });

      render(
        <TransferDialog
          libraries={[]}
          open={true}
          onClose={onCloseMock}
          setStatusHandler={jest.fn()}
        />
      );

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "invalidUser" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(screen.getByText(INVALID_HARP_ID_MESSAGE)).toBeInTheDocument();
      });
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it("reports a failure toast for any other error", async () => {
      const onCloseMock = jest.fn();
      mockTransferLibraries.mockRejectedValue({
        response: { status: 500 },
      });

      render(
        <TransferDialog
          libraries={[]}
          open={true}
          onClose={onCloseMock}
          setStatusHandler={jest.fn()}
        />
      );

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newOwner" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalledWith({
          toastType: "danger",
          toastMessage: TRANSFER_LIBRARY_FAILURE,
          toastOpen: true,
        });
      });
    });

    it("should handle limit change", async () => {
      render(
        <TransferDialog
          libraries={librariesFixture as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      expect(getByTestId("transfer-library-tbl")).toBeInTheDocument();
      expect(getByTestId("library-name-Library 1-content")).toHaveTextContent(
        "Library 1"
      );
      expect(getByTestId("library-name-Library 2-content")).toHaveTextContent(
        "Library 2"
      );
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();

      // change limit
      const [combobox] = await screen.findAllByText("5");
      userEvent.click(combobox);
      const pageLimit10 = screen.getByRole("option", {
        name: /10/i,
      });
      userEvent.click(pageLimit10);
      await checkDataRows(6);
    });

    it("should handle page change", async () => {
      render(
        <TransferDialog
          libraries={librariesFixture as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      expect(getByTestId("transfer-library-tbl")).toBeInTheDocument();
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();

      await checkDataRows(5);

      const page2 = await screen.findByLabelText("Go to page 2");
      userEvent.click(page2);
      // confirm there is 1 item on page
      const tableBody = getByTestId("transfer-library-tbl-body");
      await waitFor(() => {
        expect(tableBody?.querySelectorAll("tbody tr")).toHaveLength(1);
      });
    });

    it("should display formatted owner name in Current Library Owner field", async () => {
      const library = {
        cqlLibraryName: "Library 1",
        model: "Model A",
        ownerDisplayName: "John Doe",
        librarySet: { id: "1", librarySetId: "ls1", owner: "john_doe" },
      };

      render(
        <TransferDialog
          libraries={[library] as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      expect(
        await screen.findByText("John Doe (john_doe)")
      ).toBeInTheDocument();
    });

    it("should fall back to harpId in Current Library Owner field when ownerDisplayName is missing", async () => {
      const library = {
        cqlLibraryName: "Library 1",
        model: "Model A",
        librarySet: { id: "1", librarySetId: "ls1", owner: "john_doe" },
      };

      render(
        <TransferDialog
          libraries={[library] as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      expect(await screen.findByText("john_doe")).toBeInTheDocument();
    });
  });

  describe("Admin user", () => {
    beforeEach(() => {
      mockUseUserRoles.mockReturnValue({
        roles: ["MADiE-Admin"],
        isAdmin: true,
      });
    });

    it("renders the dialog correctly with all expected static elements for admin", () => {
      const libraries = [
        {
          cqlLibraryName: "Library 1",
          model: "Model A",
          librarySet: { id: "1", librarySetId: "ls1", owner: "ownerA" },
        },
        {
          cqlLibraryName: "Library 2",
          model: "Model B",
          librarySet: { id: "2", librarySetId: "ls2", owner: "ownerB" },
        },
      ];
      render(
        <TransferDialog
          libraries={libraries as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      // dialog, title, and action buttons are present
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();
      expect(
        screen.getByText("Transfer Library Ownership")
      ).toBeInTheDocument();
      expect(getByTestId("transfer-cancel-button")).toBeInTheDocument();
      expect(getByTestId("transfer-save-button")).toBeInTheDocument();

      // info text with library count
      expect(
        screen.getByText(/You are about to Transfer ownership of the/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /selected library\(s\) below\. All versions and drafts will be transferred, but only the most recent library name appears in the list below\./i
        )
      ).toBeInTheDocument();

      // "This action cannot be undone." warning is NOT shown for admin
      expect(
        screen.queryByText("This action cannot be undone.")
      ).not.toBeInTheDocument();

      // the Owner section header is shown for both roles; only the read-only
      // Current Library Owner field is hidden from admins
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.queryByTestId("current-owner")).not.toBeInTheDocument();

      // table HAS a "Current Library Owner" column with per-library owner data
      const table = getByTestId("transfer-library-tbl");
      expect(
        within(table).getByText("Current Library Owner")
      ).toBeInTheDocument();
      expect(within(table).getByText("ownerA")).toBeInTheDocument();
      expect(within(table).getByText("ownerB")).toBeInTheDocument();

      // New Library Owner input and retain share access checkbox are present
      expect(getByTestId("harp-id-input")).toBeInTheDocument();
      expect(getByTestId("retainShareAccess")).toBeInTheDocument();

      // Transfer button is disabled initially (form untouched)
      expect(getByTestId("transfer-save-button")).toBeDisabled();
    });

    it("transfers the libraries when admin submits the form", async () => {
      const onCloseMock = jest.fn();
      const libraries = [
        {
          id: "1",
          cqlLibraryName: "Library 1",
          model: "Model A",
          librarySet: { id: "1", librarySetId: "ls1", owner: "owner1" },
        },
      ];

      render(
        <TransferDialog
          libraries={libraries as CqlLibrary[]}
          open={true}
          onClose={onCloseMock}
          setStatusHandler={jest.fn()}
        />
      );

      await checkDataRows(1);

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "newAdminOwner" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(mockTransferLibraries).toHaveBeenCalledWith(
          ["1"],
          "newAdminOwner",
          false
        );
      });
      expect(onCloseMock).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: TRANSFER_LIBRARY_SUCCESS,
        toastOpen: true,
      });
    });

    it("should display formatted owner name in Current Library Owner column for admin", () => {
      const libraries = [
        {
          cqlLibraryName: "Library 1",
          model: "Model A",
          ownerDisplayName: "John Doe",
          librarySet: { id: "1", librarySetId: "ls1", owner: "john_doe" },
        },
        {
          cqlLibraryName: "Library 2",
          model: "Model B",
          ownerDisplayName: "Jane Doe",
          librarySet: { id: "2", librarySetId: "ls2", owner: "jane_doe" },
        },
      ];

      render(
        <TransferDialog
          libraries={libraries as CqlLibrary[]}
          open={true}
          onClose={jest.fn()}
          setStatusHandler={jest.fn()}
        />
      );

      const table = getByTestId("transfer-library-tbl");
      expect(
        within(table).getByText("John Doe (john_doe)")
      ).toBeInTheDocument();
      expect(
        within(table).getByText("Jane Doe (jane_doe)")
      ).toBeInTheDocument();
    });
  });
});
