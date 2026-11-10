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
  MadieDialog: ({
    dialogProps,
    cancelButtonProps,
    continueButtonProps,
    children,
  }: any) =>
    dialogProps.open ? (
      <div
        role="dialog"
        data-testid={dialogProps["data-testid"]}
        className={dialogProps.className}
      >
        {children}
        <button
          data-testid={cancelButtonProps["data-testid"]}
          disabled={cancelButtonProps.disabled}
          onClick={cancelButtonProps.onClick}
        >
          {cancelButtonProps.cancelText}
        </button>
        <button
          data-testid={continueButtonProps["data-testid"]}
          disabled={continueButtonProps.disabled}
          onClick={continueButtonProps.onClick}
        >
          {continueButtonProps.continueText}
        </button>
      </div>
    ) : null,
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

const commentOn = (mainSection: string, subSection: string) => ({
  id: `${mainSection}-${subSection}`,
  mainSection,
  subSection,
  authorName: "User2",
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

  it("asks for the latest comments each time the panel opens", () => {
    const onOpen = jest.fn();
    const props = {
      entityType: "measure" as const,
      sections,
      onClose: jest.fn(),
      onOpen,
      activeSection: {
        activeMainSection: "Details",
        activeSubSection: "Name, Version & ID",
      },
    };
    const { rerender } = render(
      <CommentsFlyoutPanel {...props} open={false} />
    );
    expect(onOpen).not.toHaveBeenCalled();

    rerender(<CommentsFlyoutPanel {...props} open />);
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(<CommentsFlyoutPanel {...props} open={false} />);
    rerender(<CommentsFlyoutPanel {...props} open />);
    expect(onOpen).toHaveBeenCalledTimes(2);
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
        markedForReviewAt="2026-08-12T09:00:00"
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
        markedForReviewAt="2026-08-12T09:00:00"
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

  it("shows the current sub-section under its main header, expanded", async () => {
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
    await expect(
      screen.getByText("Population Criteria").closest(".MuiAccordion-root")
    ).toHaveClass("Mui-expanded");
    await expect(
      screen.getByText("Test Cases").closest(".MuiAccordion-root")
    ).not.toHaveClass("Mui-expanded");
  });

  describe.each(["measure", "library"] as const)(
    "%s expansion",
    (entityType) => {
      const renderPanel = () =>
        render(
          <CommentsFlyoutPanel
            entityType={entityType}
            sections={sections}
            open
            onClose={jest.fn()}
            activeSection={{
              activeMainSection: "Population Criteria",
              activeSubSection: "Criteria 1",
            }}
            comments={[
              commentOn("Population Criteria", "Criteria 2"),
              commentOn("Details", "Name, Version & ID"),
            ]}
          />
        );

      it("replaces the expanded sub-section within the same main section", async () => {
        renderPanel();

        await expect(rowFor("Review")).not.toHaveClass("Mui-expanded");
        userEvent.click(screen.getByText("Criteria 2"));

        await expect(rowFor("Criteria 1")).not.toHaveClass("Mui-expanded");
        await expect(rowFor("Criteria 2")).toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("Population Criteria").closest(".MuiAccordion-root")
        ).toHaveClass("Mui-expanded");
      });

      it("preserves the expanded sub-section when main headers are toggled", async () => {
        renderPanel();

        userEvent.click(screen.getByText("Details"));
        await expect(rowFor("Criteria 1")).toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("Population Criteria").closest(".MuiAccordion-root")
        ).toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("Details").closest(".MuiAccordion-root")
        ).toHaveClass("Mui-expanded");

        userEvent.click(screen.getByText("Population Criteria"));
        await expect(rowFor("Criteria 1")).toHaveClass("Mui-expanded");
        userEvent.click(screen.getByText("Population Criteria"));
        await expect(rowFor("Criteria 1")).toHaveClass("Mui-expanded");
      });

      it("includes General Review in single sub-section expansion", async () => {
        renderPanel();

        userEvent.click(screen.getByText("General"));
        await expect(rowFor("Criteria 1")).toHaveClass("Mui-expanded");
        userEvent.click(screen.getByText("Review"));

        await expect(rowFor("Criteria 1")).not.toHaveClass("Mui-expanded");
        await expect(rowFor("Review")).toHaveClass("Mui-expanded");
        expect(isHighlighted(rowFor("Review"))).toBe(true);
        expect(isHighlighted(rowFor("Criteria 1"))).toBe(false);
        await expect(
          screen.getByText("Population Criteria").closest(".MuiAccordion-root")
        ).not.toHaveClass("Mui-expanded");

        userEvent.click(screen.getByText("Population Criteria"));
        userEvent.click(screen.getByText("Criteria 2"));

        await expect(rowFor("Review")).not.toHaveClass("Mui-expanded");
        await expect(rowFor("Criteria 2")).toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("General").closest(".MuiAccordion-root")
        ).not.toHaveClass("Mui-expanded");
      });

      it("closes the previous main section when opening a sub-section elsewhere", async () => {
        renderPanel();

        userEvent.click(screen.getByText("Details"));
        userEvent.click(screen.getByText("Name, Version & ID"));

        await expect(rowFor("Criteria 1")).not.toHaveClass("Mui-expanded");
        await expect(rowFor("Name, Version & ID")).toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("Population Criteria").closest(".MuiAccordion-root")
        ).not.toHaveClass("Mui-expanded");
        await expect(
          screen.getByText("Details").closest(".MuiAccordion-root")
        ).toHaveClass("Mui-expanded");
      });
    }
  );

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

  it("collapses and expands the main header on click", async () => {
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
    await expect(accordion).toHaveClass("Mui-expanded");

    userEvent.click(header);
    await expect(accordion).not.toHaveClass("Mui-expanded");

    userEvent.click(header);
    await expect(accordion).toHaveClass("Mui-expanded");
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
        markedForReviewBy="user1"
        markedForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(
      screen.getByTestId("ready-for-review-comment-author")
    ).toHaveTextContent("user1");
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
          currentUserName="User1"
          currentUserId="user1"
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
          authorName: "User1",
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
            authorName: "User1",
          },
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "theirs",
            authorName: "User3",
          },
        ],
      });

      expect(screen.getByTestId("comment-actions-mine")).toBeInTheDocument();
      expect(
        screen.queryByTestId("comment-actions-theirs")
      ).not.toBeInTheDocument();
    });

    it("keys a test case's comments by id so a renamed test case keeps them", () => {
      const testCaseSections = [
        ...sections.filter((section) => section.name !== "Test Cases"),
        {
          name: "Test Cases",
          subSections: [
            "Population Criteria 1",
            { id: "tc-1", name: "Series B - New title" },
          ],
        },
      ];
      renderPanel({
        sections: testCaseSections,
        activeSection: {
          activeMainSection: "Test Cases",
          activeSubSection: "Series B - New title",
          activeSubSectionId: "tc-1",
        },
        comments: [
          {
            ...commentOn("Test Cases", undefined),
            id: "renamed",
            subSectionId: "tc-1",
            content: "<p>Still attached</p>",
          },
        ],
      });

      expect(screen.getByText("Still attached")).toBeInTheDocument();
      expect(rowFor("Series B - New title")).toContainElement(
        screen.getByText("Still attached")
      );
    });

    it("stamps a new test case comment with the test case id and no name", () => {
      const onAddComment = jest.fn();
      renderPanel({
        onAddComment,
        activeSection: {
          activeMainSection: "Test Cases",
          activeSubSection: "Series A - Example case",
          activeSubSectionId: "tc-1",
        },
      });

      userEvent.type(
        screen.getByTestId("comments-flyout-input"),
        "<p>On the test case</p>"
      );
      userEvent.click(screen.getByTestId("comments-flyout-add"));

      expect(onAddComment).toHaveBeenCalledWith(
        expect.objectContaining({
          mainSection: "Test Cases",
          subSectionId: "tc-1",
        })
      );
      expect(onAddComment.mock.calls[0][0].subSection).toBeUndefined();
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
          harpId: "user1",
          authorName: "User1",
        })
      );
    });

    it("decides the action center by harpId when the comment has one", () => {
      renderPanel({
        comments: [
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "same-name-other-user",
            harpId: "user4",
            authorName: "User1",
          },
          {
            ...commentOn("Population Criteria", "Criteria 1"),
            id: "renamed-me",
            harpId: "USER1",
            authorName: "Renamed User1",
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
            authorName: "user1",
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
        authorName: "User1",
      };
      renderPanel({ comments: [stored], onUpdateComment });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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
            authorName: "User1",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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
            authorName: "User1",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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
            authorName: "User1",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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
            authorName: "User1",
          },
        ],
        onDeleteComment,
      });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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
            authorName: "User1",
          },
        ],
      });

      userEvent.click(screen.getByTestId("comment-more-actions-mine"));

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

  describe.each(["measure", "library"] as const)(
    "replies on a %s",
    (entityType) => {
      const parent = {
        ...commentOn("Population Criteria", "Criteria 1"),
        id: "parent",
        authorName: "User3",
      };
      const replyBy = (id: string, authorName: string, createdAt: string) => ({
        id,
        authorName,
        createdAt,
        edited: false,
        content: `<p>Reply ${id}</p>`,
      });

      const renderPanel = (props: any = {}) =>
        render(
          <CommentsFlyoutPanel
            entityType={entityType}
            sections={sections}
            open
            onClose={jest.fn()}
            activeSection={{
              activeMainSection: "Population Criteria",
              activeSubSection: "Criteria 1",
            }}
            currentUserName="User1"
            currentUserId="user1"
            comments={[parent]}
            onAddReply={jest.fn()}
            {...props}
          />
        );

      it("opens a Reply panel with Cancel enabled and Save enabled once text is entered", () => {
        renderPanel();

        expect(
          screen.queryByTestId("reply-composer-parent")
        ).not.toBeInTheDocument();
        userEvent.click(screen.getByTestId("comment-reply-parent"));

        expect(screen.getByTestId("reply-cancel-parent")).toBeEnabled();
        expect(screen.getByTestId("reply-save-parent")).toBeDisabled();

        userEvent.type(
          screen.getByTestId("reply-input-parent"),
          "<p>Agreed</p>"
        );
        expect(screen.getByTestId("reply-save-parent")).toBeEnabled();
      });

      it("closes the Reply panel on Cancel without saving", () => {
        const onAddReply = jest.fn();
        renderPanel({ onAddReply });

        userEvent.click(screen.getByTestId("comment-reply-parent"));
        userEvent.type(
          screen.getByTestId("reply-input-parent"),
          "<p>Agreed</p>"
        );
        userEvent.click(screen.getByTestId("reply-cancel-parent"));

        expect(onAddReply).not.toHaveBeenCalled();
        expect(
          screen.queryByTestId("reply-composer-parent")
        ).not.toBeInTheDocument();
      });

      it("saves the reply onto the comment, stamped with the signed-in user", async () => {
        const onAddReply = jest.fn().mockResolvedValue(true);
        renderPanel({ onAddReply });

        userEvent.click(screen.getByTestId("comment-reply-parent"));
        userEvent.type(
          screen.getByTestId("reply-input-parent"),
          "<p>Agreed</p>"
        );
        await act(async () => {
          userEvent.click(screen.getByTestId("reply-save-parent"));
        });

        expect(onAddReply).toHaveBeenCalledWith(
          expect.objectContaining({ id: "parent" }),
          expect.objectContaining({
            harpId: "user1",
            authorName: "User1", // #nosec
            content: "<p>Agreed</p>",
            edited: false,
          })
        );
        expect(
          screen.queryByTestId("reply-composer-parent")
        ).not.toBeInTheDocument();
      });

      it("keeps the Reply panel and draft when the reply did not save", async () => {
        const onAddReply = jest.fn().mockResolvedValue(false);
        renderPanel({ onAddReply });

        userEvent.click(screen.getByTestId("comment-reply-parent"));
        userEvent.type(
          screen.getByTestId("reply-input-parent"),
          "<p>Agreed</p>"
        );
        await act(async () => {
          userEvent.click(screen.getByTestId("reply-save-parent"));
        });

        expect(screen.getByTestId("reply-input-parent")).toHaveValue(
          "<p>Agreed</p>"
        );
      });

      it("hides the Reply icon when replies cannot be saved", () => {
        renderPanel({ onAddReply: undefined });

        expect(
          screen.queryByTestId("comment-reply-parent")
        ).not.toBeInTheDocument();
      });

      it("lists replies oldest first and opens the Reply panel below them", () => {
        renderPanel({
          comments: [
            {
              ...parent,
              replies: [
                replyBy("newer", "User1", "2025-06-21T09:00:00.000Z"),
                replyBy("older", "User2", "2025-06-20T09:00:00.000Z"),
              ],
            },
          ],
        });
        userEvent.click(screen.getByTestId("comment-reply-parent"));

        const replies = screen.getByTestId("comment-replies-parent");
        const items = Array.from(replies.children).map((child) =>
          child.getAttribute("data-testid")
        );
        expect(items).toEqual([
          "reply-older",
          "reply-newer",
          "reply-composer-parent",
        ]);
      });

      it("gives only the signed-in user's replies an action center, and no reply icon", () => {
        renderPanel({
          comments: [
            {
              ...parent,
              replies: [
                replyBy("mine", "User1", "2025-06-20T09:00:00.000Z"),
                replyBy("theirs", "User2", "2025-06-21T09:00:00.000Z"),
              ],
            },
          ],
        });

        expect(screen.getByTestId("reply-actions-mine")).toBeInTheDocument();
        expect(
          screen.queryByTestId("reply-actions-theirs")
        ).not.toBeInTheDocument();
        expect(screen.getAllByLabelText("Reply")).toHaveLength(1);
      });

      it("saves an edited reply and marks it edited", () => {
        const onUpdateReply = jest.fn();
        const mine = replyBy("mine", "User1", "2025-06-20T09:00:00.000Z");
        renderPanel({
          onUpdateReply,
          comments: [{ ...parent, replies: [mine] }],
        });

        userEvent.click(screen.getByTestId("reply-more-actions-mine"));
        userEvent.click(screen.getByTestId("reply-edit-mine"));
        userEvent.clear(screen.getByTestId("reply-editor-mine"));
        userEvent.type(
          screen.getByTestId("reply-editor-mine"),
          "<p>Revised</p>"
        );
        userEvent.click(screen.getByTestId("reply-edit-save-mine"));

        expect(onUpdateReply).toHaveBeenCalledWith(
          expect.objectContaining({ id: "parent" }),
          { ...mine, content: "<p>Revised</p>", edited: true }
        );
      });

      it("confirms before deleting a reply, then removes only that reply", async () => {
        const onDeleteReply = jest.fn().mockResolvedValue(true);
        const onDeleteComment = jest.fn();
        const theirs = replyBy("theirs", "User2", "2025-06-19T09:00:00.000Z");
        renderPanel({
          onDeleteReply,
          onDeleteComment,
          comments: [
            {
              ...parent,
              replies: [
                theirs,
                replyBy("mine", "User1", "2025-06-20T09:00:00.000Z"),
              ],
            },
          ],
        });

        userEvent.click(screen.getByTestId("reply-more-actions-mine"));
        userEvent.click(screen.getByTestId("reply-delete-mine"));
        expect(screen.getByText("Delete this reply?")).toBeInTheDocument();
        expect(
          screen.getByText("This action cannot be undone.")
        ).toBeInTheDocument();

        await act(async () => {
          userEvent.click(screen.getByTestId("delete-comment-confirm"));
        });

        expect(onDeleteComment).not.toHaveBeenCalled();
        expect(onDeleteReply).toHaveBeenCalledWith(
          expect.objectContaining({ id: "parent" }),
          expect.objectContaining({ id: "mine" })
        );
        expect(
          screen.queryByTestId("delete-comment-dialog")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Reply has been deleted.")).toBeInTheDocument();
      });

      it("keeps the reply when the delete is cancelled", () => {
        const onDeleteReply = jest.fn();
        renderPanel({
          onDeleteReply,
          comments: [
            {
              ...parent,
              replies: [replyBy("mine", "User1", "2025-06-20T09:00:00.000Z")],
            },
          ],
        });

        userEvent.click(screen.getByTestId("reply-more-actions-mine"));
        userEvent.click(screen.getByTestId("reply-delete-mine"));
        userEvent.click(screen.getByTestId("delete-comment-cancel"));

        expect(onDeleteReply).not.toHaveBeenCalled();
        expect(
          screen.queryByTestId("delete-comment-dialog")
        ).not.toBeInTheDocument();
      });
    }
  );
});
