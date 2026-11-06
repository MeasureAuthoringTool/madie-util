import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import type { CommentSubSectionProps } from "../CommentSubSection";
import {
  formatReviewCommentDate,
  getReadyForReviewMessage,
  ReviewEntityType,
} from "../../../../util/reviewReadiness";

export interface ReviewSubSectionProps {
  entityType: ReviewEntityType;
  markedForReviewBy?: string;
  markedForReviewAt?: string;
  expanded?: boolean;
  onToggle?: CommentSubSectionProps["onToggle"];
  highlighted?: boolean;
}

const ReviewSubSection = ({
  entityType,
  markedForReviewBy,
  markedForReviewAt,
  expanded,
  onToggle,
  highlighted = true,
}: ReviewSubSectionProps) => {
  const performedAt = formatReviewCommentDate(markedForReviewAt);
  const expandedProps =
    expanded === undefined ? { defaultExpanded: true } : { expanded };

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
      data-testid="comments-review-subsection"
    >
      <AccordionSummary
        expandIcon={<ChevronRight size={18} />}
        className="comments-flyout-panel-subsection-summary"
      >
        <Typography className="comments-flyout-panel-subsection-title">
          Review
        </Typography>
      </AccordionSummary>
      <AccordionDetails className="comments-flyout-panel-subsection-details">
        {markedForReviewAt && (
          <Box
            className="comments-flyout-panel-comment"
            data-testid="ready-for-review-comment"
          >
            <Box className="comments-flyout-panel-comment-meta">
              <Typography
                component="span"
                className="comments-flyout-panel-comment-author"
                data-testid="ready-for-review-comment-author"
              >
                {markedForReviewBy}
              </Typography>
              <Typography
                component="span"
                className="comments-flyout-panel-comment-separator"
                aria-hidden="true"
              >
                &middot;
              </Typography>
              <Typography
                component="span"
                className="comments-flyout-panel-comment-date"
                data-testid="ready-for-review-comment-date"
              >
                {performedAt}
              </Typography>
            </Box>
            <Typography
              className="comments-flyout-panel-comment-body"
              data-testid="ready-for-review-comment-body"
            >
              {getReadyForReviewMessage(entityType)}
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ReviewSubSection;
