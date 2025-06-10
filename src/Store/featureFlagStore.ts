import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qiCoreElementsTab: boolean;
  qdmHideJson: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
  stu6TestCaseValidation: boolean;
  QDMIncludeRAVValues: boolean;
  MeasureSearch: boolean;
  LibrarySearch: boolean;
  EditTestsOnVersionedMeasures: boolean;
  OverlappingValueSets: boolean;
  MinimizeAlerts: boolean;
  EnhancedTextFormatting: boolean;
  qiCore7: boolean;
}
const initialState: FeatureFlags = {
  qiCoreElementsTab: false,
  qiCoreBonnieTestCases: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  stu6TestCaseValidation: false,
  QDMIncludeRAVValues: false,
  MeasureSearch: false,
  LibrarySearch: false,
  EditTestsOnVersionedMeasures: false,
  OverlappingValueSets: false,
  MinimizeAlerts: false,
  EnhancedTextFormatting: false,
  qiCore7: false,
};

let state: FeatureFlags | null = initialState;

export const featureFlagsStore = {
  subscribe: (
    setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlags>>
  ) => subject.subscribe((state) => setFeatureFlags(state)),
  updateFeatureFlags: (featureFlags: FeatureFlags | null) => {
    state = Object.assign({}, featureFlags);
    subject.next(state);
  },
  initialState,
  state,
};
