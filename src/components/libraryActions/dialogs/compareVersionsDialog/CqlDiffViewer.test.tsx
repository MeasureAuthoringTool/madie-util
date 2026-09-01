import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CqlDiffViewer from "./CqlDiffViewer";
import { CqlLibrary } from "@madie/madie-models";

const mockOldLibrary = {
  id: "1",
  cqlLibraryName: "Older Library",
} as CqlLibrary;

const mockNewLibrary = {
  id: "2",
  cqlLibraryName: "Newer Library (Draft)",
} as CqlLibrary;

const mockCqlDiffResponse = {
  comparisons: [
    {
      oldText: "define OldLogic: true",
      newText: "define NewLogic: false",
    },
  ],
};

const mockLibraryServiceApi = {
  getCqlDiff: jest.fn(),
};

jest.mock("../../../../api/useCqlLibraryServiceApi", () => ({
  __esModule: true,
  default: jest.fn(() => mockLibraryServiceApi),
}));

jest.mock("react-diff-viewer-continued", () => {
  return jest.fn(({ oldValue, newValue }) => (
    <div data-testid="react-diff-viewer">
      <pre data-testid="old-text">{oldValue}</pre>
      <pre data-testid="new-text">{newValue}</pre>
    </div>
  ));
});

describe("CqlDiffViewer component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls getCqlDiff when both Library ids are provided", async () => {
    mockLibraryServiceApi.getCqlDiff.mockResolvedValue(mockCqlDiffResponse);

    render(
      <CqlDiffViewer oldLibrary={mockOldLibrary} newLibrary={mockNewLibrary} />
    );

    await waitFor(() =>
      expect(mockLibraryServiceApi.getCqlDiff).toHaveBeenCalledWith(
        mockOldLibrary.id,
        mockNewLibrary.id
      )
    );
  });

  it("renders the diff viewer with old and new CQL text", async () => {
    mockLibraryServiceApi.getCqlDiff.mockResolvedValue(mockCqlDiffResponse);

    render(
      <CqlDiffViewer oldLibrary={mockOldLibrary} newLibrary={mockNewLibrary} />
    );

    expect(await screen.findByTestId("react-diff-viewer")).toBeInTheDocument();

    expect(screen.getByTestId("old-text")).toHaveTextContent(
      mockCqlDiffResponse.comparisons[0].oldText
    );
    expect(screen.getByTestId("new-text")).toHaveTextContent(
      mockCqlDiffResponse.comparisons[0].newText
    );
  });

  it("displays error message when getCqlDiff fails", async () => {
    mockLibraryServiceApi.getCqlDiff.mockRejectedValue(
      new Error("Network error")
    );

    render(
      <CqlDiffViewer oldLibrary={mockOldLibrary} newLibrary={mockNewLibrary} />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          /Could not get CQL diff for these two CQL library instances/i
        )
      ).toBeInTheDocument()
    );
  });

  it("does not call getCqlDiff if newLibrary is missing", () => {
    render(
      <CqlDiffViewer oldLibrary={mockOldLibrary} newLibrary={null as any} />
    );
    expect(mockLibraryServiceApi.getCqlDiff).not.toHaveBeenCalled();
  });

  it("does not call getCqlDiff if oldLibrary is missing", () => {
    render(
      <CqlDiffViewer oldLibrary={null as any} newLibrary={mockNewLibrary} />
    );
    expect(mockLibraryServiceApi.getCqlDiff).not.toHaveBeenCalled();
  });
});
