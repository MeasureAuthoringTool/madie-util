import React from "react";
import { Box, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

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
  <MadieDialog
    title=""
    titleBoxSx={{ display: "none" }}
    contentSx={{ padding: 0, maxHeight: "none" }}
    dialogProps={{
      open,
      onClose: isDeleting ? undefined : onCancel,
      disablePortal: true,
      className: "comments-flyout-panel-delete-dialog-root",
      "aria-labelledby": "delete-comment-dialog-title",
      "data-testid": "delete-comment-dialog",
    }}
    cancelButtonProps={{
      variant: "outline",
      cancelText: "Cancel",
      onClick: onCancel,
      disabled: isDeleting,
      "data-testid": "delete-comment-cancel",
    }}
    continueButtonProps={{
      variant: "danger-primary",
      continueText: "Delete",
      onClick: onDelete,
      disabled: isDeleting,
      "data-testid": "delete-comment-confirm",
    }}
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
    </Box>
  </MadieDialog>
);

export default DeleteCommentDialog;
