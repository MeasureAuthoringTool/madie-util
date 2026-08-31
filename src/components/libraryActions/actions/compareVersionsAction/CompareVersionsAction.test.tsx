import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CompareVersionsAction, {
  NOTHING_SELECTED,
  VALID_COMPARE,
} from "./CompareVersionsAction";
import { CqlLibrary, Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const libraryDraft: CqlLibrary = {
  id: "test-id-1",
  cqlLibraryName: "TestLibrary",
  librarySetId: "library-set-1",
  model: Model.QICORE,
  cqlErrors: false,
  cql: "library TestLibrary version '1.0.000'",
  version: "1.0.000",
  draft: true,
  active: true,
  createdAt: "2023-01-01T00:00:00.000Z",
  createdBy: "testUser",
  lastModifiedAt: "2023-01-01T00:00:00.000Z",
  lastModifiedBy: "testUser",
  publisher: "Test Publisher",
  description: "Test Description",
  experimental: false,
  librarySet: {
    id: "set-1",
    librarySetId: "library-set-1",
    owner: "testUser",
    acls: [],
  },
};

const libraryVersion: CqlLibrary = {
  ...libraryDraft,
  id: "test-id-2",
  version: "0.0.000",
  draft: false,
};

const differentLibrary: CqlLibrary = {
  ...libraryDraft,
  id: "test-id-3",
  cqlLibraryName: "DifferentLibrary",
  librarySetId: "library-set-2",
  librarySet: {
    id: "set-2",
    librarySetId: "library-set-2",
    owner: "testUser",
    acls: [],
  },
};

describe("CompareVersionsAction component", () => {
  it("should render the compare versions button", () => {
    render(<CompareVersionsAction libraries={[]} onClick={() => {}} />);
    expect(
      screen.getByTestId("compare-versions-action-btn")
    ).toBeInTheDocument();
  });

  it("should disable button when no libraries are selected", () => {
    render(<CompareVersionsAction libraries={[]} onClick={() => {}} />);
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should disable button when only one library is selected", () => {
    render(
      <CompareVersionsAction libraries={[libraryDraft]} onClick={() => {}} />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should disable button when more than two libraries are selected", () => {
    render(
      <CompareVersionsAction
        libraries={[libraryDraft, libraryVersion, differentLibrary]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should enable button when two versions of the same library are selected (draft and version)", () => {
    render(
      <CompareVersionsAction
        libraries={[libraryDraft, libraryVersion]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", VALID_COMPARE);
  });

  it("should enable button when two versions of the same library are selected (version and version)", () => {
    const version1: CqlLibrary = {
      ...libraryVersion,
      id: "test-id-4",
      version: "1.0.000",
    };
    const version2: CqlLibrary = {
      ...libraryVersion,
      id: "test-id-5",
      version: "2.0.000",
    };
    render(
      <CompareVersionsAction
        libraries={[version1, version2]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", VALID_COMPARE);
  });

  it("should disable button when two different libraries are selected", () => {
    render(
      <CompareVersionsAction
        libraries={[libraryDraft, differentLibrary]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should call onClick when button is clicked and enabled", async () => {
    const handleClick = jest.fn();
    render(
      <CompareVersionsAction
        libraries={[libraryDraft, libraryVersion]}
        onClick={handleClick}
      />
    );

    const button = screen.getByTestId("compare-versions-action-btn");
    expect(button).toBeEnabled();

    userEvent.click(button);

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  it("should not call onClick when button is disabled", async () => {
    const handleClick = jest.fn();
    render(<CompareVersionsAction libraries={[]} onClick={handleClick} />);

    const button = screen.getByTestId("compare-versions-action-btn");
    expect(button).toBeDisabled();

    // Disabled buttons cannot be clicked, so we just verify the state
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should update button state when libraries selection changes", () => {
    const { rerender } = render(
      <CompareVersionsAction libraries={[]} onClick={() => {}} />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();

    rerender(
      <CompareVersionsAction
        libraries={[libraryDraft, libraryVersion]}
        onClick={() => {}}
      />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();

    rerender(
      <CompareVersionsAction
        libraries={[libraryDraft, differentLibrary]}
        onClick={() => {}}
      />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
  });

  it("should render the compare icon correctly", () => {
    render(<CompareVersionsAction libraries={[]} onClick={() => {}} />);
    const button = screen.getByTestId("compare-versions-action-btn");
    const svg = button.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });
});
