import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import CommentsFlyoutPanel from "./CommentsFlyoutPanel";
import userEvent from "@testing-library/user-event";
jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Toast: ({ open, message, testId }: any) =>
    open ? <div data-testid={testId}>{message}</div> : null,
  RichTextEditor: ({ label, content, onChange, ...props }: any) => (
    <div>
      <div data-testid="comments-flyout-label">{label}</div>
      <textarea
        aria-label={typeof label === "string" ? label : undefined}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </div>
  ),
}));
const sections = [
  {
    name: "Details",
    subSections: ["Name, Version & ID", "Model & Measurement Period"],
  },
  { name: "CQL Editor", subSections: ["CQL Editor"] },
  {
    name: "Population Criteria",
    subSections: ["Criteria 1", "Criteria 2", "Supplemental Data"],
  },
  { name: "Test Cases", subSections: ["Population Criteria 1", "SDE"] },
];

// a stored comment tagged for the given header / sub-section
const commentOn = (mainSection: string, subSection: string) => ({
  id: `${mainSection}-${subSection}`,
  mainSection,
  subSection,
  authorName: "Sarah Mitchell",
  createdAt: "2025-06-18T10:42:00.000Z",
  edited: false,
  content: "<p>A stored comment</p>",
});

const titlesIn = (container: Element) =>
  Array.from(
    container.querySelectorAll(".comments-flyout-panel-subsection-title")
  ).map((title) => title.textContent);

const rowFor = (title: string) =>
  screen
    .getByText(title, { selector: ".comments-flyout-panel-subsection-title" })
    .closest(".comments-flyout-panel-subsection");

const isHighlighted = (row: Element) =>
  row.classList.contains("comments-flyout-panel-subsection--current");

