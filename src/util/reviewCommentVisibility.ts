import { isReviewActive } from "./reviewReadiness";

interface ReviewCommentVisibilityArgs {
  commentingEnabled?: boolean;
  currentUser?: string | null;
  canEdit?: boolean;
  reviewStatus?: string | null;
  hasReviewerRole?: boolean;
  assignedReviewers?: string[] | null;
}

export const normalizeUserId = (value?: string | null): string =>
  (value ?? "").trim().toLowerCase();

export const shouldShowReviewCommentLink = ({
  commentingEnabled,
  currentUser,
  canEdit,
  reviewStatus,
  hasReviewerRole,
  assignedReviewers,
}: ReviewCommentVisibilityArgs): boolean => {
  if (!commentingEnabled) {
    return false;
  }

  const user = normalizeUserId(currentUser);
  if (!user) {
    return false;
  }

  const isEditorInReview = Boolean(canEdit) && isReviewActive(reviewStatus);

  const isAssignedReviewer =
    Boolean(hasReviewerRole) &&
    (assignedReviewers ?? []).some(
      (reviewer) => normalizeUserId(reviewer) === user
    );

  return isEditorInReview || isAssignedReviewer;
};
