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

  const normalizedCurrentUser = normalizeUserId(currentUser);
  if (!normalizedCurrentUser) {
    return false;
  }

  const hasEditAccessDuringReview =
    Boolean(canEdit) && isReviewActive(reviewStatus);

  const isAssignedReviewer =
    Boolean(hasReviewerRole) &&
    (assignedReviewers ?? []).some(
      (reviewer) => normalizeUserId(reviewer) === normalizedCurrentUser
    );

  return hasEditAccessDuringReview || isAssignedReviewer;
};
