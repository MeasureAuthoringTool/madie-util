import React from "react";
import { Box, Typography } from "@mui/material";
import "./ReviewSubSection.scss";
import CommentSubSection from "../CommentSubSection";
import {
  formatReviewCommentDate,
  getReadyForReviewMessage,
  ReviewEntityType,
} from "../../../../util/reviewReadiness";

export interface ReviewSubSectionProps {
  entityType: ReviewEntityType;
  readyForReviewBy?: string;
  readyForReviewAt?: string;
  // forwarded so a panel can fold Review into its own selection handling
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  highlighted?: boolean;
}

const ReviewSubSection = ({
  entityType,
  readyForReviewBy,
  readyForReviewAt,
  expanded,
  onToggle,
  highlighted,
}: ReviewSubSectionProps) => {
  const performedAt = formatReviewCommentDate(readyForReviewAt);

  return (
    <CommentSubSection
      title="Review"
      expanded={expanded}
      onToggle={onToggle}
      highlighted={highlighted}
      data-testid="comments-review-subsection"
    >
      {readyForReviewAt && (
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
              {readyForReviewBy}
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
    </CommentSubSection>
  );
};

export default ReviewSubSection;
