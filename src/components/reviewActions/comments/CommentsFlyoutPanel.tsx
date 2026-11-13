import React, { useEffect, useMemo, useRef, useState } from "react";
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
import CommentCountChip from "./CommentCountChip";
import CommentThread from "./CommentThread";
import { countComments, countCommentThread } from "../../../util/commentCounts";
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
  // called each time the panel opens, so the latest comments can be fetched
  onOpen?: () => void;
  entityType: ReviewEntityType;
  sections: CommentSection[];
  activeSection: CommentSectionLocation;
  comments?: Comment[];
  currentUserId?: string;
  onAddComment?: (comment: Comment) => void;
  onUpdateComment?: (comment: Comment) => void | Promise<boolean | void>;
  onDeleteComment?: (comment: Comment) => void | Promise<boolean | void>;
  onAddReply?: (
    parent: Comment,
    reply: Comment
  ) => void | Promise<boolean | void>;
  onUpdateReply?: (
    parent: Comment,
    reply: Comment
  ) => void | Promise<boolean | void>;
  onDeleteReply?: (
    parent: Comment,
    reply: Comment
  ) => void | Promise<boolean | void>;
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

interface DeleteTarget {
  comment: Comment;
  parent?: Comment;
}

const CommentsFlyoutPanel = ({
  open,
  onClose,
  onOpen,
  entityType,
  sections,
  activeSection,
  comments = [],
  currentUserName,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddReply,
  onUpdateReply,
  onDeleteReply,
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
  const [expandedSubSection, setExpandedSubSection] = useState<{
    section: string;
    key: string;
  }>(null);
  const [selectedSubSectionKey, setSelectedSubSectionKey] =
    useState<string>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedToastMessage, setDeletedToastMessage] = useState<string | null>(
    null
  );

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

  const totalCommentCount = useMemo(() => countComments(comments), [comments]);
  const commentCountsByMainSection = useMemo(
    () =>
      comments.reduce<Record<string, number>>((counts, comment) => {
        counts[comment.mainSection] =
          (counts[comment.mainSection] ?? 0) + countCommentThread(comment);
        return counts;
      }, {}),
    [comments]
  );
  const mainSectionCount = (sectionName: string) =>
    commentCountsByMainSection[sectionName] ?? 0;

  useEffect(() => {
    setExpandedSections(mainSection ? [mainSection] : []);
    setExpandedSubSection(
      activeSubSectionKey
        ? { section: mainSection, key: activeSubSectionKey }
        : null
    );
    setSelectedSubSectionKey(activeSubSectionKey);
  }, [mainSection, activeSubSectionKey, open]);

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  useEffect(() => {
    if (open) {
      onOpenRef.current?.();
    }
  }, [open]);

  const toggleSection = (section: string, expanded: boolean) =>
    setExpandedSections((sections) =>
      expanded
        ? [...sections, section]
        : sections.filter((expandedSection) => expandedSection !== section)
    );

  const toggleSubSection = (
    section: string,
    key: string,
    expanded: boolean
  ) => {
    setSelectedSubSectionKey(key);
    setExpandedSubSection(expanded ? { section, key } : null);
    if (expanded && expandedSubSection?.section !== section) {
      setExpandedSections((sections) => [
        ...sections.filter(
          (name) => name !== expandedSubSection?.section && name !== section
        ),
        section,
      ]);
    }
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

  const handleAddReply = (parent: Comment, content: string) => {
    const reply: Comment = {
      id: undefined,
      harpId: currentUserId,
      authorName,
      createdAt: new Date().toISOString(),
      edited: false,
      content,
    };
    return onAddReply?.(parent, reply);
  };

  const handleUpdateReply = (
    parent: Comment,
    replyToUpdate: Comment,
    updatedContent: string
  ) => {
    onUpdateReply?.(parent, {
      ...replyToUpdate,
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
    setDeleteTarget(null);
    setDraftComment("");
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const { comment, parent } = deleteTarget;
    setIsDeleting(true);
    try {
      const deleted = parent
        ? await onDeleteReply?.(parent, comment)
        : await onDeleteComment?.(comment);
      if (deleted !== false) {
        setDeleteTarget(null);
        setDeletedToastMessage(
          parent ? "Reply has been deleted." : "Comment has been deleted."
        );
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
            <Typography
              variant="h6"
              className="comments-flyout-panel-title"
              data-testid="comments-flyout-total-count"
            >
              Comments ({totalCommentCount})
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
              <CommentCountChip
                label={mainSectionCount(GENERAL_SECTION)}
                data-testid={`section-comment-count-${GENERAL_SECTION}`}
              />
            </AccordionSummary>
            <AccordionDetails className="comments-flyout-panel-section-details">
              <ReviewSubSection
                entityType={entityType}
                markedForReviewBy={markedForReviewBy}
                markedForReviewAt={markedForReviewAt}
                expanded={
                  expandedSubSection?.key ===
                  subSectionKey(GENERAL_SECTION, "Review")
                }
                highlighted={
                  selectedSubSectionKey ===
                  subSectionKey(GENERAL_SECTION, "Review")
                }
                onToggle={(expanded) =>
                  toggleSubSection(
                    GENERAL_SECTION,
                    subSectionKey(GENERAL_SECTION, "Review"),
                    expanded
                  )
                }
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
                  <CommentCountChip
                    label={mainSectionCount(section.name)}
                    data-testid={`section-comment-count-${section.name}`}
                  />
                </AccordionSummary>
                <AccordionDetails className="comments-flyout-panel-section-details">
                  {subSections.map((subSectionItem) => {
                    const key = keyForSubSection(subSectionItem);

                    return (
                      <CommentSubSection
                        key={key}
                        title={subSectionItem.name}
                        commentCount={countComments(
                          commentsBySubSectionKey[key]
                        )}
                        highlighted={selectedSubSectionKey === key}
                        expanded={expandedSubSection?.key === key}
                        onToggle={(expanded) =>
                          toggleSubSection(section.name, key, expanded)
                        }
                        data-testid={
                          key === activeSubSectionKey
                            ? "comments-current-subsection"
                            : undefined
                        }
                      >
                        {(commentsBySubSectionKey[key] ?? []).map((comment) => (
                          <CommentThread
                            key={comment.id}
                            comment={comment}
                            isAuthor={isCurrentUserAuthor}
                            onSaveComment={handleUpdateComment}
                            onDeleteComment={(toDelete) =>
                              setDeleteTarget({ comment: toDelete })
                            }
                            onAddReply={onAddReply ? handleAddReply : undefined}
                            onSaveReply={handleUpdateReply}
                            onDeleteReply={(parent, reply) =>
                              setDeleteTarget({ comment: reply, parent })
                            }
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
          open={deleteTarget !== null}
          itemLabel={deleteTarget?.parent ? "reply" : "comment"}
          isDeleting={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onDelete={handleConfirmDelete}
        />
      </Box>
      <Toast
        toastKey="comments-flyout-deleted-toast"
        toastType="success"
        testId="comments-flyout-deleted-toast"
        open={deletedToastMessage !== null}
        message={deletedToastMessage ?? ""}
        closeButtonProps={{
          "data-testid": "comments-flyout-deleted-toast-close-button",
        }}
        onClose={() => setDeletedToastMessage(null)}
        autoHideDuration={6000}
      />
    </Drawer>
  );
};

export default CommentsFlyoutPanel;
