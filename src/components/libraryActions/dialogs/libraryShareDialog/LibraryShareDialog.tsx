import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Backdrop, Checkbox, Chip, Typography } from "@mui/material";
import {
  AutoComplete,
  TextField,
  MadieDialog,
  Button,
  TruncateText,
  MadieSpinner,
  Toast,
} from "@madie/madie-design-system/dist/react";
import "./LibraryShareDialog.scss";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type CqlLibrary } from "@madie/madie-models";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import tw from "twin.macro";
import "styled-components/macro";
import { useFormik } from "formik";
import * as Yup from "yup";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import {
  useOktaTokens,
  useUserRoles,
  useCqlLibraryServiceApi,
  useUserServiceApi,
} from "../../../../madie-madie-util";

import FileSaver from "file-saver";
import { format } from "date-fns";

export const LIBRARY_SHARING_EXPORT_SUCCESS =
  "Library Sharing Report exported successfully.";
export const LIBRARY_SHARING_EXPORT_ERROR =
  "Unable to export the user list. Please try again. If the issue persists, please contact the help desk.";
export const INVALID_HARP_ID_MESSAGE =
  "The provided HARP ID is not associated with an active MADiE user.";
export const HARP_ID_VALIDATION_FAILURE =
  "Unable to validate the provided HARP ID. If the error persists, please contact the help desk.";

interface ShareDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  option: string;
  onClose: Function;
}

interface SharedLibrary {
  libraryId: string;
  cqlLibraryName: string;
  userId: string;
  displayName?: string;
  dateShared: string;
  subRows: SharedLibrary[];
}

export interface SharedUser {
  userId: string;
  displayName: string;
  performedAt: Date;
}

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
const icon = <CheckBoxOutlineBlankIcon fontSize="large" />;
const checkedIcon = <CheckBoxIcon fontSize="large" />;

