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

/*
  The Comments link is shown to the owner and shared users while the entity is
  in the review process, and to an assigned reviewer at any time.
*/
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
