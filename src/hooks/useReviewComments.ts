import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CqlLibraryReview, MeasureReview } from "@madie/madie-models";
import { Comment } from "@madie/madie-models/dist/Comment";
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

/*
  Owns the review document for a measure or library and the comment writes
  against it, so the edit pages share one data layer and the flyout panel stays
  presentational.

  The services expose only PUT on the whole review, so each change sends the
  full comment array back and the response replaces local state. That makes
  concurrent commenting last-write-wins; per-comment endpoints would fix it.

  The review dialogs broadcast the review they persist on a window event; the
  hook listens so status and reviewers stay current without a refetch.
*/
export default function useReviewComments(
  entityType: ReviewEntityType,
  entityId: string | undefined,
  onError?: (message: string) => void
): ReviewComments {
  const measureApi = useRef(useMeasureReviewServiceApi()).current;
  const libraryApi = useRef(useCqlLibraryReviewServiceApi()).current;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [review, setReview] = useState<EntityReview | null>(null);

  const api = useMemo(
    () =>
      entityType === "library"
        ? {
            get: (id: string): Promise<EntityReview | null> =>
              libraryApi.getCqlLibraryReview(id),
            update: (id: string, next: EntityReview): Promise<EntityReview> =>
              libraryApi.updateCqlLibraryReview(id, next as CqlLibraryReview),
          }
        : {
            get: (id: string): Promise<EntityReview | null> =>
              measureApi.getMeasureReview(id),
            update: (id: string, next: EntityReview): Promise<EntityReview> =>
              measureApi.updateMeasureReview(id, next as MeasureReview),
          },
    [entityType, measureApi, libraryApi]
  );

  useEffect(() => {
    if (!entityId) {
      setReview(null);
      return;
    }
    let isMounted = true;
    api
      .get(entityId)
      .then((loaded) => {
        if (isMounted) {
          setReview(loaded);
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
  }, [api, entityId]);

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
        setReview(await api.update(entityId, { ...review, comment: comments }));
        return true;
      } catch {
        onErrorRef.current?.(COMMENT_SAVE_ERROR);
        return false;
      }
    },
    [api, entityId, review]
  );

  const comments = review?.comment ?? [];

  return {
    review,
    comments,
    addComment: (comment) => saveComments([...comments, comment]),
    updateComment: (comment) =>
      saveComments(
        comments.map((existing) =>
          isSameComment(existing, comment) ? comment : existing
        )
      ),
    deleteComment: (comment) =>
      saveComments(
        comments.filter((existing) => !isSameComment(existing, comment))
      ),
  };
}
