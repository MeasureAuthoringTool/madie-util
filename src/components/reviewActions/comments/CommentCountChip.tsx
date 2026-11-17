import React from "react";
import { ChevronRight } from "lucide-react";

export interface CommentCountChipProps {
  label: string | number;
  onClick?: () => void;
  expanded?: boolean;
  "data-testid"?: string;
}

const CommentCountChip = ({
  label,
  onClick,
  expanded,
  "data-testid": dataTestId,
}: CommentCountChipProps) => {
  if (!onClick) {
    return (
      <span className="comments-count-chip" data-testid={dataTestId}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`comments-count-chip comments-count-chip--toggle${
        expanded ? " comments-count-chip--expanded" : ""
      }`}
      aria-expanded={!!expanded}
      onClick={onClick}
      data-testid={dataTestId}
    >
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="comments-count-chip-chevron"
      />
      {label}
    </button>
  );
};

export default CommentCountChip;
