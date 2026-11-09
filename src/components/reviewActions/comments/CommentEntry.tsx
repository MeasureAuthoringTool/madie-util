import React, { useState } from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { CornerDownRight, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import { Comment } from "@madie/madie-models";
import { formatReviewCommentDate } from "../../../util/reviewReadiness";
import { richTextHasContent, sanitizeRichText } from "../../../util/richText";

export interface CommentEntryProps {
  comment: Comment;
  canEdit?: boolean;
  onSave?: (comment: Comment, content: string) => void;
  onDelete?: (comment: Comment) => void;
  // shows the Reply icon on a top-level comment
  onReply?: (comment: Comment) => void;
  isReply?: boolean;
}

const CommentEntry = ({
  comment,
  canEdit = false,
  onSave,
  onDelete,
  onReply,
  isReply = false,
}: CommentEntryProps) => {
  const kind = isReply ? "reply" : "comment";
  const testId = (part: string) =>
    part ? `${kind}-${part}-${comment.id}` : `${kind}-${comment.id}`;
  const showReply = Boolean(onReply) && !isReply;
  const [isEditing, setIsEditing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [draftContent, setDraftContent] = useState(comment.content ?? "");

  const startEditing = () => {
    setDraftContent(comment.content ?? "");
    setActionsOpen(false);
    setIsEditing(true);
  };

  const deleteComment = () => {
    setActionsOpen(false);
    onDelete?.(comment);
  };

  const cancelEditing = () => {
    setDraftContent(comment.content ?? "");
    setIsEditing(false);
  };

  const saveEdit = () => {
    onSave?.(comment, sanitizeRichText(draftContent));
    setIsEditing(false);
  };

  return (
    <Box
      className={`comments-flyout-panel-comment${
        isReply ? " comments-flyout-panel-comment--reply" : ""
      }${isEditing ? " comments-flyout-panel-comment--editing" : ""}`}
      data-testid={testId("")}
    >
      <Box className="comments-flyout-panel-comment-meta">
        <Typography
          component="span"
          className="comments-flyout-panel-comment-author"
        >
          {comment.authorName}
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
        >
          {formatReviewCommentDate(comment.createdAt)}
        </Typography>
        {comment.edited && (
          <Typography
            component="span"
            className="comments-flyout-panel-comment-edited"
            data-testid={testId("edited")}
          >
            (edited)
          </Typography>
        )}

        {!isEditing && (showReply || canEdit) && (
          <Box className="comments-flyout-panel-comment-toolbar">
            {showReply && (
              <Tooltip title="Reply">
                <IconButton
                  size="small"
                  aria-label="Reply"
                  className="comments-flyout-panel-comment-reply"
                  data-testid={testId("reply")}
                  onClick={() => onReply(comment)}
                >
                  <CornerDownRight size={16} />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <ClickAwayListener onClickAway={() => setActionsOpen(false)}>
                <Box
                  className="comments-flyout-panel-comment-actions"
                  data-testid={testId("actions")}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setActionsOpen(false);
                  }}
                >
                  {actionsOpen && (
                    <>
                      <Tooltip title={`Edit ${kind}`}>
                        <IconButton
                          size="small"
                          aria-label={`Edit ${kind}`}
                          className="comments-flyout-panel-comment-action"
                          data-testid={testId("edit")}
                          onClick={startEditing}
                        >
                          <Pencil size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Delete ${kind}`}>
                        <IconButton
                          size="small"
                          aria-label={`Delete ${kind}`}
                          className="comments-flyout-panel-comment-action"
                          data-testid={testId("delete")}
                          onClick={deleteComment}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      aria-label="More actions"
                      aria-expanded={actionsOpen}
                      className={`comments-flyout-panel-comment-more${
                        actionsOpen
                          ? " comments-flyout-panel-comment-more--open"
                          : ""
                      }`}
                      data-testid={testId("more-actions")}
                      onClick={() => setActionsOpen((open) => !open)}
                    >
                      <Ellipsis size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ClickAwayListener>
            )}
          </Box>
        )}
      </Box>

      {isEditing ? (
        <Box className="comments-flyout-panel-comment-editor">
          <RichTextEditor
            id={testId("editor")}
            name={testId("editor")}
            data-testid={testId("editor")}
            label=""
            content={draftContent}
            onChange={(value: string) => setDraftContent(value)}
          />
          <Box className="comments-flyout-panel-comment-editor-actions">
            <Button
              variant="outline-secondary"
              onClick={cancelEditing}
              data-testid={testId("edit-cancel")}
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!richTextHasContent(draftContent)}
              onClick={saveEdit}
              data-testid={testId("edit-save")}
            >
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          component="div"
          className="comments-flyout-panel-comment-body"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(comment.content),
          }}
        />
      )}
    </Box>
  );
};

export default CommentEntry;
