import { Comment } from "@madie/madie-models";

// replies count as comments, so a thread contributes the comment plus its replies
export const countCommentThread = (comment: Comment): number =>
  1 + (comment.replies?.length ?? 0);

export const countComments = (
  comments?: Comment[],
  // the "marked as Ready for Review" note shown in General > Review reads as a
  // comment, so it counts as one wherever comment totals are shown
  hasReviewNote?: boolean
): number =>
  (comments ?? []).reduce(
    (total, comment) => total + countCommentThread(comment),
    hasReviewNote ? 1 : 0
  );
