import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MadieAlert,
  MinimizedAlertsProvider,
  MinimizedAlertsControl,
} from "./MinimizedAlerts";

const firstContent = (
  <ul>
    <li>First error</li>
    <li>Second error</li>
  </ul>
);
const secondContent = (
  <ul>
    <li>Terminology warning</li>
  </ul>
);

interface FixtureProps {
  showFirst?: boolean;
  showSecond?: boolean;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

const Fixture: React.FC<FixtureProps> = ({
  showFirst = true,
  showSecond = true,
  onSubmit = jest.fn(),
}) => (
  <MinimizedAlertsProvider>
    <form onSubmit={onSubmit}>
      <header data-testid="alert-header">
        <MinimizedAlertsControl />
      </header>
      <main>
        {showFirst && <MadieAlert content={firstContent} canClose={false} />}
        {showSecond && <MadieAlert content={secondContent} canClose={false} />}
      </main>
    </form>
  </MinimizedAlertsProvider>
);

describe("MinimizedAlerts", () => {
  it("aggregates independent banners in the header and restores all alerts", () => {
    render(<Fixture />);
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
    userEvent.click(screen.getAllByTestId("minimize-button-0")[0]);
    expect(screen.queryByText("First error")).not.toBeInTheDocument();
    expect(screen.getByText("Terminology warning")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Display Alerts (2)" })
    ).toBeInTheDocument();
    userEvent.click(screen.getByTestId("minimize-button-0"));
    const control = within(screen.getByTestId("alert-header")).getByRole(
      "button",
      {
        name: "Display Alerts (3)",
      }
    );
    expect(screen.getAllByTestId("minimized-alert")).toHaveLength(1);
    userEvent.click(control);
    expect(screen.getByText("First error")).toBeInTheDocument();
    expect(screen.getByText("Terminology warning")).toBeInTheDocument();
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
  });

  it("removes an unmounted banner's count without restoring other banners", () => {
    const { rerender } = render(<Fixture />);
    userEvent.click(screen.getAllByTestId("minimize-button-0")[0]);
    userEvent.click(screen.getByTestId("minimize-button-0"));
    rerender(<Fixture showFirst={false} />);
    expect(
      screen.getByRole("button", { name: "Display Alerts (1)" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Terminology warning")).not.toBeInTheDocument();
    userEvent.click(screen.getByTestId("minimized-alert"));
    expect(screen.getByText("Terminology warning")).toBeInTheDocument();
  });

  it("keeps standalone alert behavior outside a provider", () => {
    render(<MadieAlert content={secondContent} canClose={false} />);
    userEvent.click(screen.getByTestId("minimize-button-0"));
    expect(screen.queryByText("Terminology warning")).not.toBeInTheDocument();
    userEvent.click(screen.getByTestId("minimized-alert"));
    expect(screen.getByText("Terminology warning")).toBeInTheDocument();
  });

  it("restores alerts using the keyboard without submitting the form", () => {
    const onSubmit = jest.fn();
    render(<Fixture showSecond={false} onSubmit={onSubmit} />);
    userEvent.click(screen.getByTestId("minimize-button-0"));
    screen.getByRole("button", { name: "Display Alerts (2)" }).focus();
    userEvent.keyboard("{enter}");
    expect(screen.getByText("First error")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("removes the control when the last minimized banner unmounts", () => {
    const { rerender } = render(<Fixture showSecond={false} />);
    userEvent.click(screen.getByTestId("minimize-button-0"));
    rerender(<Fixture showFirst={false} showSecond={false} />);
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
  });
});
