import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  COMPOSITE_VALIDATION_MESSAGES,
  compositeScoringValues,
  getAllowedScoringTypes,
  validateCompositeMeasure,
} from "./compositeMeasureValidation";
import { GroupScoring, MeasureScoring, Measure } from "@madie/madie-models";

const mockMeasureServiceApi = {
  fetchMeasuresByIds: jest.fn<Promise<any>, any>(),
};

// builds a component measure with a single group
const componentMeasure = (
  id: string,
  groupId: string,
  scoring: string,
  populationBasis = "boolean"
): any => ({
  id,
  measureName: `Component ${id}`,
  groups: [{ id: groupId, scoring, populationBasis }],
});

const compositeMeasure = ({
  scoring = GroupScoring.COMPOSITE,
  compositeScoring = "Opportunity",
  components = [
    { measureId: "m1", groupId: "g1" },
    { measureId: "m2", groupId: "g2" },
  ],
  populationBasis = "boolean",
}: any = {}): Measure =>
  ({
    id: "composite-1",
    measureName: "Composite Measure",
    measureMetaData: { composite: true },
    groups: [
      { id: "cg1", scoring, compositeScoring, components, populationBasis },
    ],
  } as unknown as Measure);

describe("getAllowedScoringTypes", () => {
  it("allows Proportion and Ratio for Opportunity", () => {
    expect(getAllowedScoringTypes("Opportunity")).toEqual([
      MeasureScoring.PROPORTION,
      MeasureScoring.RATIO,
    ]);
  });

  it("allows Proportion and Ratio for All-or-nothing", () => {
    expect(getAllowedScoringTypes("All-or-nothing")).toEqual([
      MeasureScoring.PROPORTION,
      MeasureScoring.RATIO,
    ]);
  });

  it("allows Proportion, Ratio and Continuous Variable for Linear", () => {
    expect(getAllowedScoringTypes("Linear")).toEqual([
      MeasureScoring.PROPORTION,
      MeasureScoring.RATIO,
      MeasureScoring.CONTINUOUS_VARIABLE,
    ]);
  });

  it("returns an empty list for an unknown composite scoring", () => {
    expect(getAllowedScoringTypes("Component-level")).toEqual([]);
    expect(getAllowedScoringTypes(null)).toEqual([]);
  });

  it("exposes the three supported composite scoring values", () => {
    expect(compositeScoringValues).toEqual([
      "Opportunity",
      "All-or-nothing",
      "Linear",
    ]);
  });
});

