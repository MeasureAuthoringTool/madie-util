import { ReviewStatus } from "@madie/madie-models";

type MinimalAcl = {
  userId?: string;
  roles?: string[];
};

interface ReviewCommentVisibilityArgs {
  commentingEnabled?: boolean;
  currentUser?: string | null;
  owner?: string | null;
  acls?: MinimalAcl[] | null;
  reviewStatus?: string | null;
  hasReviewerRole?: boolean;
  assignedReviewers?: string[] | null;
}

const REVIEW_STATUSES_IN_PROCESS = new Set<string>([
  ReviewStatus.READY_FOR_REVIEW,
  ReviewStatus.IN_PROGRESS,
  ReviewStatus.COMPLETE,
]);

const normalize = (value?: string | null): string =>
  (value ?? "").trim().toLowerCase();

const isSharedWithUser = (
  acls: MinimalAcl[] | null | undefined,
  currentUser: string
): boolean => {
  return (
    acls?.some(
      (acl) =>
        normalize(acl?.userId) === currentUser &&
        acl?.roles?.includes("SHARED_WITH")
    ) ?? false
  );
};

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

  const normalizedCurrentUser = normalize(currentUser);
  if (!normalizedCurrentUser) {
    return false;
  }

  const isReviewState = REVIEW_STATUSES_IN_PROCESS.has(reviewStatus ?? "");
  const isOwner = normalize(owner) === normalizedCurrentUser;
  const hasShareAccess = isSharedWithUser(acls, normalizedCurrentUser);
  const isOwnerOrSharedUserInReview =
    (isOwner || hasShareAccess) && isReviewState;

  const isAssignedReviewer =
    Boolean(hasReviewerRole) &&
    (assignedReviewers?.some(
      (reviewer) => normalize(reviewer) === normalizedCurrentUser
    ) ??
      false);

  return isOwnerOrSharedUserInReview || isAssignedReviewer;
};
