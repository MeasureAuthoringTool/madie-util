import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  CQLBuilderParameters: boolean;
  qiCoreElementsTab: boolean;
  qiCore6: boolean;
  qdmHideJson: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
  MeasureButtons: boolean;
  stu6TestCaseValidation: boolean;
  ShareMeasure: boolean;
  TestCaseListActionCenter: boolean;
  QICoreCodeSearch: boolean;
  QICoreValueSetSearch: boolean;
  CopyTestCases: boolean;
}
const initialState: FeatureFlags = {
  CQLBuilderParameters: false,
  qiCore6: false,
  qiCoreElementsTab: false,
  qiCoreBonnieTestCases: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  MeasureButtons: false,
  stu6TestCaseValidation: false,
  ShareMeasure: false,
  TestCaseListActionCenter: false,
  QICoreCodeSearch: false,
  QICoreValueSetSearch: false,
  CopyTestCases: false,
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
