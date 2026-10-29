import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentEntry from "./CommentEntry";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  RichTextEditor: ({ content, onChange, ...props }: any) => (
    <textarea
      value={content}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  ),
}));

const comment = {
  id: "c1",
  mainSection: "Details",
  subSection: "Name, Version & ID",
  authorName: "Jonathan Jones",
  createdAt: "2025-06-20T09:08:00.000Z",
  edited: false,
  content: "<p>Casing is intentional.</p>",
};

describe("CommentEntry", () => {
  it("shows the author, the timestamp and the text", () => {
    render(<CommentEntry comment={comment} />);

    expect(screen.getByText("Jonathan Jones")).toBeInTheDocument();
    expect(screen.getByText(/Jun 20, 2025/)).toBeInTheDocument();
    expect(screen.getByText("Casing is intentional.")).toBeInTheDocument();
  });

  it("marks an edited comment without changing its timestamp", () => {
    render(<CommentEntry comment={{ ...comment, edited: true }} />);

    expect(screen.getByTestId("comment-edited-c1")).toHaveTextContent(
      "(edited)"
    );
    expect(screen.getByText(/Jun 20, 2025/)).toBeInTheDocument();
  });

  it("hides the action center on another user's comment", () => {
    render(<CommentEntry comment={comment} />);

    expect(screen.queryByTestId("comment-actions-c1")).not.toBeInTheDocument();
  });

  it("offers edit and delete on the signed-in user's own comment", async () => {
    render(<CommentEntry comment={comment} canEdit />);

    expect(screen.getByTestId("comment-actions-c1")).toBeInTheDocument();

    userEvent.hover(screen.getByTestId("comment-edit-c1"));
    await waitFor(() =>
      expect(
        screen.getByRole("tooltip", { name: "Edit comment" })
      ).toBeInTheDocument()
    );
  });

  it("shows the delete tooltip", async () => {
    render(<CommentEntry comment={comment} canEdit />);

    userEvent.hover(screen.getByTestId("comment-delete-c1"));
    await waitFor(() =>
      expect(
        screen.getByRole("tooltip", { name: "Delete comment" })
      ).toBeInTheDocument()
    );
  });

  describe("editing", () => {
    it("turns the text into a field with Cancel and Save", () => {
      render(<CommentEntry comment={comment} canEdit />);

      userEvent.click(screen.getByTestId("comment-edit-c1"));

      expect(screen.getByTestId("comment-editor-c1")).toBeInTheDocument();
      expect(screen.getByTestId("comment-edit-cancel-c1")).toBeInTheDocument();
      expect(screen.getByTestId("comment-edit-save-c1")).toBeInTheDocument();
    });

    it("discards the edit on cancel", () => {
      const onSave = jest.fn();
      render(<CommentEntry comment={comment} canEdit onSave={onSave} />);

      userEvent.click(screen.getByTestId("comment-edit-c1"));
      userEvent.type(screen.getByTestId("comment-editor-c1"), " and more");
      userEvent.click(screen.getByTestId("comment-edit-cancel-c1"));

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.queryByTestId("comment-editor-c1")).not.toBeInTheDocument();
      expect(screen.getByText("Casing is intentional.")).toBeInTheDocument();
    });

    it("reports the edit on save and returns to read-only", () => {
      const onSave = jest.fn();
      render(<CommentEntry comment={comment} canEdit onSave={onSave} />);

      userEvent.click(screen.getByTestId("comment-edit-c1"));
      userEvent.clear(screen.getByTestId("comment-editor-c1"));
      userEvent.type(screen.getByTestId("comment-editor-c1"), "<p>Revised</p>");
      userEvent.click(screen.getByTestId("comment-edit-save-c1"));

      expect(onSave).toHaveBeenCalledWith(comment, "<p>Revised</p>");
      expect(screen.queryByTestId("comment-editor-c1")).not.toBeInTheDocument();
    });
  });

  describe("deleting", () => {
    it("asks to delete the comment when the trash icon is clicked", () => {
      const onDelete = jest.fn();
      render(<CommentEntry comment={comment} canEdit onDelete={onDelete} />);

      userEvent.click(screen.getByTestId("comment-delete-c1"));

      expect(onDelete).toHaveBeenCalledWith(comment);
    });
  });
});