//Convert date string to format of mm/dd/yyyy with no leading zeroes in month
export const convertDate = (date: string) => {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

export const sortSharedLibraries = (a: SharedLibrary, b: SharedLibrary) => {
  if (a.dateShared === "-" || b.dateShared === "-") {
    return -1;
  }

  return new Date(b.dateShared).getTime() - new Date(a.dateShared).getTime();
};

const getErrorMessage = (error, baseMessage: string) => {
  let toastMessage;

  if (error?.response?.data?.message) {
    toastMessage = error.response.data.message;
  } else {
    toastMessage = baseMessage;
  }

  return toastMessage;
};

const LibraryShareDialog = ({
  libraries,
  open,
  option,
  onClose,
}: ShareDialogProps) => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const libraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const userServiceApi = useRef(useUserServiceApi()).current;

  const [loading, setLoading] = useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [libraryMap, setLibraryMap] = useState(new Map<string, CqlLibrary>());
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);

  const flattenedSharedLibraries = useMemo(() => {
    return sharedLibraries.flatMap((library) => library.subRows ?? []);
  }, [sharedLibraries]);

  const [sharedWithAllSelectedLibraries, setSharedWithAllSelectedLibraries] =
    useState<boolean>(false);
  const [shareLibrariesRequest, setShareLibrariesRequest] = useState(
    new Map<string, string[]>()
  );
  const [unshareLibrariesRequest, setUnshareLibrariesRequest] = useState(
    new Map<string, string[]>()
  );

  const [rowSelection, setRowSelection] = useState({});
  const [initialRowIdsSelected, setInitialRowIdsSelected] = useState([]);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [harpIds, setHarpIds] = useState<string[]>([]);
  const [harpInputValue, setHarpInputValue] = useState<string>("");

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    type: "danger",
    message: "",
  });

  const showShareDialog = option === "Share With" || option === "Unshare";
  const userRoles = useUserRoles();

  useEffect(() => {
    if (option === "UnshareFromMe" && open) {
      setConfirmationDialogOpen(true);
    }
  }, [option, open]);

  const updateSharedLibrariesRequest = (libraryId, harpId) => {
    setShareLibrariesRequest((map) => {
      const current = map.get(libraryId) || [];
      current.push(harpId);

      return map.set(libraryId, current);
    });
  };

  const updateUnsharedLibrariesRequest = (libraryId, harpId) => {
    setUnshareLibrariesRequest((map) => {
      const current = map.get(libraryId) || [];
      current.push(harpId);

      return map.set(libraryId, current);
    });
  };

  const harpIdCheck = (isSharedWithAllSelectedLibraries: boolean) => {
    return {
      message: `The selected library(s) are already shared with the entered user(s).`,
      test: () => {
        return !isSharedWithAllSelectedLibraries;
      },
    };
  };

  const handleAddUser = async () => {
    const allIds = [...harpIds];
    const remaining = harpInputValue.replace(/\s/g, "");
    if (remaining) {
      allIds.push(remaining);
    }
    // @ts-ignore
    const uniqueIds = [...new Set(allIds)];
    if (uniqueIds.length === 0) {
      setHarpInputValue("");
      return;
    }

    const newIds = uniqueIds.filter(
      (id) =>
        !sharedLibraries.every((library) =>
          library.subRows.some((subRow) => subRow.userId === id)
        )
    );
    if (newIds.length === 0) {
      formik.setFieldError(
        "harpId",
        `The selected library(s) are already shared with the entered user(s).`
      );
      return;
    }

    try {
      const userDetails = await userServiceApi.getBulkUserDetails(newIds);
      const validUsers: string[] = [];
      const invalidUsers: string[] = [];
      const displayNameMap = new Map<string, string>();

      Object.entries(userDetails).forEach(
        ([harpId, details]: [string, any]) => {
          if (details.userStatus && String(details.userStatus) === "ACTIVE") {
            validUsers.push(harpId);

            const name = [details.firstName, details.lastName]
              .filter(Boolean)
              .join(" ");

            displayNameMap.set(harpId, name ? `${name} (${harpId})` : harpId);
          } else {
            invalidUsers.push(harpId);
          }
        }
      );

      if (invalidUsers.length > 0) {
        if (invalidUsers.length === 1) {
          formik.setFieldError(
            "harpId",
            `The provided HARP ID (${invalidUsers[0]}) is not associated with an active MADiE user.`
          );
        } else {
          formik.setFieldError(
            "harpId",
            `The provided HARP IDs (${invalidUsers.join(
              ", "
            )}) are not associated with an active MADiE user.`
          );
        }
      }

      if (validUsers.length === 0) {
        return;
      }

      let updatedLibraries = [...sharedLibraries];
      validUsers.forEach((harpId) => {
        updatedLibraries = updatedLibraries.map((library) => {
          // Skip libraries where this user is already shared
          if (library.subRows.some((subRow) => subRow.userId === harpId)) {
            return library;
          }
          updateSharedLibrariesRequest(library.libraryId, harpId);
          return {
            ...library,
            subRows: [
              {
                libraryId: library.libraryId,
                cqlLibraryName: library.cqlLibraryName,
                userId: harpId,
                displayName: displayNameMap.get(harpId) ?? harpId,
                dateShared: new Date().toLocaleString(),
                subRows: null,
              },
              ...library.subRows,
            ],
          };
        });
      });

      setSharedLibraries(updatedLibraries);
      setSaveDisabled(false);
      setHarpIds([]);
      setHarpInputValue("");

      if (invalidUsers.length === 0) {
        formik.resetForm();
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        formik.setFieldError("harpId", INVALID_HARP_ID_MESSAGE);
      } else {
        setToast({
          open: true,
          type: "danger",
          message: HARP_ID_VALIDATION_FAILURE,
        });
      }
    }
  };

  const getSharedLibrary = useCallback(async () => {
    if ((libraries && libraries?.length === 0) || !open) {
      return;
    }

    setSharedLibraries([]);
    setErrorMessage("");
    setLoading(true);

    const uniqueLibrarySets = Array.from(
      new Map(libraries.map((item) => [item.librarySetId, item])).values()
    );

    try {
      const responses =
        await libraryServiceApi.getRecentLibrariesByLibrarySetId(
          uniqueLibrarySets.map((librarySet) => librarySet.librarySetId)
        );
      const libraryIds = responses.map((library) => library.id);
      const libraryMap = new Map<string, CqlLibrary>(
        responses.map((library) => [library.id, library])
      );
      setLibraryMap(libraryMap);

      const sharedLibraries = await libraryServiceApi.getSharedLibraries(
        libraryIds
      );
      setSharedLibraries(
        libraryIds.map((libraryId: string) => ({
          libraryId,
          //@ts-ignore
          cqlLibraryName: libraryMap.get(libraryId).cqlLibraryName,
          userId: "",
          dateShared: null,
          subRows: sharedLibraries[libraryId]
            .map((sharedUser: SharedUser) => ({
              libraryId,
              cqlLibraryName: libraryMap.get(libraryId).cqlLibraryName,
              userId: sharedUser.userId,
              displayName: sharedUser.displayName,
              dateShared: sharedUser.performedAt
                ? sharedUser.performedAt.toLocaleString()
                : "-",
            }))
            .sort(sortSharedLibraries),
        }))
      );

      table.toggleAllRowsSelected(true);
      setInitialRowIdsSelected(Object.keys(table.getState().rowSelection));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to retrieve users that the selected library(s) is shared with. If the error persists, please contact the help desk."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    setConfirmationDialogOpen(false);
    setExecuting(true);

    if (option === "Share With") {
      try {
        await libraryServiceApi.shareLibraries(shareLibrariesRequest);

        onClose("success", "The Library(s) were successfully shared.");
      } catch (error) {
        onClose(
          "danger",
          getErrorMessage(
            error,
            "Unable to share the selected library(s) with the added users. If the error persists, please contact the help desk."
          )
        );
      } finally {
        setExecuting(false);
      }
    } else if (option === "Unshare" || option === "UnshareFromMe") {
      try {
        await libraryServiceApi.unshareLibraries(unshareLibrariesRequest);

        onClose("success", "The Library(s) were successfully unshared.");
      } catch (error) {
        onClose(
          "danger",
          getErrorMessage(
            error,
            "Unable to unshare the selected library(s) with the users who were unchecked. If the error persists, please contact the help desk."
          )
        );
      } finally {
        setExecuting(false);
      }
    }
  };

  const onRowSelectionChange = useCallback(async () => {
    if (option !== "Unshare") return;

    if (initialRowIdsSelected.length) {
      const rowIdsSelected = Object.keys(rowSelection);

      const rowIdsUnselected: string[] = initialRowIdsSelected.filter(
        (element) => !rowIdsSelected.includes(element)
      );

      setUnshareLibrariesRequest(new Map<string, string[]>());

      rowIdsUnselected.map((rowId) => {
        const [libraryId, userId] = rowId.split(" ");
        updateUnsharedLibrariesRequest(libraryId, userId);
      });
    }
  }, [rowSelection, option]);

  const confirmationDialogWarningContent = () => {
    let requestToUse = unshareLibrariesRequest;
    if (option === "UnshareFromMe" && unshareLibrariesRequest.size === 0) {
      const directUnshareRequest = new Map<string, string[]>();
      libraries.forEach((library) => {
        directUnshareRequest.set(library.id, [userName]);
        setUnshareLibrariesRequest(directUnshareRequest);
      });
      requestToUse = directUnshareRequest;
    }
    return (
      <div>
        <div className="confirmation-dialog-content">
          You are about to unshare
        </div>
        {Array.from(requestToUse).map(([libraryId, userIds]) => (
          <div className="confirmation-dialog-content" key={libraryId}>
            <div className="library-name">
              {libraryMap.get(libraryId)
                ? libraryMap.get(libraryId).cqlLibraryName
                : libraryId}
            </div>
            <div> with the following users:</div>
            <ul>
              {userIds.map((userId) => {
                const sharedUser =
                  option === "UnshareFromMe"
                    ? sharedLibraries
                        .flatMap((library) => library.subRows)
                        .find(
                          (row) =>
                            row.userId.toLowerCase() === userId.toLowerCase()
                        )
                    : sharedLibraries
                        .find((library) => library.libraryId === libraryId)
                        ?.subRows.find((row) => row.userId === userId);

                const displayName = sharedUser?.displayName ?? userId;

                return <li key={userId}>{displayName}</li>;
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const formik = useFormik({
    initialValues: {
      harpId: "",
    },
    validationSchema: Yup.object().shape({
      harpId: Yup.string().test(harpIdCheck(sharedWithAllSelectedLibraries)),
    }),
    onSubmit: () => {
      option === "Share With" ? handleSave() : setConfirmationDialogOpen(true);
    },
  });

  const columns = useMemo<ColumnDef<SharedLibrary>[]>(() => {
    let columnDefs = [];
    if (option === "Share With") {
      columnDefs.push({
        header: "Library",
        cell: (info) => (
          <TruncateText
            text={info.row.original.cqlLibraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.cqlLibraryName}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "cqlLibraryName",
      });
    } else if (option === "Unshare") {
      columnDefs.push({
        header: "Library",
        cell: (info) => (
          <TruncateText
            text={info.row.original.cqlLibraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.cqlLibraryName}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "cqlLibraryName",
      });
    }
    columnDefs = [
      ...columnDefs,
      {
        header: ({ table }) => (
          <div className="shared-with-header">
            {option === "Unshare" && (
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                indeterminate={table.getIsSomeRowsSelected()}
                checked={table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
                data-testid="shared-with-select-all"
              />
            )}
            <span>Shared With</span>
          </div>
        ),
        cell: (info) => (
          <div className="shared-with-cell">
            {option === "Unshare" && (
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                checked={info.row.getIsSelected()}
                onChange={info.row.getToggleSelectedHandler()}
                data-testid={`unshare-checkbox-${info.row.original.userId}_${info.row.original.libraryId}`}
              />
            )}
            <TruncateText
              text={info.row.original.displayName ?? info.row.original.userId}
              maxLength={120}
              dataTestId={`user-${info.row.original.userId}_${info.row.original.libraryId}`}
            />
          </div>
        ),
        accessorKey: "userId",
      },
      {
        header: "Date Shared",
        cell: (info) => (
          <TruncateText
            text={
              info.row.original.dateShared === "-"
                ? "-"
                : info.row.original.dateShared
                ? convertDate(info.row.original.dateShared)
                : ""
            }
            maxLength={120}
            dataTestId={`date-shared-${info.row.original.dateShared}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "dateShared",
      },
    ];

    return columnDefs;
  }, [libraries]);

  const table = useReactTable({
    data: flattenedSharedLibraries,
    getRowId: (row) => `${row.libraryId}${row.userId ? ` ${row.userId}` : ""}`,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  useEffect(() => {
    getSharedLibrary();
  }, [getSharedLibrary]);

  useEffect(() => {
    formik.validateForm();
  }, [sharedWithAllSelectedLibraries]);

  useEffect(() => {
    onRowSelectionChange();
  }, [table.getState().rowSelection]);

  useEffect(() => {
    if (!open) {
      setSaveDisabled(true);
      setShareLibrariesRequest(new Map<string, string[]>());
      setUnshareLibrariesRequest(new Map<string, string[]>());
      setInitialRowIdsSelected([]);
      setHarpIds([]);
      setHarpInputValue("");
      table.resetRowSelection();
      table.resetExpanded();
      formik.resetForm();
    }
  }, [open]);

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);

    // Also close underlying Share/Unshare dialog
    if (option === "UnshareFromMe") {
      onClose();
    }
  };

  const handleExportUserList = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ids = sharedLibraries.map((m) => m.libraryId);
      const blob = await libraryServiceApi.getSharedAccessReportForLibraries(
        ids
      );
      const fileName = generateTimestampedFileName(
        "LibrarySharingExport",
        "xlsx"
      );
      FileSaver.saveAs(blob, fileName);
      setToast({
        open: true,
        type: "success",
        message: LIBRARY_SHARING_EXPORT_SUCCESS,
      });
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        type: "danger",
        message: LIBRARY_SHARING_EXPORT_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimestampedFileName = (
    baseName: string,
    extension: string
  ): string => {
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    return `${baseName}_${timestamp}.${extension}`;
  };

  const getAdminUserExportButton = () => {
    if (userRoles?.isAdmin) {
      return (
        <Button
          className="export-button"
          data-testid="export-user-list-button"
          onClick={handleExportUserList}
        >
          <SaveAltIcon sx={{ marginRight: "8px" }} />
          <span className="export-button-text">Export User List</span>
        </Button>
      );
    }
  };

  return (
    <>
      <MadieDialog
        form
        title={option === "Unshare" ? "Unshare From..." : "Share With..."}
        dialogProps={{
          onClose,
          open: showShareDialog && open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "share-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "share-cancel-button",
          disabled: executing,
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          continueText: "Save",
          "data-testid": "share-save-button",
          disabled:
            option === "Share With"
              ? saveDisabled || !formik.isValid || executing
              : table.getIsAllRowsSelected() || executing,
        }}
      >
        <div id="library-landing" data-testid="library-landing">
          {option === "Share With" && (
            <div id="add-user-id-search">
              <div>
                <AutoComplete
                  multiple
                  id="harp-id-autocomplete"
                  data-testid="harp-id-autocomplete"
                  options={[]}
                  freeSolo
                  value={harpIds}
                  onChange={(event, newValue) => {
                    // Clean up values - trim whitespace and filter empty
                    const cleanedValues = newValue
                      .map((v) => v.trim())
                      .filter((v) => v.length > 0);
                    setHarpIds(cleanedValues);
                    setSharedWithAllSelectedLibraries(false);
                  }}
                  inputValue={harpInputValue}
                  onInputChange={(event, newInputValue, reason) => {
                    if (reason === "input") {
                      setHarpInputValue(newInputValue);
                    } else if (reason === "clear") {
                      setHarpInputValue("");
                    }
                    if (formik.errors.harpId) {
                      formik.setFieldError("harpId", undefined);
                    }
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={`${index}-option`}
                        data-testid={`harp-id-chip-${index}`}
                        sx={{
                          opacity: "1.0 !important",
                          backgroundColor: "#DDDDDD",
                          "& .MuiChip-deleteIcon": {
                            color: "#717171 !important",
                          },
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="HARP ID"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          padding: "10px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#fff",
                        },
                        "& .MuiOutlinedInput-root:hover": {
                          borderColor: "#0073C8",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused": {
                          borderColor: "#0073C8",
                          boxShadow: "0 0 0 2px rgba(0, 115, 200, 0.2)",
                        },
                      }}
                      id="harp-id-input"
                      inputProps={{
                        ...params.inputProps,
                        "data-testid": "harp-id-input",
                      }}
                      error={Boolean(formik.errors.harpId)}
                      onFocus={() => setSharedWithAllSelectedLibraries(false)}
                      onKeyDown={(e) => {
                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          const inputValue = harpInputValue.trim();
                          if (inputValue && !harpIds.includes(inputValue)) {
                            setHarpIds([...harpIds, inputValue]);
                            setHarpInputValue("");
                          }
                        }
                      }}
                      onBlur={formik.handleBlur("harpId")}
                    />
                  )}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: formik.errors.harpId ? "#d32f2f" : "#666",
                    marginTop: "4px",
                    marginLeft: "14px",
                    display: "block",
                    fontSize: "0.75rem",
                  }}
                  data-testid="harp-id-helper-text"
                >
                  {formik.errors.harpId || "Hit comma (,) to add multiple"}
                </Typography>
              </div>
              <div>
                <Button
                  id="add-user-btn"
                  data-testid="add-user-btn"
                  variant="outline"
                  disabled={
                    (harpIds.length === 0 && !harpInputValue.trim()) ||
                    !formik.isValid
                  }
                  onClick={handleAddUser}
                >
                  Add User(s)
                </Button>
              </div>
            </div>
          )}
          <div className="share-unshare-dialog-info-text">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                {option === "Unshare" ? (
                  <div>
                    <span>
                      <strong>Please note: </strong>
                    </span>
                    <span>
                      When sharing a library, all versions and drafts are
                      shared, but only the most recent library name appears
                      below.
                    </span>
                    <br />
                    <span>
                      To unshare library(s),{" "}
                      <strong>
                        deselect the usernames from whom you want to unshare the
                        library(s)
                      </strong>
                      , then click the 'Unshare' button.
                    </span>
                  </div>
                ) : (
                  `When sharing a Library, all versions and drafts are shared, so
                only the most recent library name appears here.`
                )}
              </div>
            </div>
            {getAdminUserExportButton()}
          </div>
          <div className="cql-library-table">
            <div className="table" style={{ overflow: "auto" }}>
              {/* split table view between unshare and share views as MAT-9636 only asks for the update of unshare view. */}
              <table
                tw="min-w-full"
                data-testid="share-library-tbl"
                className="ml-table"
                style={{
                  borderSpacing: "0 2em !important",
                  borderBottom: "1px solid rgb(140, 140, 140)",
                }}
              >
                <thead tw="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TH
                            key={header.id}
                            scope="col"
                            className="header-cell"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </TH>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="table-body" style={{ padding: 20 }}>
                  {errorMessage ? (
                    <tr>
                      <td colSpan={columns.length}>{errorMessage}</td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="ml-tr"
                        data-testid="row-item"
                        style={{
                          borderTop: "solid 1px #8c8c8c",
                          borderSpacing: "0 2em !important",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} data-testid={`${cell.id}`}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading || executing}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          {loading && (
            <Typography color="inherit">Loading shared libraries...</Typography>
          )}
          {executing && <Typography color="inherit">Saving...</Typography>}
        </Backdrop>
      </MadieDialog>

      <MadieDialog
        title="Are you sure?"
        dialogProps={{
          open: confirmationDialogOpen,
          onClose: handleConfirmationDialogClose,
          "data-testid": "share-confirmation-dialog",
        }}
        cancelButtonProps={{
          onClick: handleConfirmationDialogClose,
          cancelText: "Cancel",
          "data-testid": "share-confirmation-dialog-cancel-button",
        }}
        continueButtonProps={{
          type: "submit",
          continueText: "Accept",
          onClick: handleSave,
          "data-testid": "share-confirmation-dialog-accept-button",
        }}
      >
        <div id="discard-changes-dialog-body">
          <section className="dialog-warning-body">
            {confirmationDialogWarningContent()}
          </section>
        </div>
      </MadieDialog>
      <Toast
        toastKey="export-user-list-toast"
        testId="export-user-list-toast"
        toastType={toast.type}
        open={toast.open}
        message={toast.message}
        onClose={() =>
          setToast({
            open: false,
            type: "danger",
            message: "",
          })
        }
        autoHideDuration={8000}
      />
    </>
  );
};

export default LibraryShareDialog;
