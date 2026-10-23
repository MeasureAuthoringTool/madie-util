import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentSubSection from "./CommentSubSection";

const accordionFor = (title: string) =>
  screen.getByText(title).closest(".MuiAccordion-root");

const isExpanded = (title: string) =>
  accordionFor(title).classList.contains("Mui-expanded");

describe("CommentSubSection", () => {
  it("renders its title and the comments it is given", () => {
    render(
      <CommentSubSection title="Name, Version & ID">
        <p>A comment</p>
      </CommentSubSection>
    );

    expect(screen.getByText("Name, Version & ID")).toBeInTheDocument();
    expect(screen.getByText("A comment")).toBeInTheDocument();
  });

  it("starts expanded so the current screen's comments are visible", () => {
    render(<CommentSubSection title="CQL Editor" />);

    expect(isExpanded("CQL Editor")).toBe(true);
  });

  it("can start collapsed", () => {
    render(<CommentSubSection title="CQL Editor" defaultExpanded={false} />);

    expect(isExpanded("CQL Editor")).toBe(false);
  });

  describe("when no expanded prop is given", () => {
    it("manages its own expand and collapse", () => {
      render(<CommentSubSection title="Criteria 1" />);

      userEvent.click(screen.getByText("Criteria 1"));
      expect(isExpanded("Criteria 1")).toBe(false);

      userEvent.click(screen.getByText("Criteria 1"));
      expect(isExpanded("Criteria 1")).toBe(true);
    });

    it("toggles without an onToggle handler", () => {
      render(<CommentSubSection title="Criteria 1" defaultExpanded={false} />);

      // no handler wired, so the click must not throw
      userEvent.click(screen.getByText("Criteria 1"));
      expect(isExpanded("Criteria 1")).toBe(true);
    });
  });

  describe("when an expanded prop is given", () => {
    it("leaves the state to the caller", () => {
      const onToggle = jest.fn();
      render(
        <CommentSubSection
          title="Criteria 1"
          expanded={false}
          onToggle={onToggle}
        />
      );

      userEvent.click(screen.getByText("Criteria 1"));

      // it reports the click but does not expand itself
      expect(onToggle).toHaveBeenCalledWith(true);
      expect(isExpanded("Criteria 1")).toBe(false);
    });

    it("reports a collapse the same way", () => {
      const onToggle = jest.fn();
      render(
        <CommentSubSection title="Criteria 1" expanded onToggle={onToggle} />
      );

      userEvent.click(screen.getByText("Criteria 1"));

      expect(onToggle).toHaveBeenCalledWith(false);
      expect(isExpanded("Criteria 1")).toBe(true);
    });

    it("follows the caller's state on rerender", () => {
      const { rerender } = render(
        <CommentSubSection title="Criteria 1" expanded={false} />
      );
      expect(isExpanded("Criteria 1")).toBe(false);

      rerender(<CommentSubSection title="Criteria 1" expanded />);
      expect(isExpanded("Criteria 1")).toBe(true);
    });

    it("ignores defaultExpanded, which only applies when uncontrolled", () => {
      render(
        <CommentSubSection
          title="Criteria 1"
          expanded={false}
          defaultExpanded
        />
      );

      expect(isExpanded("Criteria 1")).toBe(false);
    });
  });

  describe("highlighting", () => {
    it("carries the blue bar modifier when highlighted", () => {
      render(<CommentSubSection title="Criteria 1" highlighted />);

      expect(accordionFor("Criteria 1")).toHaveClass(
        "comments-flyout-panel-subsection",
        "comments-flyout-panel-subsection--current"
      );
    });

    it("carries only the base class otherwise", () => {
      render(<CommentSubSection title="Criteria 1" />);

      const accordion = accordionFor("Criteria 1");
      expect(accordion).toHaveClass("comments-flyout-panel-subsection");
      expect(accordion).not.toHaveClass(
        "comments-flyout-panel-subsection--current"
      );
    });
  });

  it("passes a test id through to the accordion", () => {
    render(
      <CommentSubSection title="Criteria 1" data-testid="current-subsection" />
    );

    expect(screen.getByTestId("current-subsection")).toBe(
      accordionFor("Criteria 1")
    );
  });
});
