import { ReviewStatus } from "@madie/madie-models";
import { shouldShowReviewCommentLink } from "./reviewCommentVisibility";

describe("reviewCommentVisibility", () => {
  const owner = "owner-user";
  const reviewerUser = "reviewer-user";

  it("returns false when Commenting feature flag is disabled", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: false,
        currentUser: owner,
        canEdit: true,
        reviewStatus: ReviewStatus.READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it.each([undefined, null, "", "   "])(
    "returns false when currentUser is not available (%s)",
    (currentUser) => {
      expect(
        shouldShowReviewCommentLink({
          commentingEnabled: true,
          currentUser,
          canEdit: true,
          reviewStatus: ReviewStatus.READY_FOR_REVIEW,
        })
      ).toBe(false);
    }
  );

  it.each([
    ReviewStatus.READY_FOR_REVIEW,
    ReviewStatus.IN_PROGRESS,
    ReviewStatus.COMPLETE,
  ])("returns true for owner in review state %s", (status) => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: owner,
        canEdit: true,
        reviewStatus: status,
      })
    ).toBe(true);
  });

  it("returns false for owner outside review state", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: owner,
        canEdit: true,
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns true for assigned reviewer even outside review states", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: reviewerUser,
        canEdit: false,
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
        canEdit: false,
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
        canEdit: false,
        hasReviewerRole: false,
        assignedReviewers: [reviewerUser],
        reviewStatus: ReviewStatus.NOT_READY_FOR_REVIEW,
      })
    ).toBe(false);
  });

  it("returns false for users who cannot edit and are not assigned", () => {
    expect(
      shouldShowReviewCommentLink({
        commentingEnabled: true,
        currentUser: "unrelated-user",
        canEdit: false,
        reviewStatus: ReviewStatus.COMPLETE,
      })
    ).toBe(false);
  });
});
