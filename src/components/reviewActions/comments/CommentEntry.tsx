import React, { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
// Comment ships in madie-models but is not re-exported from its index yet,
// so it is imported by path. Switch to the package root once it is.
import { Comment } from "@madie/madie-models/dist/Comment";
import { formatReviewCommentDate } from "../../../util/reviewReadiness";
import { richTextHasContent, sanitizeRichText } from "../../../util/richText";

export interface CommentEntryProps {
  comment: Comment;
  // the action center is only for comments the signed-in user wrote
  canManage?: boolean;
  onSave?: (comment: Comment, content: string) => void;
  onDelete?: (comment: Comment) => void;
}

/*
  One comment in a sub-section's list: who wrote it, when, and the text, with
  an action center for the author. The author's name is stored on the comment,
  so another user's comment needs no lookup to render.
*/
const CommentEntry = ({
  comment,
  canManage = false,
  onSave,
  onDelete,
}: CommentEntryProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content ?? "");

  const startEditing = () => {
    setDraft(comment.content ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    // back to read-only with nothing saved
    setDraft(comment.content ?? "");
    setEditing(false);
  };

  const saveEdit = () => {
    onSave?.(comment, sanitizeRichText(draft));
    setEditing(false);
  };

  return (
    <Box
      className="comments-flyout-panel-comment"
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
        {/* the timestamp stays as first posted; this is the only edit marker */}
        {comment.edited && (
          <Typography
            component="span"
            className="comments-flyout-panel-comment-edited"
            data-testid={`comment-edited-${comment.id}`}
          >
            (edited)
          </Typography>
        )}

        {canManage && !editing && (
          <Box
            className="comments-flyout-panel-comment-actions"
            data-testid={`comment-actions-${comment.id}`}
          >
            <Tooltip title="Edit comment" arrow>
              <IconButton
                size="small"
                aria-label="Edit comment"
                data-testid={`comment-edit-${comment.id}`}
                onClick={startEditing}
              >
                <Pencil size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete comment" arrow>
              <IconButton
                size="small"
                aria-label="Delete comment"
                data-testid={`comment-delete-${comment.id}`}
                onClick={() => onDelete?.(comment)}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {editing ? (
        <Box className="comments-flyout-panel-comment-editor">
          <RichTextEditor
            id={`comment-editor-${comment.id}`}
            name={`comment-editor-${comment.id}`}
            data-testid={`comment-editor-${comment.id}`}
            label=""
            content={draft}
            onChange={(value: string) => setDraft(value)}
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
              disabled={!richTextHasContent(draft)}
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
          // rich text from the editor, sanitized on the way in and out
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(comment.content),
          }}
        />
      )}
    </Box>
  );
};

export default CommentEntry;
