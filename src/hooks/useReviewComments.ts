import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Comment, CqlLibraryReview, MeasureReview } from "@madie/madie-models";
import useMeasureReviewServiceApi from "../api/useMeasureReviewServiceApi";
import useCqlLibraryReviewServiceApi from "../api/useCqlLibraryReviewServiceApi";
import { REVIEW_SAVED_EVENTS, ReviewEntityType } from "../util/reviewReadiness";

export type EntityReview = MeasureReview | CqlLibraryReview;

export const REVIEW_LOAD_ERROR =
  "Error loading review information. Please try again.";
export const COMMENT_SAVE_ERROR = "Error updating comments. Please try again.";

const isSameComment = (a: Comment, b: Comment): boolean =>
  Boolean(a.id) && a.id === b.id;

export interface ReviewComments {
  review: EntityReview | null;
  comments: Comment[];
  addComment: (comment: Comment) => Promise<boolean>;
  updateComment: (comment: Comment) => Promise<boolean>;
  deleteComment: (comment: Comment) => Promise<boolean>;
}

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
      setReview(null);
      return;
    }
    let isMounted = true;
    reviewApi
      .get(entityId)
      .then((loadedReview) => {
        if (isMounted) {
          setReview(loadedReview);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReview(null);
          onErrorRef.current?.(REVIEW_LOAD_ERROR);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reviewApi, entityId]);

  useEffect(() => {
    const eventName = REVIEW_SAVED_EVENTS[entityType];
    const handleReviewSaved = (event: Event) =>
      setReview((event as CustomEvent<EntityReview>).detail ?? null);

    window.addEventListener(eventName, handleReviewSaved);
    return () => {
      window.removeEventListener(eventName, handleReviewSaved);
    };
  }, [entityType]);

  const saveComments = useCallback(
    async (comments: Comment[]): Promise<boolean> => {
      if (!review || !entityId) {
        return false;
      }
      try {
        setReview(await reviewApi.update(entityId, { ...review, comments }));
        return true;
      } catch {
        onErrorRef.current?.(COMMENT_SAVE_ERROR);
        return false;
      }
    },
    [reviewApi, entityId, review]
  );

  const comments = review?.comments ?? [];

  return {
    review,
    comments,
    addComment: (comment) => saveComments([...comments, comment]),
    updateComment: (comment) =>
      saveComments(
        comments.map((existingComment) =>
          isSameComment(existingComment, comment) ? comment : existingComment
        )
      ),
    deleteComment: (comment) =>
      saveComments(
        comments.filter(
          (existingComment) => !isSameComment(existingComment, comment)
        )
      ),
  };
}
