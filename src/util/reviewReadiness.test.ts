import {
  REVIEW_COMMENT_DATE_FORMAT,
  formatReviewCommentDate,
  getReadyForReviewMessage,
} from "./reviewReadiness";

describe("formatReviewCommentDate", () => {
  it("formats an ISO timestamp the way the comment meta line shows it", () => {
    const date = new Date(2026, 7, 12, 9, 0);
    expect(formatReviewCommentDate(date.toISOString())).toEqual(
      "Aug 12, 2026, 9:00 AM"
    );
  });

  it("uses a 12 hour clock with a meridiem", () => {
    const date = new Date(2026, 0, 2, 15, 30);
    expect(formatReviewCommentDate(date.toISOString())).toEqual(
      "Jan 02, 2026, 3:30 PM"
    );
  });

  it("returns an empty string when there is no date", () => {
    expect(formatReviewCommentDate(undefined)).toEqual("");
    expect(formatReviewCommentDate("")).toEqual("");
  });

  it("returns an empty string rather than throwing on an unparseable date", () => {
    expect(formatReviewCommentDate("not a date")).toEqual("");
  });

  it("exposes the format so callers render dates identically", () => {
    expect(REVIEW_COMMENT_DATE_FORMAT).toEqual("MMM dd, yyyy, h:mm a");
  });
});

describe("getReadyForReviewMessage", () => {
  it("names the measure for a measure review", () => {
    expect(getReadyForReviewMessage("measure")).toEqual(
      "Measure marked as Ready for Review"
    );
  });

  it("names the library for a library review", () => {
    expect(getReadyForReviewMessage("library")).toEqual(
      "Library marked as Ready for Review"
    );
  });
});
