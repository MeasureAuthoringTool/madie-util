import React, { useEffect, useRef } from "react";
import {
  MadieDialog,
  TextField,
  ReadOnlyTextField,
  FormControlLabel,
} from "@madie/madie-design-system/dist/react";
import { CqlLibrary } from "@madie/madie-models";
import { useFormik } from "formik";
import { Checkbox, Divider } from "@mui/material";
import "../../../transferDialog.scss";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import * as Yup from "yup";
import useCqlLibraryServiceApi from "../../../../api/useCqlLibraryServiceApi";
import { useUserRoles } from "../../../../hooks/useUserRoles";
import { formatOwner } from "../../../../util/ownerFormatter";
import TransferredLibrariesTable from "./TransferredLibrariesTable";

const INITIAL_STATUS_HANDLER = {
  success: { status: undefined, primaryMessage: "", secondaryMessages: [] },
  warning: { status: false, primaryMessage: "", secondaryMessages: [] },
  error: false,
  errorMessage: "",
  outboundAnnotations: [],
};

export const TRANSFER_LIBRARY_SUCCESS =
  "The library(s) were successfully transferred. If you chose to retain share access, you will still be able to edit the libraries.";
export const TRANSFER_LIBRARY_FAILURE =
  "Unable to transfer the selected library(s) to the harpId. If the error persists, please contact the help desk.";
export const INVALID_HARP_ID_MESSAGE =
  "The provided HARP ID is not associated with an active MADiE user.";

interface TransferDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  onClose: Function;
  setStatusHandler: Function;
}

const TransferDialog = ({
  libraries,
  open,
  onClose,
  setStatusHandler,
}: TransferDialogProps) => {
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const isAdmin = useUserRoles()?.isAdmin;

  const handleSave = async () => {
    setStatusHandler(INITIAL_STATUS_HANDLER);

    const libraryIds = libraries.map((library) => library.id);

    return cqlLibraryServiceApi
      .transferLibraries(
        libraryIds,
        formik.values.harpId,
        formik.values.retainShareAccess
      )
      .then((response) => {
        if (response.status === 200) {
          onClose({
            toastType: "success",
            toastMessage: TRANSFER_LIBRARY_SUCCESS,
            toastOpen: true,
          });
        } else if (response.status === 207) {
          const failedLibraryIds: string[] = response.data;

          const failedLibraryNames = libraries
            .filter((library) => failedLibraryIds.includes(library.id))
            .map((library) => library.cqlLibraryName);

          const count = failedLibraryNames?.length;
          setStatusHandler({
            warning: {
              status: true,
              primaryMessage: `${count} ${
                count === 1 ? "library" : "libraries"
              } could not be transferred. Please try again, or contact help desk if the issue persists.`,
              secondaryMessages: failedLibraryNames,
            },
          });

          // Close dialog and refresh the library list without showing a toast.
          onClose({
            toastType: "success",
            toastOpen: false,
          });
        }
      })
      .catch((error) => {
        console.error("TransferDialog: handleSave: error = ", error);
        if (
          error?.response?.status === 400 &&
          error?.response?.data?.message === INVALID_HARP_ID_MESSAGE
        ) {
          formik.setFieldError("harpId", INVALID_HARP_ID_MESSAGE);
        } else {
          onClose({
            toastType: "danger",
            toastMessage: TRANSFER_LIBRARY_FAILURE,
            toastOpen: true,
          });
        }
      });
  };

  const formik = useFormik({
    initialValues: {
      currentUser: formatOwner(
        libraries?.[0]?.ownerDisplayName,
        libraries?.[0]?.librarySet?.owner
      ),
      harpId: "",
      retainShareAccess: false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      harpId: Yup.string().required("New Library Owner is required."),
    }),
    onSubmit: handleSave,
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  return (
    <>
      <MadieDialog
        form
        title="Transfer Library Ownership"
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "transfer-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "transfer-cancel-button",
        }}
        continueButtonProps={{
          variant: isAdmin ? "cyan" : "danger-primary",
          type: "submit",
          continueText: "Transfer",
          "data-testid": "transfer-save-button",
          disabled: !formik.dirty || !formik.values.harpId,
        }}
      >
        <div className="transfer-dialog-info-text">
          <div>
            You are about to Transfer ownership of the {libraries?.length || 0}{" "}
            selected library(s) below. All versions and drafts will be
            transferred, but only the most recent library name appears in the
            list below.
          </div>
          {!isAdmin && (
            <div className="warning-message">
              <ErrorOutlineIcon color="error" fontSize="small" />
              This action cannot be undone.
            </div>
          )}
        </div>
        <div data-testid="transferred-libraries-list">
          <TransferredLibrariesTable
            libraries={libraries}
            showOwnerColumn={isAdmin}
          />
        </div>
        <div className="owner">Owner</div>
        <Divider sx={{ borderColor: "#8c8c8c", paddingBottom: "16px" }} />

        <div id="transfer-library">
          {!isAdmin && (
            <div className="current-owner">
              <ReadOnlyTextField
                label="Current Library Owner"
                inputProps={{
                  "data-testid": "current-owner",
                }}
                size="large"
                {...formik.getFieldProps("currentUser")}
              />
            </div>
          )}
          <div>
            <TextField
              label="New Library Owner"
              id="harp-id-input"
              required={true}
              inputProps={{
                "data-testid": "harp-id-input",
              }}
              error={formik.touched.harpId && Boolean(formik.errors.harpId)}
              helperText={formik.touched.harpId && formik.errors.harpId}
              {...formik.getFieldProps("harpId")}
            />
          </div>
          <div className="retainShareAccess">
            <FormControlLabel
              control={
                <Checkbox
                  {...formik.getFieldProps("retainShareAccess")}
                  checked={formik.values.retainShareAccess}
                  name="retainShareAccess"
                  id="retainShareAccess"
                  data-testid="retainShareAccess"
                />
              }
              label="Retain Share Access after Transfer"
            />
          </div>
        </div>
      </MadieDialog>
    </>
  );
};

export default TransferDialog;
