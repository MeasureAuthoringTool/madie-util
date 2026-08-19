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
  createMeasureReview: jest.fn(),
  updateMeasureReview: jest.fn(),
};

const mockLibraryReviewServiceApi = {
  getCqlLibraryReview: jest.fn(),
  createCqlLibraryReview: jest.fn(),
  updateCqlLibraryReview: jest.fn(),
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
    mockMeasureReviewServiceApi.createMeasureReview.mockResolvedValue({});
    mockMeasureReviewServiceApi.updateMeasureReview.mockResolvedValue({});
    mockLibraryReviewServiceApi.getCqlLibraryReview.mockResolvedValue(null);
    mockLibraryReviewServiceApi.createCqlLibraryReview.mockResolvedValue({});
    mockLibraryReviewServiceApi.updateCqlLibraryReview.mockResolvedValue({});
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

  it.each([
    ["measures", "measure", "measure-1"],
    ["libraries", "library", "library-1"],
  ])(
    "offers the three review statuses for %s",
    async (_label, entityType, entityId) => {
      renderDialog({ entityType, entityId });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));

      await waitFor(() => {
        expect(
          screen.getByTestId("manage-review-status-option-Ready")
        ).toBeInTheDocument();
      });
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(
        REVIEW_STATUS_OPTIONS
      );
    }
  );

  it("pre-populates a library's Ready status", async () => {
    mockLibraryReviewServiceApi.getCqlLibraryReview.mockResolvedValue({
      id: "review-1",
      status: "READY_FOR_REVIEW",
      comment: "<p></p>",
    });

    renderDialog({ entityType: "library", entityId: "library-1" });

    await waitFor(() => {
      expect(screen.getByTestId("manage-review-status")).toHaveTextContent(
        "Ready"
      );
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

  describe("saving", () => {
    it("creates the review, closes the dialog and notifies on save", async () => {
      const onClose = jest.fn();
      const onSuccess = jest.fn();
      const savedReview = { id: "review-1", status: "READY_FOR_REVIEW" };
      mockMeasureReviewServiceApi.createMeasureReview.mockResolvedValue(
        savedReview
      );
      const reviewSaved = jest.fn();
      window.addEventListener("review-measure-saved", reviewSaved);

      renderDialog({ onClose, onSuccess, entitySetId: "set-1" });

      const reviewerInput = await screen.findByTestId(
        "manage-review-reviewers-input"
      );
      userEvent.click(reviewerInput);
      userEvent.click(await screen.findByText("Jonathan Traeger"));

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-Ready")
      );

      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      await waitFor(() => {
        expect(
          mockMeasureReviewServiceApi.createMeasureReview
        ).toHaveBeenCalledWith(
          "measure-1",
          expect.objectContaining({
            measureId: "measure-1",
            measureSetId: "set-1",
            status: "READY_FOR_REVIEW",
            reviewers: ["jtraeger"],
          })
        );
      });
      expect(
        mockMeasureReviewServiceApi.updateMeasureReview
      ).not.toHaveBeenCalled();
      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
      expect(onClose).toHaveBeenCalled();
      expect(reviewSaved).toHaveBeenCalled();
      expect(
        await screen.findByTestId("manage-review-dialog-success-text")
      ).toHaveTextContent("Review information has been saved successfully.");

      window.removeEventListener("review-measure-saved", reviewSaved);
    });

    it.each([
      ["In Progress", "IN_PROGRESS"],
      ["Complete", "COMPLETE"],
    ])("saves the %s status as %s", async (label, expectedStatus) => {
      mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
        id: "review-1",
        status: "READY_FOR_REVIEW",
        comment: "<p></p>",
      });

      renderDialog();

      await waitFor(() => {
        expect(screen.getByTestId("manage-review-status")).toHaveTextContent(
          "Ready"
        );
      });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId(`manage-review-status-option-${label}`)
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      await waitFor(() => {
        expect(
          mockMeasureReviewServiceApi.updateMeasureReview
        ).toHaveBeenCalledWith(
          "measure-1",
          expect.objectContaining({ id: "review-1", status: expectedStatus })
        );
      });
      expect(
        mockMeasureReviewServiceApi.createMeasureReview
      ).not.toHaveBeenCalled();
    });

    it("pre-populates reviewers already assigned to the measure", async () => {
      mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
        id: "review-1",
        status: "IN_PROGRESS",
        comment: "<p></p>",
        reviewers: ["jtraeger"],
      });

      renderDialog();

      await waitFor(() => {
        expect(screen.getByText("Jonathan Traeger")).toBeInTheDocument();
      });
      // Pre-populated reviewers alone are not a change.
      expect(
        screen.getByTestId("manage-review-dialog-save-button")
      ).toBeDisabled();
    });

    it("treats the reviewer list as a set, not an ordered list", async () => {
      // Persisted out of order: formik compares deeply, so the form has to
      // normalise ordering or this would read as an edit straight away.
      mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
        id: "review-1",
        status: "READY_FOR_REVIEW",
        comment: "<p></p>",
        reviewers: ["zuser", "jtraeger"],
      });

      renderDialog();

      const saveButton = screen.getByTestId("manage-review-dialog-save-button");
      await waitFor(() => {
        expect(screen.getByText("Jonathan Traeger")).toBeInTheDocument();
      });
      expect(saveButton).toBeDisabled();

      const reviewerInput = screen.getByTestId("manage-review-reviewers-input");
      userEvent.click(reviewerInput);
      // Target the dropdown option; the same name also renders as a chip.
      const zoeOption = await screen.findByRole("option", {
        name: /Zoe Zimmer/,
      });

      // Removing a reviewer is a real change...
      userEvent.click(zoeOption);
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // ...and putting them back restores the original set, whatever the order.
      userEvent.click(zoeOption);
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it("saves a library review through the library service", async () => {
      renderDialog({
        entityType: "library",
        entityId: "library-1",
        entitySetId: "lib-set-1",
      });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-Complete")
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      await waitFor(() => {
        expect(
          mockLibraryReviewServiceApi.createCqlLibraryReview
        ).toHaveBeenCalledWith(
          "library-1",
          expect.objectContaining({
            libraryId: "library-1",
            librarySetId: "lib-set-1",
            status: "COMPLETE",
          })
        );
      });
      expect(
        mockMeasureReviewServiceApi.createMeasureReview
      ).not.toHaveBeenCalled();
    });

    it("shows the success toast when a reviewer changes only the status", async () => {
      mockMeasureReviewServiceApi.getMeasureReview.mockResolvedValue({
        id: "review-1",
        status: "READY_FOR_REVIEW",
        comment: "<p></p>",
      });

      renderDialog();

      await waitFor(() => {
        expect(screen.getByTestId("manage-review-status")).toHaveTextContent(
          "Ready"
        );
      });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-In Progress")
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      expect(
        await screen.findByTestId("manage-review-dialog-success-text")
      ).toHaveTextContent("Review information has been saved successfully.");
      expect(
        screen.queryByTestId("manage-review-dialog-error-text")
      ).not.toBeInTheDocument();
    });

    it("shows the success toast when saving a library review", async () => {
      renderDialog({ entityType: "library", entityId: "library-1" });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-Complete")
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      expect(
        await screen.findByTestId("manage-review-dialog-success-text")
      ).toHaveTextContent("Review information has been saved successfully.");
    });

    it("leaves the success toast up after the dialog closes", async () => {
      // The parent keeps this component mounted and only flips `open`, so the
      // confirmation has to outlive the close.
      const { rerender } = render(
        <ManageReviewDialog
          open={true}
          entityType="measure"
          entityId="measure-1"
          onClose={jest.fn()}
        />
      );

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-Ready")
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      await screen.findByTestId("manage-review-dialog-success-text");

      rerender(
        <ManageReviewDialog
          open={false}
          entityType="measure"
          entityId="measure-1"
          onClose={jest.fn()}
        />
      );

      expect(
        screen.getByTestId("manage-review-dialog-success-text")
      ).toHaveTextContent("Review information has been saved successfully.");
    });

    it("keeps the dialog open and shows an error when the save fails", async () => {
      const onClose = jest.fn();
      mockMeasureReviewServiceApi.createMeasureReview.mockRejectedValue(
        new Error("boom")
      );

      renderDialog({ onClose });

      userEvent.click(screen.getByRole("combobox", { name: /Status/i }));
      userEvent.click(
        await screen.findByTestId("manage-review-status-option-Ready")
      );
      userEvent.click(screen.getByTestId("manage-review-dialog-save-button"));

      expect(
        await screen.findByTestId("manage-review-dialog-error-text")
      ).toHaveTextContent(
        "An error occurred while saving the review. Please try again."
      );
      expect(onClose).not.toHaveBeenCalled();
    });
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
