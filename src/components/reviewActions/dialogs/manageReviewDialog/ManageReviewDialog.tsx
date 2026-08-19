import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormik } from "formik";
import { Autocomplete, Checkbox, FormControl, MenuItem } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  MadieDialog,
  ReadOnlyTextField,
  Select,
  TextField,
  Toast,
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
  entitySetId?: string;
  onSuccess?: () => void | Promise<void>;
}

export const REVIEWER_ROLE = "MADiE-Reviewer";

export const REVIEW_STATUS_OPTIONS = ["Ready", "In Progress", "Complete"];
const REVIEW_STATUS_LABELS: Record<string, string> = {
  READY_FOR_REVIEW: "Ready",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

const REVIEW_STATUS_VALUES: Record<string, string> = Object.entries(
  REVIEW_STATUS_LABELS
).reduce((acc, [value, label]) => ({ ...acc, [label]: value }), {});

const SAVED_EVENTS: Record<ReviewEntityType, string> = {
  measure: "review-measure-saved",
  library: "review-library-saved",
};

export interface ReviewerOption {
  harpId: string;
  name: string;
}

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

const sortIds = (ids: string[]): string[] => [...(ids ?? [])].sort();

const ManageReviewDialog = ({
  open,
  onClose,
  entityType,
  entityId,
  entitySetId,
  onSuccess,
}: ManageReviewDialogProps) => {
  const measureReviewServiceApi = useRef(useMeasureReviewServiceApi()).current;
  const libraryReviewServiceApi = useRef(
    useCqlLibraryReviewServiceApi()
  ).current;
  const userServiceApi = useRef(useUserServiceApi()).current;
  const isLibrary = entityType === "library";

  const [reviewId, setReviewId] = useState<string>("");
  const [persistedStatus, setPersistedStatus] = useState<string>("");
  const [persistedReviewers, setPersistedReviewers] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");
  const [reviewerOptions, setReviewerOptions] = useState<ReviewerOption[]>([]);
  const [toast, setToast] = useState<{
    toastOpen: boolean;
    toastType: string;
    toastMessage: string;
  }>({
    toastOpen: false,
    toastType: "danger",
    toastMessage: "",
  });
  const { toastOpen, toastType, toastMessage } = toast;

  const initialStatus = useMemo(
    () => (persistedStatus ? REVIEW_STATUS_LABELS[persistedStatus] ?? "" : ""),
    [persistedStatus]
  );

  useEffect(() => {
    let isMounted = true;

    const applyReview = (review: any) => {
      setReviewId(review?.id ?? "");
      setPersistedStatus(review?.status ?? "");
      setPersistedReviewers(review?.reviewers ?? []);
      setComment(review?.comment ?? "");
    };

    const fetchReview = async () => {
      if (!open || !entityId) {
        applyReview(null);
        return;
      }

      try {
        const review = isLibrary
          ? await libraryReviewServiceApi.getCqlLibraryReview(entityId)
          : await measureReviewServiceApi.getMeasureReview(entityId);
        if (isMounted) {
          applyReview(review);
        }
      } catch {
        if (isMounted) {
          applyReview(null);
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
    isLibrary,
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
          .map((user: UserDetails) => ({
            harpId: user?.harpId ?? "",
            name: formatReviewerName(user),
          }))
          .filter((option: ReviewerOption) => !!option.harpId && !!option.name)
          .sort((first: ReviewerOption, second: ReviewerOption) =>
            first.name.localeCompare(second.name)
          );
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

  const initialValues = useMemo(
    () => ({
      reviewers: sortIds(persistedReviewers),
      status: initialStatus,
    }),
    [persistedReviewers, initialStatus]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!entityId) {
        return;
      }

      const statusValue = values.status
        ? REVIEW_STATUS_VALUES[values.status] ?? null
        : persistedStatus || null;
      const payload: any = {
        id: reviewId,
        status: statusValue,
        comment,
        reviewers: values.reviewers,
        ...(isLibrary
          ? { libraryId: entityId, librarySetId: entitySetId }
          : { measureId: entityId, measureSetId: entitySetId }),
      };

      try {
        let saved;
        if (isLibrary) {
          saved = reviewId
            ? await libraryReviewServiceApi.updateCqlLibraryReview(
                entityId,
                payload
              )
            : await libraryReviewServiceApi.createCqlLibraryReview(
                entityId,
                payload
              );
        } else {
          saved = reviewId
            ? await measureReviewServiceApi.updateMeasureReview(
                entityId,
                payload
              )
            : await measureReviewServiceApi.createMeasureReview(
                entityId,
                payload
              );
        }

        setToast({
          toastOpen: true,
          toastType: "success",
          toastMessage: "Review information has been saved successfully.",
        });
        window.dispatchEvent(
          new CustomEvent(SAVED_EVENTS[entityType], { detail: saved })
        );
        await onSuccess?.();
        onClose();
      } catch {
        setToast({
          toastOpen: true,
          toastType: "danger",
          toastMessage:
            "An error occurred while saving the review. Please try again.",
        });
      }
    },
  });
  const { resetForm, setFieldValue } = formik;

  // Selected HARP ids rendered as options. Ids with no matching user (e.g. a
  // reviewer whose role was revoked) still show, labelled by their HARP id.
  const selectedReviewers = useMemo<ReviewerOption[]>(
    () =>
      formik.values.reviewers.map(
        (harpId) =>
          reviewerOptions.find((option) => option.harpId === harpId) ?? {
            harpId,
            name: harpId,
          }
      ),
    [formik.values.reviewers, reviewerOptions]
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <>
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
          disabled: !formik.dirty || formik.isSubmitting,
          onClick: formik.submitForm,
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
                  getOptionLabel={(option: ReviewerOption) => option.name}
                  isOptionEqualToValue={(
                    option: ReviewerOption,
                    value: ReviewerOption
                  ) => option.harpId === value.harpId}
                  onChange={(_event: any, selectedValues: ReviewerOption[]) =>
                    setFieldValue(
                      "reviewers",
                      sortIds((selectedValues ?? []).map((o) => o.harpId))
                    )
                  }
                  renderOption={(
                    props: any,
                    option: ReviewerOption,
                    { selected }
                  ) => (
                    <li
                      {...props}
                      key={option.harpId}
                      aria-label={`option ${option.name} ${
                        selected ? "selected" : "not selected"
                      }`}
                    >
                      <Checkbox
                        icon={checkBoxIcon}
                        checkedIcon={checkedCheckBoxIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.name}
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
                value={formik.values.status}
                onChange={(event: any) =>
                  setFieldValue("status", event.target.value)
                }
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
      <Toast
        toastKey="manage-review-dialog-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "manage-review-dialog-error-text"
            : "manage-review-dialog-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        closeButtonProps={{
          "data-testid": "manage-review-dialog-toast-close-button",
        }}
        onClose={() =>
          setToast({
            toastOpen: false,
            toastType: "danger",
            toastMessage: "",
          })
        }
        autoHideDuration={6000}
      />
    </>
  );
};

export default ManageReviewDialog;
