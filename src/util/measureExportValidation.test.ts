import { describe, expect, it } from "@jest/globals";
import { getMeasureExportErrors } from "./measureExportValidation";
import { GroupScoring, MeasureScoring, Model } from "@madie/madie-models";

const baseMeasure = (overrides: any = {}): any => ({
  cql: "library Test version '0.0.000'",
  cqlErrors: false,
  errors: [],
  cqlLibraryName: "ValidLibraryName",
  model: Model.QICORE_6_0_0,
  measureMetaData: {
    draft: true,
    developers: [{ name: "dev" }],
    steward: { name: "steward" },
    description: "a description",
  },
  groups: [
    {
      id: "g1",
      scoring: MeasureScoring.PROPORTION,
      improvementNotation: "Increased score indicates improvement",
      measureGroupTypes: ["Outcome"],
    },
  ],
  ...overrides,
});

describe("getMeasureExportErrors", () => {
  it("returns no errors for a complete measure", () => {
    expect(getMeasureExportErrors(baseMeasure())).toEqual([]);
  });

  describe("improvement notation", () => {
    const withScoring = (scoring: string) =>
      baseMeasure({
        groups: [
          {
            id: "g1",
            scoring,
            improvementNotation: "",
            measureGroupTypes: ["Outcome"],
          },
        ],
      });

    it("is required for Proportion scoring", () => {
      expect(
        getMeasureExportErrors(withScoring(MeasureScoring.PROPORTION))
      ).toContain(
        "At least one Population Criteria is missing Improvement Notation"
      );
    });

    it("is optional for Cohort scoring", () => {
      expect(
        getMeasureExportErrors(withScoring(MeasureScoring.COHORT))
      ).not.toContain(
        "At least one Population Criteria is missing Improvement Notation"
      );
    });

    it("is optional for Composite scoring", () => {
      const composite = withScoring(GroupScoring.COMPOSITE);
      composite.measureMetaData.composite = true;
      expect(getMeasureExportErrors(composite)).not.toContain(
        "At least one Population Criteria is missing Improvement Notation"
      );
    });
  });

  describe("CQL checks", () => {
    const noCql = { cql: "", cqlErrors: true };

    it("reports missing and erroring CQL for a non composite measure", () => {
      const errors = getMeasureExportErrors(baseMeasure(noCql));
      expect(errors).toContain("Missing CQL");
      expect(errors).toContain("CQL Contains Errors");
    });

    it("skips CQL checks for a composite measure", () => {
      const composite = baseMeasure(noCql);
      composite.measureMetaData.composite = true;
      const errors = getMeasureExportErrors(composite);
      expect(errors).not.toContain("Missing CQL");
      expect(errors).not.toContain("CQL Contains Errors");
    });
  });

  describe("metadata", () => {
    it("reports each missing metadata field", () => {
      const measure = baseMeasure();
      measure.measureMetaData.developers = [];
      measure.measureMetaData.steward = null;
      measure.measureMetaData.description = "";
      expect(getMeasureExportErrors(measure)).toEqual([
        "Missing Measure Developers",
        "Missing Steward",
        "Missing Description",
      ]);
    });

    it("reports an invalid library name", () => {
      expect(
        getMeasureExportErrors(baseMeasure({ cqlLibraryName: "not valid" }))
      ).toContain("Measure CQL Library Name is invalid");
    });

    it("reports missing population criteria", () => {
      expect(getMeasureExportErrors(baseMeasure({ groups: [] }))).toContain(
        "Missing Population Criteria"
      );
    });
  });

  describe("measure type", () => {
    // QDM carries measure types on baseConfigurationTypes, not on the group
    const qdmMeasure = (overrides: any = {}) =>
      baseMeasure({
        model: Model.QDM_5_6,
        cqlLibraryName: "Valid_QDM_Name",
        baseConfigurationTypes: ["Outcome"],
        groups: [
          {
            id: "g1",
            scoring: MeasureScoring.PROPORTION,
            improvementNotation: "",
          },
        ],
        ...overrides,
      });

    it("returns no errors for a complete QDM measure", () => {
      expect(getMeasureExportErrors(qdmMeasure())).toEqual([]);
    });

    it("reports missing baseConfigurationTypes for QDM", () => {
      expect(
        getMeasureExportErrors(qdmMeasure({ baseConfigurationTypes: [] }))
      ).toEqual(["Measure Type is required"]);
    });

    it("reports missing group measure types for FHIR models", () => {
      expect(
        getMeasureExportErrors(
          baseMeasure({
            groups: [
              {
                id: "g1",
                scoring: MeasureScoring.PROPORTION,
                improvementNotation: "Increased score indicates improvement",
                measureGroupTypes: [],
              },
            ],
          })
        )
      ).toEqual(["At least one Population Criteria is missing Type"]);
    });
  });

  it("maps every recognized response error code and ignores unknown ones", () => {
    expect(
      getMeasureExportErrors(baseMeasure(), [
        "MISMATCH_CQL_POPULATION_RETURN_TYPES",
        "MISMATCH_CQL_RISK_ADJUSTMENT",
        "MISMATCH_CQL_SUPPLEMENTAL_DATA",
        "SOME_UNRECOGNIZED_CODE",
      ])
    ).toEqual([
      "CQL Populations Return Types are invalid",
      "CQL Risk Adjustment are invalid",
      "CQL Supplemental Data Elements are invalid",
    ]);
  });

  it("prefers parsed response errors over the measure's own errors", () => {
    const measure = baseMeasure({
      errors: ["MISMATCH_CQL_RISK_ADJUSTMENT"],
    });
    expect(
      getMeasureExportErrors(measure, ["MISMATCH_CQL_SUPPLEMENTAL_DATA"])
    ).toEqual(["CQL Supplemental Data Elements are invalid"]);
  });
});
