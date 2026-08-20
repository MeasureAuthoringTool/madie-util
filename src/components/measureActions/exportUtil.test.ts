import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  downloadZipFile,
  EXPORT_FAILURE_MESSAGE,
  exportMeasure,
  parseErrorMessageFromBlob,
} from "./exportUtil";
import { GroupScoring, MeasureScoring, Model } from "@madie/madie-models";
import { COMPOSITE_VALIDATION_MESSAGES } from "../../util/compositeMeasureValidation";

const setToastOpen = jest.fn();
const setToastType = jest.fn();
const setToastMessage = jest.fn();
const setDownloadState = jest.fn();
const setFailureMessage = jest.fn();
const abortController = { current: { signal: {} } };
const mockMeasureServiceApi = {
  getMeasureExport: jest.fn<Promise<{ status: number; data: Blob }>, []>(),
  fetchMeasuresByIds: jest.fn<Promise<any>, any>(),
};

const mockMeasure = {
  id: "1",
  ecqmTitle: "Test Measure",
  model: Model.QICORE,
  version: "1.0.0",
};
const elmErrorSeverity = "Error";

describe("exportUtil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("downloadZipFile", () => {
    let createObjectURLMock,
      createElementMock,
      appendChildMock,
      clickMock,
      removeChildMock;

    beforeEach(() => {
      createObjectURLMock = jest.fn(
        () => "blob:http://localhost:3000/some-blob-url"
      );
      createElementMock = jest.fn(() => ({
        href: "",
        setAttribute: jest.fn(),
        click: (clickMock = jest.fn()),
      }));
      appendChildMock = jest.fn();
      removeChildMock = jest.fn();

      Object.defineProperty(window.URL, "createObjectURL", {
        value: createObjectURLMock,
      });
      document.createElement = createElementMock;
      document.body.appendChild = appendChildMock;
      document.body.removeChild = removeChildMock;
    });

    it("should download the zip file and show success toast", () => {
      const exportData = new Blob(["test data"], { type: "application/zip" });
      const ecqmTitle = "Test Measure";
      const model = Model.QICORE;
      const version = "1.0.0";
      const warn = false;

      downloadZipFile(
        exportData,
        ecqmTitle,
        model,
        version,
        warn,
        setToastOpen,
        setToastType,
        setToastMessage,
        setDownloadState
      );

      expect(createObjectURLMock).toHaveBeenCalledWith(exportData);
      expect(createElementMock).toHaveBeenCalledWith("a");
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
      expect(setToastOpen).toHaveBeenCalledWith(true);
      expect(setToastType).toHaveBeenCalledWith("success");
      expect(setToastMessage).toHaveBeenCalledWith(
        "Measure exported successfully"
      );
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });
  });

  describe("exportMeasure", () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("should export measure and call downloadZipFile on success", async () => {
      mockMeasureServiceApi.getMeasureExport.mockResolvedValue({
        status: 200,
        data: new Blob(["test data"], { type: "application/zip" }),
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(mockMeasureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        mockMeasure.id,
        elmErrorSeverity,
        abortController.current.signal
      );
      expect(setToastType).toHaveBeenCalledWith("success");
      expect(setToastMessage).toHaveBeenCalledWith(
        "Measure exported successfully"
      );
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });

    it("should block export and list composite and general failures together", async () => {
      const invalidComposite = {
        ...mockMeasure,
        cqlLibraryName: "ValidLibraryName",
        // steward omitted so a general export error is raised alongside the composite ones
        measureMetaData: {
          composite: true,
          developers: [{ name: "dev" }],
          description: "a description",
        },
        groups: [
          {
            id: "cg1",
            scoring: GroupScoring.COMPOSITE,
            compositeScoring: null,
            components: [],
            measureGroupTypes: ["Outcome"],
          },
        ],
      };

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        invalidComposite,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(mockMeasureServiceApi.getMeasureExport).not.toHaveBeenCalled();
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setDownloadState).toHaveBeenCalledWith("failure");
      // composite failures first, then the general export failures
      expect(setFailureMessage).toHaveBeenCalledWith([
        COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_REQUIRED,
        COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED,
        "Missing Steward",
      ]);
    });

    it("should not report CQL failures for a composite measure", async () => {
      const compositeWithoutCql = {
        ...mockMeasure,
        cql: "",
        cqlErrors: true,
        cqlLibraryName: "ValidLibraryName",
        measureMetaData: {
          composite: true,
          developers: [{ name: "dev" }],
          steward: { name: "steward" },
          description: "a description",
        },
        groups: [
          {
            id: "cg1",
            scoring: GroupScoring.COMPOSITE,
            compositeScoring: null,
            components: [],
            measureGroupTypes: ["Outcome"],
          },
        ],
      };

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        compositeWithoutCql,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      // composites carry no CQL of their own
      expect(setFailureMessage).toHaveBeenCalledWith([
        COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_REQUIRED,
        COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED,
      ]);
    });

    it("should export a valid composite measure", async () => {
      const validComposite = {
        ...mockMeasure,
        cqlLibraryName: "ValidLibraryName",
        measureMetaData: {
          composite: true,
          developers: [{ name: "dev" }],
          steward: { name: "steward" },
          description: "a description",
        },
        groups: [
          {
            id: "cg1",
            scoring: GroupScoring.COMPOSITE,
            compositeScoring: "Opportunity",
            populationBasis: "boolean",
            measureGroupTypes: ["Outcome"],
            // no improvementNotation: optional for COMPOSITE scoring
            components: [
              { measureId: "m1", groupId: "g1" },
              { measureId: "m2", groupId: "g2" },
            ],
          },
        ],
      };
      mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
        {
          id: "m1",
          groups: [
            {
              id: "g1",
              scoring: MeasureScoring.PROPORTION,
              populationBasis: "boolean",
            },
          ],
        },
        {
          id: "m2",
          groups: [
            {
              id: "g2",
              scoring: MeasureScoring.RATIO,
              populationBasis: "boolean",
            },
          ],
        },
      ]);
      mockMeasureServiceApi.getMeasureExport.mockResolvedValue({
        status: 200,
        data: new Blob(["test data"], { type: "application/zip" }),
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        validComposite,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(mockMeasureServiceApi.getMeasureExport).toHaveBeenCalled();
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });

    it("should handle cancellation", async () => {
      mockMeasureServiceApi.getMeasureExport.mockRejectedValue({
        message: "canceled",
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setToastOpen).toHaveBeenCalled();
      expect(setDownloadState).toHaveBeenCalledWith(null);
    });

    it("should display default error message if API call fails", async () => {
      mockMeasureServiceApi.getMeasureExport.mockRejectedValueOnce({
        status: 500,
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(EXPORT_FAILURE_MESSAGE);
    });

    it("should handle 409 error with validation issues and set multiple failure messages", async () => {
      const measure = {
        id: "1",
        ecqmTitle: "Test Measure",
        model: Model.QICORE,
        version: "1.0.0",
        cql: "",
        cqlErrors: true,
        errors: ["MISMATCH_CQL_POPULATION_RETURN_TYPES"],
        groups: [],
        measureMetaData: {
          developers: [],
          steward: "",
          description: "",
          draft: true,
        },
        cqlLibraryName: "invalid library name!",
        baseConfigurationTypes: [],
      };

      mockMeasureServiceApi.getMeasureExport.mockRejectedValue({
        response: { status: 409 },
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        measure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          "Missing CQL",
          "CQL Contains Errors",
          "CQL Populations Return Types are invalid",
          "Measure CQL Library Name is invalid",
          "Missing Population Criteria",
          "Missing Measure Developers",
          "Missing Steward",
          "Missing Description",
        ])
      );
    });

    it("should handle 409 error and parse validation issues from Blob", async () => {
      const measure = {
        id: "1",
        ecqmTitle: "Test Measure",
        model: Model.QICORE,
        version: "1.0.0",
        cql: "",
        cqlErrors: true,
        errors: [],
        groups: [],
        measureMetaData: {
          developers: [],
          steward: "",
          description: "",
          draft: true,
        },
        cqlLibraryName: "invalid library name!",
        baseConfigurationTypes: [],
      };

      const errorPayload = {
        message:
          "Validation failed, MISMATCH_CQL_POPULATION_RETURN_TYPES, MISMATCH_CQL_RISK_ADJUSTMENT, MISMATCH_CQL_SUPPLEMENTAL_DATA",
      };

      const errorBlob = new Blob([JSON.stringify(errorPayload)], {
        type: "application/json",
      });

      if (!errorBlob.text) {
        errorBlob.text = async () => JSON.stringify(errorPayload);
      }

      const exportConflict = {
        response: {
          data: errorBlob,
          status: 409,
        },
      };

      mockMeasureServiceApi.getMeasureExport.mockRejectedValue(exportConflict);

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        measure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          "Missing CQL",
          "CQL Contains Errors",
          "CQL Populations Return Types are invalid",
          "CQL Risk Adjustment are invalid",
          "CQL Supplemental Data Elements are invalid",
          "Measure CQL Library Name is invalid",
          "Missing Population Criteria",
          "Missing Measure Developers",
          "Missing Steward",
          "Missing Description",
        ])
      );
    });

    it("should display error message to the user when export is not available status 404", async () => {
      const errorPayload = {
        message:
          'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Executable Export" for this measure.',
        status: 404,
        error: "Bad Request",
      };

      const errorBlob = new Blob([JSON.stringify(errorPayload)], {
        type: "application/json",
      });

      if (!errorBlob.text) {
        errorBlob.text = async () => JSON.stringify(errorPayload);
      }

      const exportNotFound = {
        response: {
          data: errorBlob,
          status: 404,
        },
      };
      mockMeasureServiceApi.getMeasureExport.mockRejectedValue(exportNotFound);

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(mockMeasureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        mockMeasure.id,
        elmErrorSeverity,
        abortController.current.signal
      );
      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setFailureMessage).toHaveBeenCalledWith(
        'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Executable Export" for this measure.'
      );
    });
  });
  it("should return null and log error when parsing fails", async () => {
    // Mock console.error
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create a Blob that will throw an error when parsed
    const invalidBlob = new Blob(["not valid json"], { type: "text/plain" });

    const result = await parseErrorMessageFromBlob(invalidBlob);

    // Verify null is returned
    expect(result).toBeNull();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error parsing response:",
      expect.any(Error)
    );

    // Clean up
    consoleErrorSpy.mockRestore();
  });
});
