import _ from "lodash";
import {
  Component,
  Group,
  GroupScoring,
  Measure,
  MeasureScoring,
} from "@madie/madie-models";

// Composite validations shared by measure export and versioning
export const COMPOSITE_VALIDATION_MESSAGES = {
  TWO_COMPONENTS_REQUIRED: "Two component measures must be selected",
  SCORING_MUST_BE_COMPOSITE: "Measure score must be Composite",
  COMPOSITE_SCORING_REQUIRED: "Composite measure score is required",
  COMPOSITE_SCORING_INVALID: "Component measures score is inaccurate",
  COMPONENT_MEASURE_TYPES_INVALID:
    "The measure type of the component measure(s) is invalid",
  COMPONENT_POPULATION_BASIS_INVALID:
    "The population basis for the component measure(s) is inaccurate",
  UNABLE_TO_VALIDATE_COMPONENTS:
    "Unable to validate component measures. Please try again and contact the Help Desk if the problem persists.",
};

// The supported composite scoring methods and the component scoring types each
// one allows
const ALLOWED_COMPONENT_SCORING: Record<string, MeasureScoring[]> = {
  Opportunity: [MeasureScoring.PROPORTION, MeasureScoring.RATIO],
  "All-or-nothing": [MeasureScoring.PROPORTION, MeasureScoring.RATIO],
  Linear: [
    MeasureScoring.PROPORTION,
    MeasureScoring.RATIO,
    MeasureScoring.CONTINUOUS_VARIABLE,
  ],
};

export const compositeScoringValues = Object.keys(ALLOWED_COMPONENT_SCORING);

export const getAllowedScoringTypes = (
  compositeScoring: string
): MeasureScoring[] => ALLOWED_COMPONENT_SCORING[compositeScoring] ?? [];

const PATIENT_BASIS = "boolean";

const isPatientBased = (group: Group): boolean =>
  group?.populationBasis?.toLowerCase() === PATIENT_BASIS;

// Components live on the group whose scoring is COMPOSITE.
const getCompositeGroup = (measure: Measure): Group =>
  measure?.groups?.find((group) => group.scoring === GroupScoring.COMPOSITE) ??
  measure?.groups?.[0];

/**
 * Returns the user facing failure messages for a composite measure, empty when
 * the measure is valid or is not composite.
 */
export const validateCompositeMeasure = async (
  measure: Measure,
  measureServiceApi
): Promise<string[]> => {
  if (!measure?.measureMetaData?.composite) {
    return [];
  }

  const errors: string[] = [];
  const compositeGroup = getCompositeGroup(measure);
  const components = compositeGroup?.components ?? [];
  const compositeScoring = compositeGroup?.compositeScoring;
  // one measure can contribute several groups, so ids repeat across components
  const componentMeasureIds = _.uniq(
    components.map((component) => component.measureId)
  );
  const isCompositeScoringValid =
    compositeScoringValues.includes(compositeScoring);

  // the UI forces COMPOSITE scoring, so this only guards against bad data
  if (compositeGroup && compositeGroup.scoring !== GroupScoring.COMPOSITE) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.SCORING_MUST_BE_COMPOSITE);
  }

  if (_.isEmpty(compositeScoring)) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_REQUIRED);
  } else if (!isCompositeScoringValid) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.COMPOSITE_SCORING_INVALID);
  }

  if (componentMeasureIds.length < 2) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.TWO_COMPONENTS_REQUIRED);
  }

  // allowed component scoring is derived from the composite scoring method
  if (!isCompositeScoringValid || _.isEmpty(components)) {
    return errors;
  }

  let componentMeasures: Measure[];
  try {
    componentMeasures = await measureServiceApi?.fetchMeasuresByIds(
      componentMeasureIds
    );
  } catch (error) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.UNABLE_TO_VALIDATE_COMPONENTS);
    return errors;
  }

  const allowedScoringTypes: string[] =
    getAllowedScoringTypes(compositeScoring);
  const componentGroups = components.map((component: Component) =>
    componentMeasures
      ?.find((candidate) => candidate?.id === component.measureId)
      ?.groups?.find((group) => group.id === component.groupId)
  );

  // an unresolvable component cannot be proven valid
  const hasInvalidScoring = componentGroups.some(
    (group) => !group || !allowedScoringTypes.includes(group.scoring)
  );

  const hasInvalidPopulationBasis =
    isPatientBased(compositeGroup) &&
    componentGroups.some((group) => group && !isPatientBased(group));

  if (hasInvalidScoring) {
    errors.push(COMPOSITE_VALIDATION_MESSAGES.COMPONENT_MEASURE_TYPES_INVALID);
  }
  if (hasInvalidPopulationBasis) {
    errors.push(
      COMPOSITE_VALIDATION_MESSAGES.COMPONENT_POPULATION_BASIS_INVALID
    );
  }

  return errors;
};
