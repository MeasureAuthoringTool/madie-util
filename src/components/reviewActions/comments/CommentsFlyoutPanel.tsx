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
import { normalizeUserId } from "../../../util/reviewCommentVisibility";

import { ReviewEntityType } from "../../../util/reviewReadiness";
import "./CommentsFlyoutPanel.scss";

const GENERAL_SECTION = "General";

export interface CommentSubSectionItem {
  id?: string;
  name: string;
}

export interface CommentSection {
  name: string;
  subSections: Array<string | CommentSubSectionItem>;
}

export interface CommentSectionLocation {
  activeMainSection?: string;
  activeSubSection: string;
  activeSubSectionId?: string;
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
const getAddCommentLabel = (subSectionName: string) => {
  const fullLabel = `Add a comment to ${subSectionName}`;
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

const toSubSectionItem = (
  entry: string | CommentSubSectionItem
): CommentSubSectionItem =>
  typeof entry === "string" ? { name: entry } : entry;

const subSectionKey = (
  section: string,
  subSection: string,
  subSectionId?: string
) =>
  subSectionId ? `${section}::#${subSectionId}` : `${section}::${subSection}`;

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
  const {
    activeMainSection: mainSection,
    activeSubSection: subSection,
    activeSubSectionId: subSectionId,
  } = activeSection;
  const [draftComment, setDraftComment] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubSectionKeys, setExpandedSubSectionKeys] = useState<
    string[]
  >([]);
  const [selectedSubSectionKey, setSelectedSubSectionKey] =
    useState<string>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedToastOpen, setDeletedToastOpen] = useState(false);

  const authorName = currentUserName || currentUserId || "Unknown user";

  const activeSubSectionKey = mainSection
    ? subSectionKey(mainSection, subSection, subSectionId)
    : null;
  const hasDraftContent = richTextHasContent(draftComment);

  const commentsBySubSectionKey = useMemo(() => {
    const buckets = comments.reduce<Record<string, Comment[]>>(
      (grouped, comment) => {
        const key = subSectionKey(
          comment.mainSection,
          comment.subSection,
          comment.subSectionId
        );
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(comment);
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
    setExpandedSubSectionKeys(activeSubSectionKey ? [activeSubSectionKey] : []);
    setSelectedSubSectionKey(activeSubSectionKey);
  }, [mainSection, subSection, subSectionId, open]);

  const toggleSection = (section: string, expanded: boolean) =>
    setExpandedSections((sections) =>
      expanded
        ? [...sections, section]
        : sections.filter((expandedSection) => expandedSection !== section)
    );

  const toggleSubSection = (key: string, expanded: boolean) => {
    setSelectedSubSectionKey(key);
    setExpandedSubSectionKeys((keys) =>
      expanded
        ? [...keys, key]
        : keys.filter((expandedKey) => expandedKey !== key)
    );
  };

  const handleAddComment = () => {
    const newComment: Comment = {
      id: undefined,
      mainSection,
      subSection: subSectionId ? undefined : subSection,
      subSectionId,
      harpId: currentUserId,
      authorName,
      createdAt: new Date().toISOString(),
      edited: false,
      content: sanitizeRichText(draftComment),
    };

    onAddComment?.(newComment);
    setDraftComment("");
  };

  const handleUpdateComment = (
    commentToUpdate: Comment,
    updatedContent: string
  ) => {
    onUpdateComment?.({
      ...commentToUpdate,
      content: updatedContent,
      edited: true,
    });
  };

  const isCurrentUserAuthor = (comment: Comment) => {
    const harpId = normalizeUserId(comment.harpId);
    if (harpId) {
      return harpId === normalizeUserId(currentUserId);
    }
    const author = normalizeUserId(comment.authorName);
    return (
      author.length > 0 &&
      [currentUserName, currentUserId].some(
        (candidate) => normalizeUserId(candidate) === author
      )
    );
  };

  const handleClose = () => {
    setCommentToDelete(null);
    setDraftComment("");
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
            const keyForSubSection = (subSectionItem: CommentSubSectionItem) =>
              subSectionKey(
                section.name,
                subSectionItem.name,
                subSectionItem.id
              );
            const subSections = section.subSections
              .map(toSubSectionItem)
              .filter(
                (subSectionItem) =>
                  keyForSubSection(subSectionItem) in commentsBySubSectionKey ||
                  (isCurrentSection &&
                    keyForSubSection(subSectionItem) === activeSubSectionKey)
              );
            if (
              isCurrentSection &&
              !subSections.some(
                (subSectionItem) =>
                  keyForSubSection(subSectionItem) === activeSubSectionKey
              )
            ) {
              subSections.push({ id: subSectionId, name: subSection });
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
                  {subSections.map((subSectionItem) => {
                    const key = keyForSubSection(subSectionItem);

                    return (
                      <CommentSubSection
                        key={key}
                        title={subSectionItem.name}
                        highlighted={selectedSubSectionKey === key}
                        expanded={expandedSubSectionKeys.includes(key)}
                        onToggle={(expanded) => toggleSubSection(key, expanded)}
                        data-testid={
                          key === activeSubSectionKey
                            ? "comments-current-subsection"
                            : undefined
                        }
                      >
                        {(commentsBySubSectionKey[key] ?? []).map((comment) => (
                          <CommentEntry
                            key={comment.id}
                            comment={comment}
                            canEdit={isCurrentUserAuthor(comment)}
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
            content={draftComment}
            onChange={(value: string) => setDraftComment(value)}
          />
          <Box className="comments-flyout-panel-actions">
            <Button
              variant="outline-secondary"
              disabled={!hasDraftContent}
              onClick={() => setDraftComment("")}
              data-testid="comments-flyout-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!hasDraftContent}
              onClick={handleAddComment}
              data-testid="comments-flyout-add"
            >
              Add Comment
            </Button>
          </Box>
        </Box>

        <DeleteCommentDialog
          open={commentToDelete !== null}
          isDeleting={isDeleting}
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
