import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import CommentCountChip from "./CommentCountChip";

export interface CommentSubSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  highlighted?: boolean;
  commentCount?: number; // comments + replies in this sub-section
  "data-testid"?: string;
}

const CommentSubSection = ({
  title,
  children,
  defaultExpanded = true,
  expanded,
  onToggle,
  highlighted = false,
  commentCount,
  "data-testid": dataTestId,
}: CommentSubSectionProps) => {
  const expandedProps =
    expanded === undefined ? { defaultExpanded } : { expanded };

  return (
    <Accordion
      disableGutters
      square
      elevation={0}
      {...expandedProps}
      onChange={
        onToggle
          ? (event, isExpanded: boolean) => onToggle(isExpanded)
          : undefined
      }
      className={`comments-flyout-panel-subsection${
        highlighted ? " comments-flyout-panel-subsection--current" : ""
      }`}
      data-testid={dataTestId}
    >
      <AccordionSummary
        expandIcon={<ChevronRight size={18} />}
        className="comments-flyout-panel-subsection-summary"
      >
        <Typography className="comments-flyout-panel-subsection-title">
          {title}
        </Typography>
        {commentCount !== undefined && (
          <CommentCountChip
            label={commentCount}
            data-testid={`subsection-comment-count-${title}`}
          />
        )}
      </AccordionSummary>
      <AccordionDetails className="comments-flyout-panel-subsection-details">
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default CommentSubSection;
