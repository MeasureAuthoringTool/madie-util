import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import "./CommentSubSection.scss";

export interface CommentSubSectionProps {
  title: string;
  children?: React.ReactNode;
  // used when the sub-section manages its own expand/collapse
  defaultExpanded?: boolean;
  // pass both to let the panel own the expanded state instead
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  // marks the selected sub-section with the vertical blue bar and blue title
  highlighted?: boolean;
  "data-testid"?: string;
}

/*
  Shared shell for every sub-section rendered inside a Comments flyout panel.
  Owns the expand/collapse behaviour and the blue bar that marks the selection,
  so the panels only have to supply a title and the comments to show under it.
*/
const CommentSubSection = ({
  title,
  children,
  defaultExpanded = true,
  expanded,
  onToggle,
  highlighted = false,
  "data-testid": dataTestId,
}: CommentSubSectionProps) => {
  const expandedProps =
    expanded === undefined ? { defaultExpanded } : { expanded };

  return (
    <Accordion
      disableGutters
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
      </AccordionSummary>
      <AccordionDetails className="comments-flyout-panel-subsection-details">
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default CommentSubSection;
