import { Acl } from "@madie/madie-models/dist/Measure";

/*
  Access helpers for the review-comment feature (comment link visibility and
  the comment author check). useCheckCanEdit keeps its own inline check: it is
  used across the apps and is left untouched.
*/
const SHARED_WITH_ROLE = "SHARED_WITH";

// HARP ids are compared case-insensitively everywhere in the app
export const normalizeUserId = (value?: string | null): string =>
  (value ?? "").trim().toLowerCase();

export const isOwner = (
  userName?: string | null,
  owner?: string | null
): boolean => {
  const user = normalizeUserId(userName);
  return user.length > 0 && user === normalizeUserId(owner);
};

export const isSharedWith = (
  userName?: string | null,
  acls?: Acl[] | null
): boolean => {
  const user = normalizeUserId(userName);
  return (
    user.length > 0 &&
    (acls ?? []).some(
      (acl) =>
        normalizeUserId(acl?.userId) === user &&
        (acl?.roles ?? []).includes(SHARED_WITH_ROLE)
    )
  );
};

// the owner of a measure/library set, or a user it has been shared with
export const hasEditAccess = (
  userName?: string | null,
  owner?: string | null,
  acls?: Acl[] | null
): boolean => isOwner(userName, owner) || isSharedWith(userName, acls);
