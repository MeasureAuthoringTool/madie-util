import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import { Comment } from "@madie/madie-models";
import CommentEntry from "./CommentEntry";
import { richTextHasContent, sanitizeRichText } from "../../../util/richText";

export interface CommentThreadProps {
  comment: Comment;
  isAuthor: (comment: Comment) => boolean;
  onSaveComment?: (comment: Comment, content: string) => void;
  onDeleteComment?: (comment: Comment) => void;
  onAddReply?: (
    parent: Comment,
    content: string
  ) => void | Promise<boolean | void>;
  onSaveReply?: (parent: Comment, reply: Comment, content: string) => void;
  onDeleteReply?: (parent: Comment, reply: Comment) => void;
}

const CommentThread = ({
  comment,
  isAuthor,
  onSaveComment,
  onDeleteComment,
  onAddReply,
  onSaveReply,
  onDeleteReply,
}: CommentThreadProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [draftReply, setDraftReply] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const replies = useMemo(
    () =>
      [...(comment.replies ?? [])].sort((a, b) =>
        (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
      ),
    [comment.replies]
  );

  const closeReply = () => {
    setDraftReply("");
    setReplyOpen(false);
  };

  const saveReply = async () => {
    setIsSaving(true);
    try {
      const saved = await onAddReply?.(comment, sanitizeRichText(draftReply));
      if (saved !== false) {
        closeReply();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      className="comments-flyout-panel-thread"
      data-testid={`comment-thread-${comment.id}`}
    >
      <CommentEntry
        comment={comment}
        canEdit={isAuthor(comment)}
        onSave={onSaveComment}
        onDelete={onDeleteComment}
        onReply={onAddReply ? () => setReplyOpen(true) : undefined}
      />

      {(replies.length > 0 || replyOpen) && (
        <Box
          className="comments-flyout-panel-replies"
          data-testid={`comment-replies-${comment.id}`}
        >
          {replies.map((reply) => (
            <CommentEntry
              key={reply.id}
              comment={reply}
              isReply
              canEdit={isAuthor(reply)}
              onSave={(edited, content) =>
                onSaveReply?.(comment, edited, content)
              }
              onDelete={(deleted) => onDeleteReply?.(comment, deleted)}
            />
          ))}

          {replyOpen && (
            <Box
              className="comments-flyout-panel-reply-composer"
              data-testid={`reply-composer-${comment.id}`}
            >
              <RichTextEditor
                id={`reply-input-${comment.id}`}
                name={`reply-input-${comment.id}`}
                data-testid={`reply-input-${comment.id}`}
                label=""
                content={draftReply}
                onChange={(value: string) => setDraftReply(value)}
              />
              <Box className="comments-flyout-panel-comment-editor-actions">
                <Button
                  variant="outline-secondary"
                  onClick={closeReply}
                  data-testid={`reply-cancel-${comment.id}`}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline-cyan"
                  disabled={!richTextHasContent(draftReply) || isSaving}
                  onClick={saveReply}
                  data-testid={`reply-save-${comment.id}`}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CommentThread;