describe("CommentsFlyoutPanel", () => {
  it("renders the sections and keeps actions disabled until text is entered", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "CQL Editor" }}
      />
    );
    expect(
      screen.getByRole("dialog", { name: "Comments" })
    ).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Population Criteria")).toBeInTheDocument();
    expect(screen.getByTestId("comments-flyout-cancel")).toBeDisabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeDisabled();
    expect(
      screen.getByLabelText("Add a comment to CQL Editor")
    ).toBeInTheDocument();
    userEvent.type(
      screen.getByTestId("comments-flyout-input"),
      "<p>A comment</p>"
    );
    expect(screen.getByTestId("comments-flyout-cancel")).toBeEnabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeEnabled();
  });
  it("clears the draft on cancel and closes from the close button", () => {
    const onClose = jest.fn();
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={onClose}
        activeSection={{ activeSubSection: "Description" }}
      />
    );
    const input = screen.getByTestId("comments-flyout-input");
    userEvent.type(input, "<p>Looks good!</p>");
    userEvent.click(screen.getByTestId("comments-flyout-cancel"));
    expect(input).toHaveValue("");
    userEvent.click(screen.getByTestId("comments-flyout-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("shows the full label without truncation when it is within the max length", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Details" }}
      />
    );
    const label = screen.getByTestId("comments-flyout-label");
    expect(label).toHaveTextContent("Add a comment to Details");
    expect(label.textContent).not.toContain("...");
    // short label is rendered as plain text, not wrapped in a tooltip trigger
    expect(label.querySelector("span")).not.toBeInTheDocument();
  });
  it("truncates a long label with an ellipsis and shows the full text in a tooltip", async () => {
    const longSectionName =
      "A Very Long Population Criteria Section Name Example";
    const fullLabel = `Add a comment to ${longSectionName}`;
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: longSectionName }}
      />
    );
    const label = screen.getByTestId("comments-flyout-label");
    const truncatedText = `${fullLabel.slice(0, 50)}...`;
    expect(label).toHaveTextContent(truncatedText);
    expect(label.textContent).not.toEqual(fullLabel);
    userEvent.hover(screen.getByText(truncatedText));
    await waitFor(() => {
      expect(
        screen.getByRole("tooltip", { name: fullLabel })
      ).toBeInTheDocument();
    });
  });

  it("renders the Review sub-section under General", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Details" }}
      />
    );
    expect(
      screen.getByTestId("comments-review-subsection")
    ).toBeInTheDocument();
    // nothing to show until the entity has been marked ready for review
    expect(
      screen.queryByTestId("ready-for-review-comment")
    ).not.toBeInTheDocument();
  });

  it("names the entity the panel was given in the review message", () => {
    const { rerender } = render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Details" }}
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-body")
    ).toHaveTextContent("Measure marked as Ready for Review");

    rerender(
      <CommentsFlyoutPanel
        entityType="library"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Details" }}
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-body")
    ).toHaveTextContent("Library marked as Ready for Review");
  });

  it("shows only the sub-section for the screen the user is on", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Population Criteria",
          activeSubSection: "Criteria 1",
        }}
      />
    );

    // the screen they are on is listed
    const populationCriteria = screen
      .getByText("Population Criteria")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(populationCriteria)).toEqual(["Criteria 1"]);

    // its siblings have no comments yet, so they stay hidden
    expect(screen.queryByText("Criteria 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Supplemental Data")).not.toBeInTheDocument();

    // and so does every other header
    const details = screen
      .getByText("Details")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(details)).toEqual([]);
  });

  it("keeps sub-sections that already hold comments, wherever the user is", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "CQL Editor",
          activeSubSection: "CQL Editor",
        }}
        comments={[
          commentOn("Details", "Model & Measurement Period"),
          commentOn("Population Criteria", "Criteria 2"),
        ]}
      />
    );

    const details = screen
      .getByText("Details")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(details)).toEqual(["Model & Measurement Period"]);

    const populationCriteria = screen
      .getByText("Population Criteria")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(populationCriteria)).toEqual(["Criteria 2"]);

    // the screen they are on is listed alongside the commented ones
    expect(screen.getByTestId("comments-current-subsection")).toHaveTextContent(
      "CQL Editor"
    );
    // a commented sub-section keeps its catalogue position
    expect(screen.queryByText("Name, Version & ID")).not.toBeInTheDocument();
  });

  it("lists the screen the user is on even when the header does not cover it", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Test Cases",
          activeSubSection: "IPP-Pass - Test Case 65",
        }}
      />
    );

    const testCases = screen
      .getByText("Test Cases")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(testCases)).toEqual(["IPP-Pass - Test Case 65"]);
  });

  it("shows a details screen sub-section under the Details header", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Details",
          activeSubSection: "Model & Measurement Period",
        }}
      />
    );

    const subSection = screen.getByTestId("comments-current-subsection");
    expect(subSection).toHaveTextContent("Model & Measurement Period");
    expect(
      screen.getByText("Details").closest(".comments-flyout-panel-accordion")
    ).toContainElement(subSection);
    // the review activity keeps its own header
    expect(
      screen.getByText("General").closest(".comments-flyout-panel-accordion")
    ).toContainElement(screen.getByTestId("comments-review-subsection"));
  });

  it("shows the current sub-section under its main header, expanded", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Population Criteria",
          activeSubSection: "Criteria 2",
        }}
      />
    );

    const subSection = screen.getByTestId("comments-current-subsection");
    expect(subSection).toHaveTextContent("Criteria 2");
    // it sits under the main header for the screen the user is on
    expect(
      screen
        .getByText("Population Criteria")
        .closest(".comments-flyout-panel-accordion")
    ).toContainElement(subSection);
    // and that header is the one expanded by default
    expect(
      screen.getByText("Population Criteria").closest(".MuiAccordion-root")
    ).toHaveClass("Mui-expanded");
    expect(
      screen.getByText("Test Cases").closest(".MuiAccordion-root")
    ).not.toHaveClass("Mui-expanded");
  });

  it("moves the blue highlight to whichever sub-section is clicked", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Population Criteria",
          activeSubSection: "Criteria 1",
        }}
        comments={[commentOn("Population Criteria", "Supplemental Data")]}
      />
    );

    // the screen the user is on starts selected
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(true);
    expect(isHighlighted(rowFor("Supplemental Data"))).toBe(false);

    userEvent.click(screen.getByText("Supplemental Data"));

    // selection follows the click, and only one row is ever selected
    expect(isHighlighted(rowFor("Supplemental Data"))).toBe(true);
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(false);
  });

  it("keeps a sub-section selected after it is collapsed again", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "Population Criteria",
          activeSubSection: "Criteria 1",
        }}
      />
    );

    // collapsing the selected row must not clear the highlight
    userEvent.click(screen.getByText("Criteria 1"));
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(true);
  });

  it("selects a sub-section in a header the user is not on", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "CQL Editor",
          activeSubSection: "CQL Editor",
        }}
        comments={[commentOn("Details", "Name, Version & ID")]}
      />
    );

    userEvent.click(screen.getByText("Name, Version & ID"));

    expect(isHighlighted(rowFor("Name, Version & ID"))).toBe(true);
    expect(isHighlighted(rowFor("CQL Editor"))).toBe(false);
  });

  it("collapses and expands the main header on click", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{
          activeMainSection: "CQL Editor",
          activeSubSection: "CQL Editor",
        }}
      />
    );

    const header = screen.getByText("CQL Editor", {
      selector: ".comments-flyout-panel-section-title",
    });
    const accordion = header.closest(".MuiAccordion-root");
    expect(accordion).toHaveClass("Mui-expanded");

    userEvent.click(header);
    expect(accordion).not.toHaveClass("Mui-expanded");

    userEvent.click(header);
    expect(accordion).toHaveClass("Mui-expanded");
  });

  it("renders no current sub-section for a route that cannot be commented on", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Current section" }}
      />
    );

    expect(
      screen.queryByTestId("comments-current-subsection")
    ).not.toBeInTheDocument();
  });

  it("passes the ready for review details through to the sub-section", () => {
    render(
      <CommentsFlyoutPanel
        entityType="measure"
        sections={sections}
        open
        onClose={jest.fn()}
        activeSection={{ activeSubSection: "Details" }}
        readyForReviewBy="jjones"
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-author")
    ).toHaveTextContent("jjones");
    expect(
      screen.getByTestId("ready-for-review-comment-date")
    ).toHaveTextContent("Aug 12, 2026");
  });

  describe("adding a comment", () => {
    const renderPanel = (props: any = {}) =>
      render(
        <CommentsFlyoutPanel
          entityType="measure"
          sections={sections}
          open
          onClose={jest.fn()}
          activeSection={{
            activeMainSection: "Population Criteria",
            activeSubSection: "Criteria 1",
          }}
          currentUserName="Jonathan Jones"
          currentUserId="jjones"
          {...props}
        />
      );

    it("tags the new comment with the section the user is on", () => {
      const onAddComment = jest.fn();
      renderPanel({ onAddComment });

      userEvent.type(
        screen.getByTestId("comments-flyout-input"),
        "<p>Needs a look</p>"
      );
      userEvent.click(screen.getByTestId("comments-flyout-add"));

      expect(onAddComment).toHaveBeenCalledWith(
        expect.objectContaining({
          mainSection: "Population Criteria",
          subSection: "Criteria 1",
          authorName: "Jonathan Jones",
          content: "<p>Needs a look</p>",
          edited: false,
        })
      );
    });

    it("clears the field and disables both buttons afterwards", () => {
      renderPanel({ onAddComment: jest.fn() });

      const input = screen.getByTestId("comments-flyout-input");
      userEvent.type(input, "<p>Needs a look</p>");
      expect(screen.getByTestId("comments-flyout-add")).toBeEnabled();

      userEvent.click(screen.getByTestId("comments-flyout-add"));

      expect(input).toHaveValue("");
      expect(screen.getByTestId("comments-flyout-add")).toBeDisabled();
      expect(screen.getByTestId("comments-flyout-cancel")).toBeDisabled();
    });

    it("lists stored comments oldest first", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "newer",
            createdAt: "2025-06-20T09:00:00.000Z",
            content: "<p>Second</p>",
          },
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "older",
            createdAt: "2025-06-18T09:00:00.000Z",
            content: "<p>First</p>",
          },
        ],
      });

      const rendered = Array.from(
        document.querySelectorAll(".comments-flyout-panel-comment-body")
      ).map((node) => node.textContent);
      expect(rendered).toEqual(["First", "Second"]);
    });

    it("only offers the action center on the signed-in user's comments", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "theirs",
            authorName: "David Park",
          },
        ],
      });

      expect(screen.getByTestId("comment-actions-mine")).toBeInTheDocument();
      expect(
        screen.queryByTestId("comment-actions-theirs")
      ).not.toBeInTheDocument();
    });

    it("stamps the new comment with the signed-in user's HARP id", () => {
      const onAddComment = jest.fn();
      renderPanel({ onAddComment });

      userEvent.type(
        screen.getByTestId("comments-flyout-input"),
        "<p>Needs a look</p>"
      );
      userEvent.click(screen.getByTestId("comments-flyout-add"));

      expect(onAddComment).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: "jjones",
          authorName: "Jonathan Jones",
        })
      );
    });

    it("decides the action center by authorId when the comment has one", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "same-name-other-user",
            authorId: "jjones2",
            authorName: "Jonathan Jones",
          },
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "renamed-me",
            authorId: "JJones",
            authorName: "Jon Jones",
          },
        ],
      });

      expect(
        screen.queryByTestId("comment-actions-same-name-other-user")
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("comment-actions-renamed-me")
      ).toBeInTheDocument();
    });

    it("recognises the author by HARP id when no name was resolved", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "harp",
            authorName: "jjones",
          },
        ],
      });

      expect(screen.getByTestId("comment-actions-harp")).toBeInTheDocument();
    });

    it("marks an edited comment without moving its timestamp", () => {
      const onUpdateComment = jest.fn();
      const stored = {
        ...commentOn("Population Criteria", "Criteria 1"),
        id: "mine",
        authorName: "Jonathan Jones",
      };
      renderPanel({ comments: [stored], onUpdateComment });

      userEvent.click(screen.getByTestId("comment-edit-mine"));
      userEvent.clear(screen.getByTestId("comment-editor-mine"));
      userEvent.type(screen.getByTestId("comment-editor-mine"), "<p>New</p>");
      userEvent.click(screen.getByTestId("comment-edit-save-mine"));

      expect(onUpdateComment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mine",
          content: "<p>New</p>",
          edited: true,
          createdAt: stored.createdAt,
        })
      );
    });

    it("reports a confirmed delete", async () => {
      const onDeleteComment = jest.fn();
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-delete-mine"));
      userEvent.click(screen.getByTestId("delete-comment-confirm"));

      expect(onDeleteComment).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mine" })
      );
      await waitFor(() =>
        expect(
          screen.queryByTestId("delete-comment-dialog")
        ).not.toBeInTheDocument()
      );
    });

    it("keeps the confirmation open until the delete has finished, then confirms it", async () => {
      let finishDelete: (saved: boolean) => void;
      const onDeleteComment = jest.fn(
        () =>
          new Promise<boolean>((resolve) => {
            finishDelete = resolve;
          })
      );
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-delete-mine"));
      userEvent.click(screen.getByTestId("delete-comment-confirm"));

      // still in flight: dialog up, buttons locked, no toast yet
      expect(screen.getByText("Delete this comment?")).toBeInTheDocument();
      expect(screen.getByTestId("delete-comment-confirm")).toBeDisabled();
      expect(screen.getByTestId("delete-comment-cancel")).toBeDisabled();
      expect(
        screen.queryByText("Comment has been deleted.")
      ).not.toBeInTheDocument();

      await act(async () => {
        finishDelete(true);
      });

      await waitFor(() =>
        expect(
          screen.queryByTestId("delete-comment-dialog")
        ).not.toBeInTheDocument()
      );
      expect(screen.getByText("Comment has been deleted.")).toBeInTheDocument();
    });

    it("leaves the confirmation open when the delete did not save", async () => {
      const onDeleteComment = jest.fn().mockResolvedValue(false);
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-delete-mine"));
      await act(async () => {
        userEvent.click(screen.getByTestId("delete-comment-confirm"));
      });

      expect(onDeleteComment).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Delete this comment?")).toBeInTheDocument();
      expect(screen.getByTestId("delete-comment-confirm")).toBeEnabled();
      expect(
        screen.queryByText("Comment has been deleted.")
      ).not.toBeInTheDocument();
    });

    it("keeps the comment when the delete is cancelled", async () => {
      const onDeleteComment = jest.fn();
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-delete-mine"));
      expect(screen.getByText("Delete this comment?")).toBeInTheDocument();

      userEvent.click(screen.getByTestId("delete-comment-cancel"));

      expect(onDeleteComment).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.queryByTestId("delete-comment-dialog")
        ).not.toBeInTheDocument()
      );
    });

    it("shows the delete confirmation inside the flyout, not over the page", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "mine",
            authorName: "Jonathan Jones",
          },
        ],
      });

      userEvent.click(screen.getByTestId("comment-delete-mine"));

      const panel = screen.getByRole("dialog", {
        name: "Comments",
        hidden: true,
      });
      expect(panel.contains(screen.getByTestId("delete-comment-dialog"))).toBe(
        true
      );
    });
  });
});
