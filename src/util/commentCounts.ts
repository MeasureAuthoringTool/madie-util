import { Comment } from "@madie/madie-models";

// replies count as comments, so a thread contributes the comment plus its replies
export const countCommentThread = (comment: Comment): number =>
  1 + (comment.replies?.length ?? 0);

export const countComments = (comments?: Comment[]): number =>
  (comments ?? []).reduce(
    (total, comment) => total + countCommentThread(comment),
    0
  );
