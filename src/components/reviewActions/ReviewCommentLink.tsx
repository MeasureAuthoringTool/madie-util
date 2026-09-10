import React from "react";
import "./ReviewCommentLink.scss";

interface ReviewCommentLinkProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  dataTestId?: string;
}

const ReviewCommentLink = ({
  onClick,
  style,
  dataTestId = "review-comments-link",
}: ReviewCommentLinkProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Story scope: link is visible but does not perform a comments action yet.
    event.preventDefault();
    onClick?.(event);
  };

  return (
    <button
      style={style}
      type="button"
      data-testid={dataTestId}
      className="review-comments-link-button"
      onClick={handleClick}
    >
      Comments
    </button>
  );
};

export default ReviewCommentLink;
