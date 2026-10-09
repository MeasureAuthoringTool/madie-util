import { format } from "date-fns";

export type ReviewEntityType = "measure" | "library";

export const REVIEW_COMMENT_DATE_FORMAT = "MMM dd, yyyy, h:mm a";

export const formatReviewCommentDate = (value?: string): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : format(date, REVIEW_COMMENT_DATE_FORMAT);
};

export const getReadyForReviewMessage = (
  entityType: ReviewEntityType
): string =>
  `${
    entityType === "library" ? "Library" : "Measure"
  } marked as Ready for Review`;
