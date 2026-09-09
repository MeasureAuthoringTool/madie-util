import { ReviewStatus } from "@madie/madie-models";
import { shouldShowReviewCommentLink } from "./reviewCommentVisibility";

describe("reviewCommentVisibility", () => {
  const owner = "owner-user";
  const sharedUser = "shared-user";
  const reviewerUser = "reviewer-user";

  it("returns false when Commenting feature flag is disabled", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: false,
        currentUser: owner,
        owner,
        reviewStatus: ReviewStatus.READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it.each([
    ReviewStatus.READY_FOR_REVIEW,
    ReviewStatus.IN_PROGRESS,
    ReviewStatus.COMPLETE,
  ])("returns true for owner in review state %s", (status) => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: owner,
        owner,
        reviewStatus: status,
      })
    ).toBe(true);
  });

  it.each([
    ReviewStatus.READY_FOR_REVIEW,
    ReviewStatus.IN_PROGRESS,
    ReviewStatus.COMPLETE,
  ])("returns true for shared user in review state %s", (status) => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: sharedUser,
        owner,
        acls: [{ userId: sharedUser, roles: ["SHARED_WITH"] }],
        reviewStatus: status,
      })
    ).toBe(true);
  });

  it("returns false for owner outside review state", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: owner,
        owner,
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns false for shared user outside review state", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: sharedUser,
        owner,
        acls: [{ userId: sharedUser, roles: ["SHARED_WITH"] }],
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns true for assigned reviewer even outside review states", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: reviewerUser,
        owner,
        hasReviewerRole: true,
        assignedReviewers: [reviewerUser],
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(true);
  });

  it("returns false when user has reviewer role but is not assigned", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: reviewerUser,
        owner,
        hasReviewerRole: true,
        assignedReviewers: ["another-reviewer"],
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns false when user is assigned but missing reviewer role", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: reviewerUser,
        owner,
        hasReviewerRole: false,
        assignedReviewers: [reviewerUser],
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns false for unrelated users", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: "unrelated-user",
        owner,
        acls: [{ userId: sharedUser, roles: ["SHARED_WITH"] }],
        reviewStatus: ReviewStatus.COMPLETE,
      })
    ).toBe(false);
  });
});
