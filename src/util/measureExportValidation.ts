import _ from "lodash";
import {
  GroupScoring,
  MeasureScoring,
  Measure,
  Model,
} from "@madie/madie-models";

export const getMeasureExportErrors = (
  measure: Measure,
  responseErrors: string[] = []
): string[] => {
  const {
    cql,
    cqlErrors,
    errors,
    groups,
    measureMetaData,
    cqlLibraryName,
    model,
    baseConfigurationTypes,
  } = measure as any;

  const missing: string[] = [];

  // composites carry no CQL of their own so skip these validation checks
  if (!measureMetaData?.composite) {
    if (_.isEmpty(cql)) {
      missing.push("Missing CQL");
    }
    if (cqlErrors) {
      missing.push("CQL Contains Errors");
    }
  }

  const errorList = responseErrors.length > 0 ? responseErrors : errors;
  if (!_.isEmpty(errorList)) {
    errorList.forEach((error) => {
      if (error.startsWith("MISMATCH_CQL_POPULATION_RETURN_TYPES")) {
        missing.push("CQL Populations Return Types are invalid");
      } else if (error.startsWith("MISMATCH_CQL_RISK_ADJUSTMENT")) {
        missing.push("CQL Risk Adjustment are invalid");
      } else if (error.startsWith("MISMATCH_CQL_SUPPLEMENTAL_DATA")) {
        missing.push("CQL Supplemental Data Elements are invalid");
      }
    });
  }

  if (
    (model?.startsWith("QI-Core") &&
      !/^(^[A-Z][a-zA-Z0-9]*$)/.test(cqlLibraryName)) ||
    (model?.startsWith("QDM") &&
      !/^(^[A-Z][a-zA-Z0-9_]*$)/.test(cqlLibraryName)) ||
    cqlLibraryName == null ||
    cqlLibraryName.length > 64
  ) {
    missing.push("Measure CQL Library Name is invalid");
  }
  if (_.isEmpty(groups)) {
    missing.push("Missing Population Criteria");
  }
  if (_.isEmpty(measureMetaData?.developers)) {
    missing.push("Missing Measure Developers");
  }
  if (_.isEmpty(measureMetaData?.steward)) {
    missing.push("Missing Steward");
  }
  if (_.isEmpty(measureMetaData?.description)) {
    missing.push("Missing Description");
  }
  if (
    model === Model.QICORE &&
    groups &&
    groups.filter(
      (group) =>
        group.measureGroupTypes === null || _.isEmpty(group.measureGroupTypes)
    ).length > 0
  ) {
    missing.push("At least one Population Criteria is missing Type");
  }
  if (model === Model.QDM_5_6 && _.isEmpty(baseConfigurationTypes)) {
    missing.push("Measure Type is required");
  }
  if (
    (model === Model.QICORE || model === Model.QICORE_6_0_0) &&
    measureMetaData?.draft
  ) {
    // optional for Cohort and Composite
    if (
      groups?.some(
        (group) =>
          _.isEmpty(group.improvementNotation) &&
          group.scoring !== MeasureScoring.COHORT &&
          group.scoring !== GroupScoring.COMPOSITE
      )
    ) {
      missing.push(
        "At least one Population Criteria is missing Improvement Notation"
      );
    }
  }

  return missing;
};