describe("validateCompositeMeasure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION),
      componentMeasure("m2", "g2", MeasureScoring.RATIO),
    ]);
  });

  it("returns no errors and never calls the api for a non composite measure", async () => {
    const measure = {
      id: "1",
      measureMetaData: { composite: false },
      groups: [{ id: "g1", scoring: MeasureScoring.PROPORTION }],
    } as unknown as Measure;

    expect(
      await validateCompositeMeasure(measure, mockMeasureServiceApi)
    ).toEqual([]);
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });

  it("returns no errors for a measure without metadata", async () => {
    expect(
      await validateCompositeMeasure(
        { id: "1" } as unknown as Measure,
        mockMeasureServiceApi
      )
    ).toEqual([]);
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });

  it("returns no errors for a valid composite measure", async () => {
    expect(
      await validateCompositeMeasure(compositeMeasure(), mockMeasureServiceApi)
    ).toEqual([]);
    expect(mockMeasureServiceApi.fetchMeasuresByIds).toHaveBeenCalledWith([
      "m1",
      "m2",
    ]);
  });

  it("requires two components when no components are selected", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({ components: [] }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED
    );
  });

  it("requires two components when one measure with one group is selected", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({ components: [{ measureId: "m1", groupId: "g1" }] }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED
    );
  });

  it("requires two distinct measures, not one measure contributing two groups", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      {
        id: "m1",
        groups: [
          {
            id: "g1",
            scoring: MeasureScoring.PROPORTION,
            populationBasis: "boolean",
          },
          {
            id: "g2",
            scoring: MeasureScoring.RATIO,
            populationBasis: "boolean",
          },
        ],
      },
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure({
        components: [
          { measureId: "m1", groupId: "g1" },
          { measureId: "m1", groupId: "g2" },
        ],
      }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED
    );
    // the same measure id is only fetched once
    expect(mockMeasureServiceApi.fetchMeasuresByIds).toHaveBeenCalledWith([
      "m1",
    ]);
  });

  it("ignores duplicate component entries when counting components", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({
        components: [
          { measureId: "m1", groupId: "g1" },
          { measureId: "m1", groupId: "g1" },
        ],
      }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED
    );
  });

  it("requires the group scoring to be Composite", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({ scoring: MeasureScoring.PROPORTION }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.SCORING_MUST_BE_COMPOSITE
    );
  });

  it("requires a composite scoring method", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({ compositeScoring: null }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_REQUIRED
    );
    // components are not validated without a composite scoring method
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });

  it("rejects an unsupported composite scoring method", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({ compositeScoring: "Component-level" }),
      mockMeasureServiceApi
    );
    expect(errors).toContain(
      COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_INVALID
    );
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });

  it("rejects a Continuous Variable component under Opportunity scoring", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION),
      componentMeasure("m2", "g2", MeasureScoring.CONTINUOUS_VARIABLE),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure({ compositeScoring: "Opportunity" }),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.COMPONENT_MEASURE_TYPES_INVALID,
    ]);
  });

  it("allows a Continuous Variable component under Linear scoring", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION),
      componentMeasure("m2", "g2", MeasureScoring.CONTINUOUS_VARIABLE),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure({ compositeScoring: "Linear" }),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([]);
  });

  it("reports the measure types error only once for multiple bad components", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.COHORT),
      componentMeasure("m2", "g2", MeasureScoring.COHORT),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure(),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.COMPONENT_MEASURE_TYPES_INVALID,
    ]);
  });

  it("rejects a non patient based component when the composite is patient based", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION, "boolean"),
      componentMeasure("m2", "g2", MeasureScoring.RATIO, "Encounter"),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure(),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.COMPONENT_POPULATION_BASIS_INVALID,
    ]);
  });

  it("does not check population basis when the composite is not patient based", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION, "Encounter"),
      componentMeasure("m2", "g2", MeasureScoring.RATIO, "Encounter"),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure({ populationBasis: "Encounter" }),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([]);
  });

  it("flags a component whose group cannot be resolved", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue([
      componentMeasure("m1", "g1", MeasureScoring.PROPORTION),
    ]);
    const errors = await validateCompositeMeasure(
      compositeMeasure(),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.COMPONENT_MEASURE_TYPES_INVALID,
    ]);
  });

  it("fails closed when the component measures cannot be fetched", async () => {
    mockMeasureServiceApi.fetchMeasuresByIds.mockRejectedValue(
      new Error("network down")
    );
    const errors = await validateCompositeMeasure(
      compositeMeasure(),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.UNABLE_TO_VALIDATE_COMPONENTS,
    ]);
  });

  // ordered by the order the user must fix them in: composite scoring gates the
  // Select Components button, so it is reported before the component checks
  it("returns every failure in the order the user must fix them", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({
        scoring: MeasureScoring.PROPORTION,
        compositeScoring: null,
        components: [],
      }),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.SCORING_MUST_BE_COMPOSITE,
      COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_REQUIRED,
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED,
    ]);
  });

  it("still reports the component count when the composite scoring is unusable", async () => {
    const errors = await validateCompositeMeasure(
      compositeMeasure({
        compositeScoring: "Component-level",
        components: [{ measureId: "m1", groupId: "g1" }],
      }),
      mockMeasureServiceApi
    );
    expect(errors).toEqual([
      COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_INVALID,
      COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED,
    ]);
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });
});
