import React, { useState } from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import { Comment } from "@madie/madie-models";
import { formatReviewCommentDate } from "../../../util/reviewReadiness";
import { richTextHasContent, sanitizeRichText } from "../../../util/richText";

export interface CommentEntryProps {
  comment: Comment;
  canEdit?: boolean;
  onSave?: (comment: Comment, content: string) => void;
  onDelete?: (comment: Comment) => void;
}

const CommentEntry = ({
  comment,
  canEdit = false,
  onSave,
  onDelete,
}: CommentEntryProps) => {
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
        isEditing ? " comments-flyout-panel-comment--editing" : ""
      }`}
      data-testid={`comment-${comment.id}`}
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
            data-testid={`comment-edited-${comment.id}`}
          >
            (edited)
          </Typography>
        )}

        {canEdit && !isEditing && (
          <ClickAwayListener onClickAway={() => setActionsOpen(false)}>
            <Box
              className="comments-flyout-panel-comment-actions"
              data-testid={`comment-actions-${comment.id}`}
              onKeyDown={(event) => {
                if (event.key === "Escape") setActionsOpen(false);
              }}
            >
              {actionsOpen && (
                <>
                  <Tooltip title="Edit comment">
                    <IconButton
                      size="small"
                      aria-label="Edit comment"
                      className="comments-flyout-panel-comment-action"
                      data-testid={`comment-edit-${comment.id}`}
                      onClick={startEditing}
                    >
                      <Pencil size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete comment">
                    <IconButton
                      size="small"
                      aria-label="Delete comment"
                      className="comments-flyout-panel-comment-action"
                      data-testid={`comment-delete-${comment.id}`}
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
                  data-testid={`comment-more-actions-${comment.id}`}
                  onClick={() => setActionsOpen((open) => !open)}
                >
                  <Ellipsis size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          </ClickAwayListener>
        )}
      </Box>

      {isEditing ? (
        <Box className="comments-flyout-panel-comment-editor">
          <RichTextEditor
            id={`comment-editor-${comment.id}`}
            name={`comment-editor-${comment.id}`}
            data-testid={`comment-editor-${comment.id}`}
            label=""
            content={draftContent}
            onChange={(value: string) => setDraftContent(value)}
          />
          <Box className="comments-flyout-panel-comment-editor-actions">
            <Button
              variant="outline-secondary"
              onClick={cancelEditing}
              data-testid={`comment-edit-cancel-${comment.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!richTextHasContent(draftContent)}
              onClick={saveEdit}
              data-testid={`comment-edit-save-${comment.id}`}
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
