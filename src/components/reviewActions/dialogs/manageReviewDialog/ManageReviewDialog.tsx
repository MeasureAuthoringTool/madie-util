import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Autocomplete, Checkbox, FormControl, MenuItem } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  MadieDialog,
  ReadOnlyTextField,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import { UserDetails } from "@madie/madie-models";
import useMeasureReviewServiceApi from "../../../../api/useMeasureReviewServiceApi";
import useCqlLibraryReviewServiceApi from "../../../../api/useCqlLibraryReviewServiceApi";
import useUserServiceApi from "../../../../api/useUserServiceApi";

export type ReviewEntityType = "measure" | "library";

interface ManageReviewDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: ReviewEntityType;
  entityId?: string;
}

export const REVIEWER_ROLE = "MADiE-Reviewer";

// Selectable review statuses, in the order they are displayed. Measures and
// libraries use the same labels.
export const REVIEW_STATUS_OPTIONS = ["Ready", "In Progress", "Complete"];

// Review status as persisted by the services mapped to its display label.
const REVIEW_STATUS_LABELS: Record<string, string> = {
  READY_FOR_REVIEW: "Ready",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

const checkBoxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedCheckBoxIcon = <CheckBoxIcon fontSize="small" />;

const autoCompleteStyles = {
  borderRadius: "3px",
  height: "auto",
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiAutocomplete-inputFocused": {
    border: "none",
    boxShadow: "none",
    outline: "none",
  },
  "& .MuiAutocomplete-inputRoot": {
    paddingTop: 1,
    paddingBottom: 1,
  },
  "& input::placeholder": {
    fontSize: "14px",
  },
  "& .MuiChip-deleteIcon": {
    color: "#757575 !important",
  },
  width: "100%",
};

export const toPlainText = (comment?: string): string =>
  comment
    ?.replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

export const formatReviewerName = (user: UserDetails): string =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.harpId ||
  "";

const ManageReviewDialog = ({
  open,
  onClose,
  entityType,
  entityId,
}: ManageReviewDialogProps) => {
  const measureReviewServiceApi = useRef(useMeasureReviewServiceApi()).current;
  const libraryReviewServiceApi = useRef(
    useCqlLibraryReviewServiceApi()
  ).current;
  const userServiceApi = useRef(useUserServiceApi()).current;

  const [persistedStatus, setPersistedStatus] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [reviewerOptions, setReviewerOptions] = useState<string[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  const initialStatus = useMemo(
    () => (persistedStatus ? REVIEW_STATUS_LABELS[persistedStatus] ?? "" : ""),
    [persistedStatus]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchReview = async () => {
      if (!open || !entityId) {
        setPersistedStatus("");
        setComment("");
        return;
      }

      try {
        const review =
          entityType === "library"
            ? await libraryReviewServiceApi.getCqlLibraryReview(entityId)
            : await measureReviewServiceApi.getMeasureReview(entityId);
        if (isMounted) {
          setPersistedStatus(review?.status ?? "");
          setComment(review?.comment ?? "");
        }
      } catch {
        if (isMounted) {
          setPersistedStatus("");
          setComment("");
        }
      }
    };

    fetchReview();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    entityId,
    entityType,
    measureReviewServiceApi,
    libraryReviewServiceApi,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();

    const fetchReviewers = async () => {
      try {
        const users = await userServiceApi.fetchUsers(controller.signal);
        const reviewers = (users ?? [])
          .filter((user: UserDetails) =>
            user?.roles?.some((role) => role?.role === REVIEWER_ROLE)
          )
          .map(formatReviewerName)
          .filter((name: string) => !!name)
          .sort((first: string, second: string) => first.localeCompare(second));
        setReviewerOptions(reviewers);
      } catch {
        setReviewerOptions([]);
      }
    };

    fetchReviewers();

    return () => {
      controller.abort();
    };
  }, [open, userServiceApi]);

  useEffect(() => {
    if (open) {
      setSelectedReviewers([]);
      setStatus(initialStatus);
    }
  }, [open, initialStatus]);

  const handleClose = useCallback(() => {
    setSelectedReviewers([]);
    setStatus(initialStatus);
    onClose();
  }, [initialStatus, onClose]);

  const isDirty = selectedReviewers.length > 0 || status !== initialStatus;

  return (
    <MadieDialog
      title="Manage Review"
      dialogProps={{
        open,
        onClose: handleClose,
        maxWidth: "md",
        fullWidth: true,
        "data-testid": "manage-review-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Cancel",
        onClick: handleClose,
        "data-testid": "manage-review-dialog-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        continueText: "Save",
        disabled: !isDirty,
        "data-testid": "manage-review-dialog-save-button",
      }}
    >
      <div data-testid="manage-review-dialog-content">
        <div style={{ display: "flex", gap: 32 }}>
          <div style={{ flex: 1 }}>
            <FormControl fullWidth>
              <Autocomplete
                multiple
                disableCloseOnSelect
                disablePortal
                size="small"
                limitTags={2}
                id="manage-review-reviewers"
                data-testid="manage-review-reviewers"
                sx={autoCompleteStyles}
                options={reviewerOptions}
                value={selectedReviewers}
                getOptionLabel={(option: string) => option}
                onChange={(_event: any, selectedValues: string[]) =>
                  setSelectedReviewers(selectedValues ?? [])
                }
                renderOption={(props: any, option: string, { selected }) => (
                  <li
                    {...props}
                    key={option}
                    aria-label={`option ${option} ${
                      selected ? "selected" : "not selected"
                    }`}
                  >
                    <Checkbox
                      icon={checkBoxIcon}
                      checkedIcon={checkedCheckBoxIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Reviewer"
                    placeholder="Select All That Apply"
                    inputProps={{
                      ...params.inputProps,
                      "aria-label":
                        "Reviewer multiple reviewers can be selected",
                      "data-testid": "manage-review-reviewers-input",
                    }}
                  />
                )}
              />
            </FormControl>
          </div>
          <div style={{ flex: 1 }}>
            <Select
              id="manage-review-status"
              label="Status"
              required
              placeHolder={{ name: "Select", value: "" }}
              inputProps={{
                "data-testid": "manage-review-status-input",
              }}
              data-testid="manage-review-status"
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              value={status}
              onChange={(event: any) => setStatus(event.target.value)}
              options={REVIEW_STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option}
                  value={option}
                  data-testid={`manage-review-status-option-${option}`}
                >
                  {option}
                </MenuItem>
              ))}
            />
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <ReadOnlyTextField
            id="manage-review-comment"
            label="Comment"
            data-testid="manage-review-comment"
            value={toPlainText(comment)}
          />
        </div>
      </div>
    </MadieDialog>
  );
};

export default ManageReviewDialog;
