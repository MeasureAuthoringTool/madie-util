import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MessageSquare, X, ChevronRight } from "lucide-react";
import {
  Button,
  RichTextEditor,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Comment } from "@madie/madie-models";
import ReviewSubSection from "./general/ReviewSubSection";
import CommentSubSection from "./CommentSubSection";
import CommentEntry from "./CommentEntry";
import DeleteCommentDialog from "./DeleteCommentDialog";
import { richTextHasContent, sanitizeRichText } from "../../../util/richText";
import { normalizeUserId } from "../../../util/accessControl";

import { ReviewEntityType } from "../../../util/reviewReadiness";
import "./CommentsFlyoutPanel.scss";

const GENERAL_SECTION = "General";

export interface CommentSection {
  name: string;
  subSections: string[];
}

export interface CommentSectionLocation {
  activeMainSection?: string;
  activeSubSection: string;
}

export interface CommentsFlyoutPanelProps {
  open: boolean;
  onClose: () => void;
  entityType: ReviewEntityType;
  sections: CommentSection[];
  activeSection: CommentSectionLocation;
  comments?: Comment[];
  currentUserId?: string;
  onAddComment?: (comment: Comment) => void;
  onUpdateComment?: (comment: Comment) => void;
  onDeleteComment?: (comment: Comment) => void | Promise<boolean | void>;
  currentUserName?: string;
  markedForReviewBy?: string;
  markedForReviewAt?: string;
}

const MAX_LABEL_LENGTH = 50;
const getAddCommentLabel = (subSection: string) => {
  const fullLabel = `Add a comment to ${subSection}`;
  const isLabelTruncated = fullLabel.length > MAX_LABEL_LENGTH;

  if (!isLabelTruncated) {
    return fullLabel;
  }

  const displayLabel = `${fullLabel.slice(0, MAX_LABEL_LENGTH)}...`;
  return (
    <Tooltip title={fullLabel} arrow>
      <span>{displayLabel}</span>
    </Tooltip>
  );
};

const subSectionKey = (section: string, subSection: string) =>
  `${section}::${subSection}`;

