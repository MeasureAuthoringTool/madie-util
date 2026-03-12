import React, { useRef } from "react";
import { render, fireEvent } from "@testing-library/react";
import useOnClickOutside from "./useOnClickOutside";

describe("useOnClickOutside", () => {
  type TestComponentProps = {
    handler: () => void;
  };

  function TestComponent({ handler }: TestComponentProps) {
    const ref = useRef(null);
    useOnClickOutside(ref, handler);
    return (
      <div>
        <div data-testid="inside" ref={ref}>
          Inside
        </div>
        <div data-testid="outside">Outside</div>
      </div>
    );
  }

  it("calls handler when clicking outside", () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.mouseDown(getByTestId("outside"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call handler when clicking inside", () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.mouseDown(getByTestId("inside"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler on touchstart outside", () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.touchStart(getByTestId("outside"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call handler on touchstart inside", () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.touchStart(getByTestId("inside"));
    expect(handler).not.toHaveBeenCalled();
  });
});
