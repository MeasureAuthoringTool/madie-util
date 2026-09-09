import React from "react";

interface ReviewCommentLinkProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  dataTestId?: string;
}

const ReviewCommentLink = ({
  onClick,
  className,
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
      type="button"
      style={{
        alignItems: "center",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
        color: "white",
        fontSize: "16px",
        ...style,
      }}
      data-testid={dataTestId}
      className={className}
      onClick={handleClick}
    >
      <span>Comments</span>
    </button>
  );
};

export default ReviewCommentLink;
