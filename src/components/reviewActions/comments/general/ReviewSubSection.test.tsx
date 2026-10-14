import * as React from "react";
import { render, screen } from "@testing-library/react";
import ReviewSubSection from "./ReviewSubSection";

describe("ReviewSubSection", () => {
  it("is always rendered, even with nothing to show", () => {
    render(<ReviewSubSection entityType="measure" />);
    expect(
      screen.getByTestId("comments-review-subsection")
    ).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(
      screen.queryByTestId("ready-for-review-comment")
    ).not.toBeInTheDocument();
  });

  it("shows the author, the date and the measure message", () => {
    render(
      <ReviewSubSection
        entityType="measure"
        readyForReviewBy="Jonathan Jones"
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-date")
    ).toHaveTextContent("Aug 12, 2026, 9:00 AM");
    expect(
      screen.getByTestId("ready-for-review-comment-body")
    ).toHaveTextContent("Measure marked as Ready for Review");
    // The review service already resolved the name.
    expect(
      screen.getByTestId("ready-for-review-comment-author")
    ).toHaveTextContent("Jonathan Jones");
  });

  it("names the library in the message for libraries", () => {
    render(
      <ReviewSubSection
        entityType="library"
        readyForReviewBy="Jonathan Jones"
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-body")
    ).toHaveTextContent("Library marked as Ready for Review");
  });

  it("renders whatever the service sent, HARP id included", () => {
    render(
      <ReviewSubSection
        entityType="measure"
        readyForReviewBy="jjones"
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-author")
    ).toHaveTextContent("jjones");
  });
});
