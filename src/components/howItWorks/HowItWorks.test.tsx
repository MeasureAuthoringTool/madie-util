import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HowItWorks from "./HowItWorks";

const body = (
  <>
    <p>This workflow allows you to insert all profiles.</p>
    <p>To complete this process:</p>
    <ol>
      <li>Select the measure.</li>
    </ol>
  </>
);

describe("HowItWorks", () => {
  it("renders the 'How it works' link by default", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    const link = screen.getByTestId("how-it-works-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("How it works");
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
  });

  it("opens the info section when the link is clicked", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    userEvent.click(screen.getByTestId("how-it-works-link"));

    expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    expect(screen.getByText("How it Works")).toBeInTheDocument();
    expect(screen.getByText(/To complete this process:/)).toBeInTheDocument();
  });

  it("renders whatever children it is given as the body", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    userEvent.click(screen.getByTestId("how-it-works-link"));

    expect(
      screen.getByText("This workflow allows you to insert all profiles.")
    ).toBeInTheDocument();
    expect(screen.getByText("Select the measure.")).toBeInTheDocument();
  });

  it("closes the info section when the X button is clicked", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    userEvent.click(screen.getByTestId("how-it-works-link"));
    expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("how-it-works-close"));
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
  });

  it("sets aria-expanded correctly on the link", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    expect(screen.getByTestId("how-it-works-link")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  // --- title ---

  it("defaults the heading to 'How it Works'", () => {
    render(<HowItWorks isOpen={true}>{body}</HowItWorks>);
    expect(screen.getByText("How it Works")).toBeInTheDocument();
  });

  it("uses a custom title when given one", () => {
    render(
      <HowItWorks isOpen={true} title="How the editor works">
        {body}
      </HowItWorks>
    );
    expect(screen.getByText("How the editor works")).toBeInTheDocument();
  });

  // --- contentId ---

  it("defaults aria-controls and the panel id to how-it-works-content", () => {
    const { rerender } = render(<HowItWorks>{body}</HowItWorks>);
    expect(screen.getByTestId("how-it-works-link")).toHaveAttribute(
      "aria-controls",
      "how-it-works-content"
    );

    rerender(<HowItWorks isOpen={true}>{body}</HowItWorks>);
    expect(screen.getByTestId("how-it-works-content")).toHaveAttribute(
      "id",
      "how-it-works-content"
    );
  });

  it("threads a custom contentId through aria-controls and the panel id", () => {
    const { rerender } = render(
      <HowItWorks contentId="cql-editor-how-it-works">{body}</HowItWorks>
    );
    expect(screen.getByTestId("how-it-works-link")).toHaveAttribute(
      "aria-controls",
      "cql-editor-how-it-works"
    );

    rerender(
      <HowItWorks isOpen={true} contentId="cql-editor-how-it-works">
        {body}
      </HowItWorks>
    );
    expect(screen.getByTestId("how-it-works-content")).toHaveAttribute(
      "id",
      "cql-editor-how-it-works"
    );
  });

  // --- align ---

  it("is right aligned by default", () => {
    render(<HowItWorks>{body}</HowItWorks>);
    expect(screen.getByTestId("how-it-works")).not.toHaveClass(
      "how-it-works-flush-left"
    );
  });

  it("applies the flush-left modifier when align is left", () => {
    render(<HowItWorks align="left">{body}</HowItWorks>);
    expect(screen.getByTestId("how-it-works")).toHaveClass(
      "how-it-works-flush-left"
    );
  });

  // --- controlled mode ---

  describe("controlled mode", () => {
    it("respects an external isOpen=true prop without internal state", () => {
      render(<HowItWorks isOpen={true}>{body}</HowItWorks>);
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
      expect(screen.queryByTestId("how-it-works-link")).not.toBeInTheDocument();
    });

    it("respects an external isOpen=false prop", () => {
      render(<HowItWorks isOpen={false}>{body}</HowItWorks>);
      expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
    });

    it("invokes onOpenChange(true) when link is clicked in controlled mode", () => {
      const onOpenChange = jest.fn();
      render(
        <HowItWorks isOpen={false} onOpenChange={onOpenChange}>
          {body}
        </HowItWorks>
      );
      userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("invokes onOpenChange(false) when close button is clicked in controlled mode", () => {
      const onOpenChange = jest.fn();
      render(
        <HowItWorks isOpen={true} onOpenChange={onOpenChange}>
          {body}
        </HowItWorks>
      );
      userEvent.click(screen.getByTestId("how-it-works-close"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not toggle internally when controlled (parent must update isOpen)", () => {
      const onOpenChange = jest.fn();
      render(
        <HowItWorks isOpen={false} onOpenChange={onOpenChange}>
          {body}
        </HowItWorks>
      );
      userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
    });

    it("calls onOpenChange in uncontrolled mode as well (when provided)", () => {
      const onOpenChange = jest.fn();
      render(<HowItWorks onOpenChange={onOpenChange}>{body}</HowItWorks>);
      userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    });
  });
});
