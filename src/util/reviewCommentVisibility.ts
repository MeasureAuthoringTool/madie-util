import { Acl } from "@madie/madie-models/dist/Measure";
import { hasEditAccess, normalizeUserId } from "./accessControl";
import { isReviewActive } from "./reviewReadiness";

interface ReviewCommentVisibilityArgs {
  commentingEnabled?: boolean;
  currentUser?: string | null;
  owner?: string | null;
  acls?: Acl[] | null;
  reviewStatus?: string | null;
  hasReviewerRole?: boolean;
  assignedReviewers?: string[] | null;
}

export const shouldShowReviewCommentLink = ({
  commentingEnabled,
  currentUser,
  owner,
  acls,
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

  const isOwnerOrSharedUserInReview =
    hasEditAccess(user, owner, acls) && isReviewActive(reviewStatus);

  const isAssignedReviewer =
    Boolean(hasReviewerRole) &&
    (assignedReviewers ?? []).some(
      (reviewer) => normalizeUserId(reviewer) === user
    );

  return isOwnerOrSharedUserInReview || isAssignedReviewer;
};
