import React from "react";
import { render, cleanup } from "@testing-library/react";
import useKeyPress from "./useKeyPress";

describe("useKeyPress", () => {
  afterEach(() => {
    cleanup();
  });

  function TestComponent({ targetKey }) {
    const isPressed = useKeyPress(targetKey);
    return (
      <div data-testid="status">{isPressed ? "pressed" : "not pressed"}</div>
    );
  }

  it("returns true when target key is pressed", () => {
    const { getByTestId } = render(<TestComponent targetKey="a" />);
    expect(getByTestId("status").textContent).toBe("not pressed");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(getByTestId("status").textContent).toBe("pressed");
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
    expect(getByTestId("status").textContent).toBe("not pressed");
  });

  it("does not change state for other keys", () => {
    const { getByTestId } = render(<TestComponent targetKey="b" />);
    expect(getByTestId("status").textContent).toBe("not pressed");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(getByTestId("status").textContent).toBe("not pressed");
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
    expect(getByTestId("status").textContent).toBe("not pressed");
  });

  it("cleans up event listeners on unmount", () => {
    const addListenerSpy = jest.spyOn(window, "addEventListener");
    const removeListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<TestComponent targetKey="c" />);
    expect(addListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
    expect(addListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    unmount();
    expect(removeListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
    expect(removeListenerSpy).toHaveBeenCalledWith(
      "keyup",
      expect.any(Function)
    );
    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
  });
});
