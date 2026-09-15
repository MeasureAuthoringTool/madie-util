import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ReviewCommentLink from "./ReviewCommentLink";

describe("ReviewCommentLink", () => {
  it("renders Comments as the accessible control name", () => {
    render(<ReviewCommentLink />);
    expect(
      screen.getByRole("button", { name: "Comments" })
    ).toBeInTheDocument();
  });

  it("uses default data-testid", () => {
    render(<ReviewCommentLink />);
    expect(screen.getByTestId("review-comments-link")).toBeInTheDocument();
  });

  it("invokes optional click callback", () => {
    const onClick = jest.fn();
    render(<ReviewCommentLink onClick={onClick} />);

    fireEvent.click(screen.getByTestId("review-comments-link"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
