import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserDetails } from "@madie/madie-models";
import ManageReviewDialog, {
  REVIEW_STATUS_OPTIONS,
  formatReviewerName,
  toPlainText,
} from "./ManageReviewDialog";

jest.mock("../../../../api/useMeasureReviewServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => mockMeasureReviewServiceApi),
}));

jest.mock("../../../../api/useCqlLibraryReviewServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => mockLibraryReviewServiceApi),
}));

jest.mock("../../../../api/useUserServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => mockUserServiceApi),
}));

const mockMeasureReviewServiceApi = {
  getMeasureReview: jest.fn(),
};

const mockLibraryReviewServiceApi = {
  getCqlLibraryReview: jest.fn(),
};

const mockUserServiceApi = {
  fetchUsers: jest.fn(),
};

const reviewers = [
  {
    harpId: "zuser",
    firstName: "Zoe",
    lastName: "Zimmer",
    roles: [{ role: "MADiE-Reviewer" }],
  },
  {
    harpId: "jtraeger",
    firstName: "Jonathan",
    lastName: "Traeger",
    roles: [{ role: "MADiE-Reviewer" }],
  },
  {
    harpId: "notareviewer",
    firstName: "Alan",
    lastName: "Adams",
    roles: [{ role: "MADiE-Admin" }],
  },
] as UserDetails[];

const renderDialog = (props: any = {}) =>
  render(
    <ManageReviewDialog
      open={true}
      entityType="measure"
      entityId="measure-1"
      onClose={jest.fn()}
      {...props}
    />
  );

describe("ManageReviewDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue(null);
    mockLibraryReviewServiceApi.getCqlLibraryReview.mockResolvedValue(null);
    mockUserServiceApi.fetchUsers.mockResolvedValue(reviewers);
  });

  it("renders the Manage Review screen with all fields", async () => {
    renderDialog();

    expect(screen.getByText("Manage Review")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Comment")).toBeInTheDocument();
    expect(
      screen.getByTestId("manage-review-dialog-cancel-button")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockUserServiceApi.fetchUsers).toHaveBeenCalled();
    });
  });

  it("displays only users with the reviewer role, sorted alphabetically", async () => {
    renderDialog();

    const reviewerInput = await screen.findByTestId(
      "manage-review-reviewers-input"
    );
    userEvent.click(reviewerInput);

    await waitFor(() => {
      expect(screen.getByText("Jonathan Traeger")).toBeInTheDocument();
    });
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Jonathan Traeger",
      "Zoe Zimmer",
    ]);
    expect(screen.queryByText("Alan Adams")).not.toBeInTheDocument();
  });

  it("offers the three review statuses", async () => {
    renderDialog();

    userEvent.click(screen.getByRole("combobox", { name: /Status/i }));

    await waitFor(() => {
      REVIEW_STATUS_OPTIONS.forEach((option) => {
        expect(
          screen.getByTestId(`manage-review-status-option-${option}`)
        ).toBeInTheDocument();
      });
    });
  });

  it("pre-populates the status of the existing review", async () => {
    mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
      id: "review-1",
      status: "IN_PROGRESS",
      comment: "<p>Please take a look</p>",
    });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId("manage-review-status")).toHaveTextContent(
        "In Progress"
      );
    });
    expect(screen.getByTestId("manage-review-comment")).toHaveValue(
      "Please take a look"
    );
    // Pre-populated values alone are not a change.
    expect(
      screen.getByTestId("manage-review-dialog-save-button")
    ).toBeDisabled();
  });

  it("displays a dash when the review has no comment", async () => {
    mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
      id: "review-1",
      status: "READY_FOR_REVIEW",
      comment: "<p></p>",
    });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId("manage-review-comment")).toHaveValue("-");
    });
  });

  it("disables Save until the status is changed", async () => {
    renderDialog();

    const saveButton = screen.getByTestId("manage-review-dialog-save-button");
    expect(saveButton).toBeDisabled();

    userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
    userEvent.click(
      await screen.findByTestId("manage-review-status-option-Complete")
    );

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it("enables Save once a reviewer is selected", async () => {
    renderDialog();

    const saveButton = screen.getByTestId("manage-review-dialog-save-button");
    expect(saveButton).toBeDisabled();

    const reviewerInput = await screen.findByTestId(
      "manage-review-reviewers-input"
    );
    userEvent.click(reviewerInput);
    userEvent.click(await screen.findByText("Jonathan Traeger"));

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it("closes without saving when Cancel is clicked", async () => {
    const onClose = jest.fn();
    renderDialog({ onClose });

    userEvent.click(screen.getByTestId("manage-review-dialog-cancel-button"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("closes without saving when the red x is clicked", async () => {
    const onClose = jest.fn();
    renderDialog({ onClose });

    userEvent.click(screen.getByTestId("close-button"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("reads the review from the library service for libraries", async () => {
    mockLibraryReviewServiceApi.getCqlLibraryReview.mockResolvedValue({
      id: "review-1",
      status: "COMPLETE",
      comment: "<p>Library comment</p>",
    });

    renderDialog({ entityType: "library", entityId: "library-1" });

    await waitFor(() => {
      expect(
        mockLibraryReviewServiceApi.getCqlLibraryReview
      ).toHaveBeenCalledWith("library-1");
    });
    expect(mockMeasureReviewServiceApi.getMeasureReview).not.toHaveBeenCalled();
    expect(screen.getByTestId("manage-review-comment")).toHaveValue(
      "Library comment"
    );
  });

  it("leaves the reviewer list empty when users cannot be retrieved", async () => {
    mockUserServiceApi.fetchUsers.mockRejectedValue(new Error("failure"));

    renderDialog();

    const reviewerInput = await screen.findByTestId(
      "manage-review-reviewers-input"
    );
    userEvent.click(reviewerInput);

    await waitFor(() => {
      expect(screen.queryAllByRole("option")).toHaveLength(0);
    });
  });

  it("does not fetch anything while closed", () => {
    renderDialog({ open: false });

    expect(mockUserServiceApi.fetchUsers).not.toHaveBeenCalled();
    expect(mockMeasureReviewServiceApi.getMeasureReview).not.toHaveBeenCalled();
  });

  describe("helpers", () => {
    it("strips markup from rich text comments", () => {
      expect(toPlainText("<p>Looks&nbsp;good</p>")).toEqual("Looks good");
      expect(toPlainText("<p></p>")).toEqual("");
      expect(toPlainText(undefined)).toEqual("");
    });

    it("falls back to the harp id when a name is missing", () => {
      expect(formatReviewerName({ harpId: "abc" } as UserDetails)).toEqual(
        "abc"
      );
      expect(
        formatReviewerName({ firstName: "Jo", harpId: "abc" } as UserDetails)
      ).toEqual("Jo");
    });
  });
});
