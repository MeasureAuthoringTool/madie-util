import * as React from "react";
import { render, screen } from "@testing-library/react";
import TransferAction, {
  NOTHING_SELECTED,
  CANNOT_TRANSFER,
  MORE_THAN_ONE_NOT_OWNED,
  TRANSFER,
} from "./TransferAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import { useUserRoles } from "../../../../hooks/useUserRoles";
import checkUserCanEdit from "../../../../util/useCheckCanEdit";

const mockUser = "test user";

jest.mock("../../../../hooks/useUserRoles", () => ({
  useUserRoles: jest.fn(() => ({
    roles: [],
    isAdmin: false,
  })),
}));

jest.mock("../../../../util/useCheckCanEdit", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const mockMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as unknown as Measure;

describe("TransferAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: [],
      isAdmin: false,
    });
  });

  it("Should disable action btn if no measure selected", () => {
    render(<TransferAction measures={[]} onClick={() => {}} activeTab={0} />);
    expect(screen.getByTestId("transfer-action-btn")).toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one measure", async () => {
    render(
      <TransferAction
        measures={[mockMeasure]}
        onClick={() => {}}
        activeTab={0}
      />
    );
    await expect(screen.getByTestId("transfer-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      TRANSFER
    );
  });

  it("Should disable action btn if it's from Shared Measures tab", () => {
    render(
      <TransferAction
        measures={[mockMeasure]}
        onClick={() => {}}
        activeTab={1}
      />
    );
    expect(screen.getByTestId("transfer-action-btn")).toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      CANNOT_TRANSFER
    );
  });

  it("Should enable action btn if it's from All Measures tab and user is the owner", () => {
    (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => true);
    render(
      <TransferAction
        measures={[mockMeasure]}
        onClick={() => {}}
        activeTab={2}
      />
    );
    expect(screen.getByTestId("transfer-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      TRANSFER
    );
  });

  it("Should display nothing selected", () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => true);
    render(<TransferAction measures={[]} onClick={() => {}} activeTab={2} />);
    expect(screen.getByTestId("transfer-action-btn")).toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user is not the owner", () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
    const testMeasureSet = { ...mockMeasureSet, owner: "anotherUser" };
    const testMeasure = { ...mockMeasure, measureSet: testMeasureSet };
    render(
      <TransferAction
        measures={[testMeasure]}
        onClick={() => {}}
        activeTab={2}
      />
    );
    expect(screen.getByTestId("transfer-action-btn")).toBeDisabled();
    expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
      "aria-label",
      MORE_THAN_ONE_NOT_OWNED
    );
  });

  // Admin user tests
  describe("Admin user transfer measure", () => {
    beforeEach(() => {
      (useUserRoles as jest.Mock).mockReturnValue({
        roles: ["MADiE-Admin"],
        isAdmin: true,
      });
    });

    it("Should disable action btn if no measure selected even for admin", () => {
      render(<TransferAction measures={[]} onClick={() => {}} activeTab={0} />);
      expect(screen.getByTestId("transfer-action-btn")).toBeDisabled();
      expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
        "aria-label",
        NOTHING_SELECTED
      );
    });

    it("Should enable action btn for admin on Owned Measures tab", () => {
      render(
        <TransferAction
          measures={[mockMeasure]}
          onClick={() => {}}
          activeTab={0}
        />
      );
      expect(screen.getByTestId("transfer-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
        "aria-label",
        TRANSFER
      );
    });

    it("Should enable action btn for admin on Shared Measures tab", () => {
      render(
        <TransferAction
          measures={[mockMeasure]}
          onClick={() => {}}
          activeTab={1}
        />
      );
      expect(screen.getByTestId("transfer-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
        "aria-label",
        TRANSFER
      );
    });

    it("Should enable action btn for admin on All Measures tab even for non-owned measures", () => {
      (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
      const testMeasureSet = { ...mockMeasureSet, owner: "anotherUser" };
      const testMeasure = { ...mockMeasure, measureSet: testMeasureSet };
      render(
        <TransferAction
          measures={[testMeasure]}
          onClick={() => {}}
          activeTab={2}
        />
      );
      expect(screen.getByTestId("transfer-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("transfer-action-tooltip")).toHaveAttribute(
        "aria-label",
        TRANSFER
      );
    });
  });
});
