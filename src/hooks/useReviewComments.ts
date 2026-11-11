import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Comment, CqlLibraryReview, MeasureReview } from "@madie/madie-models";
import useMeasureReviewServiceApi from "../api/useMeasureReviewServiceApi";
import useCqlLibraryReviewServiceApi from "../api/useCqlLibraryReviewServiceApi";
import { REVIEW_SAVED_EVENTS, ReviewEntityType } from "../util/reviewReadiness";

export type EntityReview = MeasureReview | CqlLibraryReview;

export const REVIEW_LOAD_ERROR =
  "Error loading review information. Please try again.";
export const COMMENT_SAVE_ERROR = "Error updating comments. Please try again.";
export const COMMENT_NOT_FOUND_ERROR =
  "This comment has been deleted, so the change was not saved.";

const isSameComment = (a: Comment, b: Comment): boolean =>
  Boolean(a.id) && a.id === b.id;

export interface ReviewComments {
  review: EntityReview | null;
  comments: Comment[];
  addComment: (comment: Comment) => Promise<boolean>;
  updateComment: (comment: Comment) => Promise<boolean>;
  deleteComment: (comment: Comment) => Promise<boolean>;
  addReply: (parent: Comment, reply: Comment) => Promise<boolean>;
  updateReply: (parent: Comment, reply: Comment) => Promise<boolean>;
  deleteReply: (parent: Comment, reply: Comment) => Promise<boolean>;
  reloadReview: () => Promise<void>;
}

type CommentChange = (latestComments: Comment[]) => Comment[] | null;

// applies a change to one comment's replies, or returns null when that comment no longer exists
const changeReplies =
  (parent: Comment, change: (replies: Comment[]) => Comment[]): CommentChange =>
  (latestComments) =>
    latestComments.some((comment) => isSameComment(comment, parent))
      ? latestComments.map((comment) =>
          isSameComment(comment, parent)
            ? { ...comment, replies: change(comment.replies ?? []) }
            : comment
        )
      : null;

export default function useReviewComments(
  entityType: ReviewEntityType,
  entityId: string | undefined,
  onError?: (message: string) => void
): ReviewComments {
  const measureReviewApi = useRef(useMeasureReviewServiceApi()).current;
  const libraryReviewApi = useRef(useCqlLibraryReviewServiceApi()).current;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [review, setReview] = useState<EntityReview | null>(null);
  // counts every change to the review, so a reload that finishes after a newer save is ignored
  const reviewChangeCount = useRef(0);
  const replaceReview = useCallback((nextReview: EntityReview | null) => {
    reviewChangeCount.current += 1;
    setReview(nextReview);
  }, []);
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  const reviewApi = useMemo(
    () =>
      entityType === "library"
        ? {
            get: (id: string): Promise<EntityReview | null> =>
              libraryReviewApi.getCqlLibraryReview(id),
            update: (
              id: string,
              updatedReview: EntityReview
            ): Promise<EntityReview> =>
              libraryReviewApi.updateCqlLibraryReview(
                id,
                updatedReview as CqlLibraryReview
              ),
          }
        : {
            get: (id: string): Promise<EntityReview | null> =>
              measureReviewApi.getMeasureReview(id),
            update: (
              id: string,
              updatedReview: EntityReview
            ): Promise<EntityReview> =>
              measureReviewApi.updateMeasureReview(
                id,
                updatedReview as MeasureReview
              ),
          },
    [entityType, measureReviewApi, libraryReviewApi]
  );

  useEffect(() => {
    if (!entityId) {
      replaceReview(null);
      return;
    }
    let isCurrentEntity = true;
    reviewApi
      .get(entityId)
      .then((loadedReview) => {
        if (isCurrentEntity) {
          replaceReview(loadedReview);
        }
      })
      .catch(() => {
        if (isCurrentEntity) {
          replaceReview(null);
          onErrorRef.current?.(REVIEW_LOAD_ERROR);
        }
      });

    return () => {
      isCurrentEntity = false;
    };
  }, [reviewApi, entityId, replaceReview]);

  const reloadReview = useCallback(async (): Promise<void> => {
    if (!entityId) {
      return;
    }
    const changeCountAtStart = reviewChangeCount.current;
    try {
      const loadedReview = await reviewApi.get(entityId);
      if (
        isMounted.current &&
        reviewChangeCount.current === changeCountAtStart
      ) {
        replaceReview(loadedReview);
      }
    } catch {
      // keep showing the comments already loaded
      if (isMounted.current) {
        onErrorRef.current?.(REVIEW_LOAD_ERROR);
      }
    }
  }, [reviewApi, entityId, replaceReview]);

  useEffect(() => {
    const eventName = REVIEW_SAVED_EVENTS[entityType];
    const handleReviewSaved = (event: Event) =>
      replaceReview((event as CustomEvent<EntityReview>).detail ?? null);

    window.addEventListener(eventName, handleReviewSaved);
    return () => {
      window.removeEventListener(eventName, handleReviewSaved);
    };
  }, [entityType, replaceReview]);

  const saveComments = useCallback(
    async (applyChange: CommentChange): Promise<boolean> => {
      if (!review || !entityId) {
        return false;
      }
      try {
        const latestReview = (await reviewApi.get(entityId)) ?? review;
        const changedComments = applyChange(latestReview.comments ?? []);
        if (changedComments === null) {
          replaceReview(latestReview);
          onErrorRef.current?.(COMMENT_NOT_FOUND_ERROR);
          return false;
        }
        replaceReview(
          await reviewApi.update(entityId, {
            ...latestReview,
            comments: changedComments,
          })
        );
        return true;
      } catch {
        onErrorRef.current?.(COMMENT_SAVE_ERROR);
        return false;
      }
    },
    [reviewApi, entityId, review, replaceReview]
  );

  const comments = review?.comments ?? [];

  return {
    review,
    comments,
    reloadReview,
    addComment: (comment) =>
      saveComments((latestComments) => [...latestComments, comment]),
    updateComment: (comment) =>
      saveComments((latestComments) =>
        latestComments.some((existing) => isSameComment(existing, comment))
          ? latestComments.map((existing) =>
              isSameComment(existing, comment)
                ? { ...comment, replies: existing.replies }
                : existing
            )
          : null
      ),
    deleteComment: (comment) =>
      saveComments((latestComments) =>
        latestComments.filter((existing) => !isSameComment(existing, comment))
      ),
    addReply: (parent, reply) =>
      saveComments(changeReplies(parent, (replies) => [...replies, reply])),
    updateReply: (parent, reply) =>
      saveComments(
        changeReplies(parent, (replies) =>
          replies.map((existing) =>
            isSameComment(existing, reply) ? reply : existing
          )
        )
      ),
    deleteReply: (parent, reply) =>
      saveComments(
        changeReplies(parent, (replies) =>
          replies.filter((existing) => !isSameComment(existing, reply))
        )
      ),
  };
}
