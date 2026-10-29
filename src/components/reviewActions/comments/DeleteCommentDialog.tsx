import React from "react";
import { Box, Dialog, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import { Button } from "@madie/madie-design-system/dist/react";

export interface DeleteCommentDialogProps {
  open: boolean;
  isDeleting?: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const DeleteCommentDialog = ({
  open,
  isDeleting = false,
  onCancel,
  onDelete,
}: DeleteCommentDialogProps) => (
  <Dialog
    open={open}
    onClose={isDeleting ? undefined : onCancel}
    disablePortal
    className="comments-flyout-panel-delete-dialog-root"
    aria-labelledby="delete-comment-dialog-title"
    data-testid="delete-comment-dialog"
  >
    <Box className="comments-flyout-panel-delete-dialog">
      <Trash2 color="#D92F2F" size={28} aria-hidden="true" />
      <Typography
        id="delete-comment-dialog-title"
        className="comments-flyout-panel-delete-dialog-title"
      >
        Delete this comment?
      </Typography>
      <Typography className="comments-flyout-panel-delete-dialog-body">
        This action cannot be undone.
      </Typography>
      <Box className="comments-flyout-panel-delete-dialog-actions">
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isDeleting}
          data-testid="delete-comment-cancel"
        >
          Cancel
        </Button>
        <Button
          variant="outline-red"
          onClick={onDelete}
          disabled={isDeleting}
          data-testid="delete-comment-confirm"
        >
          Delete
        </Button>
      </Box>
    </Box>
  </Dialog>
);

export default DeleteCommentDialog;
