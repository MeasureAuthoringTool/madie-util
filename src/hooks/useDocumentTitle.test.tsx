import React from "react";
import { render, cleanup } from "@testing-library/react";
import { useDocumentTitle } from "./useDocumentTitle";

type TestComponentProps = {
  title: string;
  prevailOnUnmount?: boolean;
};

function TestComponent({ title, prevailOnUnmount }: TestComponentProps) {
  useDocumentTitle(title, prevailOnUnmount);
  return <div>Test</div>;
}

describe("useDocumentTitle", () => {
  const originalTitle = "Original Title";

  beforeEach(() => {
    document.title = originalTitle;
  });

  afterEach(() => {
    cleanup();
    document.title = originalTitle;
  });

  it("sets document title on mount", () => {
    render(<TestComponent title="New Title" prevailOnUnmount={false} />);
    expect(document.title).toBe("New Title");
  });

  it("restores document title on unmount when prevailOnUnmount is false", () => {
    const { unmount } = render(
      <TestComponent title="Temp Title" prevailOnUnmount={false} />
    );
    expect(document.title).toBe("Temp Title");
    unmount();
    expect(document.title).toBe(originalTitle);
  });

  it("keeps document title on unmount when prevailOnUnmount is true", () => {
    const { unmount } = render(
      <TestComponent title="Persist Title" prevailOnUnmount={true} />
    );
    expect(document.title).toBe("Persist Title");
    unmount();
    expect(document.title).toBe("Persist Title");
  });

  it("restores document title on unmount when prevailOnUnmount is default (false)", () => {
    const { unmount } = render(
      <TestComponent title="Default Title" prevailOnUnmount={undefined} />
    );
    expect(document.title).toBe("Default Title");
    unmount();
    expect(document.title).toBe(originalTitle);
  });
});