const CommentsFlyoutPanel = ({
  open,
  onClose,
  entityType,
  sections,
  activeSection,
  comments = [],
  currentUserName,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  markedForReviewBy,
  markedForReviewAt,
}: CommentsFlyoutPanelProps) => {
  const { activeMainSection: mainSection, activeSubSection: subSection } =
    activeSection;
  const [comment, setComment] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubSections, setExpandedSubSections] = useState<string[]>([]);
  const [selectedSubSection, setSelectedSubSection] = useState<string>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedToastOpen, setDeletedToastOpen] = useState(false);

  const authorName = currentUserName || currentUserId || "Unknown user";

  const currentKey = mainSection
    ? subSectionKey(mainSection, subSection)
    : null;
  const hasComment = richTextHasContent(comment);

  const commentsByKey = useMemo(() => {
    const buckets = comments.reduce<Record<string, Comment[]>>(
      (grouped, entry) => {
        const key = subSectionKey(entry.mainSection, entry.subSection);
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(entry);
        return grouped;
      },
      {}
    );

    Object.values(buckets).forEach((bucket) =>
      bucket.sort((a, b) =>
        (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
      )
    );
    return buckets;
  }, [comments]);

  useEffect(() => {
    setExpandedSections(mainSection ? [mainSection] : []);
    setExpandedSubSections(currentKey ? [currentKey] : []);
    setSelectedSubSection(currentKey);
  }, [mainSection, subSection, open]);

  const toggleSection = (section: string, expanded: boolean) =>
    setExpandedSections((sections) =>
      expanded
        ? [...sections, section]
        : sections.filter((expandedSection) => expandedSection !== section)
    );

  const toggleSubSection = (key: string, expanded: boolean) => {
    setSelectedSubSection(key);
    setExpandedSubSections((keys) =>
      expanded
        ? [...keys, key]
        : keys.filter((expandedKey) => expandedKey !== key)
    );
  };

  const handleAddComment = () => {
    const newComment: Comment = {
      id: undefined,
      mainSection,
      subSection,
      harpId: currentUserId,
      authorName,
      createdAt: new Date().toISOString(),
      edited: false,
      content: sanitizeRichText(comment),
    };

    onAddComment?.(newComment);
    setComment("");
  };

  const handleUpdateComment = (edited: Comment, content: string) => {
    onUpdateComment?.({ ...edited, content, edited: true });
  };

  const isAuthor = (entry: Comment) => {
    const harpId = normalizeUserId(entry.harpId);
    if (harpId) {
      return harpId === normalizeUserId(currentUserId);
    }
    const author = normalizeUserId(entry.authorName);
    return (
      author.length > 0 &&
      [currentUserName, currentUserId].some(
        (candidate) => normalizeUserId(candidate) === author
      )
    );
  };

  const handleClose = () => {
    setCommentToDelete(null);
    setComment("");
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      const deleted = await onDeleteComment?.(commentToDelete);
      if (deleted !== false) {
        setCommentToDelete(null);
        setDeletedToastOpen(true);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      data-testid="comments-flyout"
    >
      <Box
        role="dialog"
        aria-label="Comments"
        className="comments-flyout-panel"
      >
        <Box className="comments-flyout-panel-header">
          <Box className="comments-flyout-panel-title-row">
            <MessageSquare color="#0096f4" size={14} />
            <Typography variant="h6" className="comments-flyout-panel-title">
              Comments
            </Typography>
          </Box>
          <IconButton
            aria-label="Close comments"
            data-testid="comments-flyout-close"
            onClick={handleClose}
          >
            <X />
          </IconButton>
        </Box>

        <Box className="comments-flyout-panel-sections">
          <Accordion
            disableGutters
            elevation={0}
            expanded={expandedSections.includes(GENERAL_SECTION)}
            onChange={(event, expanded) =>
              toggleSection(GENERAL_SECTION, expanded)
            }
            className="comments-flyout-panel-accordion"
          >
            <AccordionSummary
              expandIcon={<ChevronRight />}
              className="comments-flyout-panel-accordion-summary"
            >
              <Typography className="comments-flyout-panel-section-title">
                {GENERAL_SECTION}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="comments-flyout-panel-section-details">
              {/* Review stands on its own: it is not part of the selection */}
              <ReviewSubSection
                entityType={entityType}
                markedForReviewBy={markedForReviewBy}
                markedForReviewAt={markedForReviewAt}
              />
            </AccordionDetails>
          </Accordion>

          {sections.map((section) => {
            const isCurrentSection = section.name === mainSection;
            // a row is shown when it has comments or is the one the user is on
            const subSections = section.subSections.filter(
              (name) =>
                subSectionKey(section.name, name) in commentsByKey ||
                (isCurrentSection && name === subSection)
            );
            if (isCurrentSection && !subSections.includes(subSection)) {
              subSections.push(subSection);
            }

            return (
              <Accordion
                key={section.name}
                disableGutters
                elevation={0}
                expanded={expandedSections.includes(section.name)}
                onChange={(event, expanded) =>
                  toggleSection(section.name, expanded)
                }
                className="comments-flyout-panel-accordion"
              >
                <AccordionSummary
                  expandIcon={<ChevronRight />}
                  className="comments-flyout-panel-accordion-summary"
                >
                  <Typography className="comments-flyout-panel-section-title">
                    {section.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="comments-flyout-panel-section-details">
                  {subSections.map((name) => {
                    const key = subSectionKey(section.name, name);

                    return (
                      <CommentSubSection
                        key={key}
                        title={name}
                        highlighted={selectedSubSection === key}
                        expanded={expandedSubSections.includes(key)}
                        onToggle={(expanded) => toggleSubSection(key, expanded)}
                        data-testid={
                          key === currentKey
                            ? "comments-current-subsection"
                            : undefined
                        }
                      >
                        {(commentsByKey[key] ?? []).map((entry) => (
                          <CommentEntry
                            key={entry.id}
                            comment={entry}
                            canEdit={isAuthor(entry)}
                            onSave={handleUpdateComment}
                            onDelete={setCommentToDelete}
                          />
                        ))}
                      </CommentSubSection>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        <Box className="comments-flyout-panel-composer">
          <RichTextEditor
            id="comments-flyout-input"
            name="comments-flyout-input"
            data-testid="comments-flyout-input"
            label={getAddCommentLabel(subSection)}
            content={comment}
            onChange={(value: string) => setComment(value)}
          />
          <Box className="comments-flyout-panel-actions">
            <Button
              variant="outline-secondary"
              disabled={!hasComment}
              onClick={() => setComment("")}
              data-testid="comments-flyout-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!hasComment}
              onClick={handleAddComment}
              data-testid="comments-flyout-add"
            >
              Add Comment
            </Button>
          </Box>
        </Box>

        <DeleteCommentDialog
          open={commentToDelete !== null}
          deleting={isDeleting}
          onCancel={() => setCommentToDelete(null)}
          onDelete={handleConfirmDelete}
        />
      </Box>
      <Toast
        toastKey="comments-flyout-deleted-toast"
        toastType="success"
        testId="comments-flyout-deleted-toast"
        open={deletedToastOpen}
        message="Comment has been deleted."
        closeButtonProps={{
          "data-testid": "comments-flyout-deleted-toast-close-button",
        }}
        onClose={() => setDeletedToastOpen(false)}
        autoHideDuration={6000}
      />
    </Drawer>
  );
};

export default CommentsFlyoutPanel;
