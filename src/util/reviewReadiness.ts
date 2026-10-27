import { format } from "date-fns";
import { ReviewStatus } from "@madie/madie-models";

export type ReviewEntityType = "measure" | "library";

export const REVIEW_ACTIVE_STATUSES: ReadonlySet<ReviewStatus> = new Set([
  ReviewStatus.READY_FOR_REVIEW,
  ReviewStatus.IN_PROGRESS,
  ReviewStatus.COMPLETE,
]);

export const isReviewActive = (status?: string | null): boolean =>
  REVIEW_ACTIVE_STATUSES.has(status as ReviewStatus);

export const REVIEW_SAVED_EVENTS: Record<ReviewEntityType, string> = {
  measure: "review-measure-saved",
  library: "review-library-saved",
};

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
