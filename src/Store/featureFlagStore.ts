import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  CQLBuilderIncludes: boolean;
  qiCoreElementsTab: boolean;
  qiCore6: boolean;
  qdmHideJson: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
  qdmCodeSearch: boolean;
  QDMValueSetSearch: boolean;
  CQLBuilderDefinitions: boolean;
  ShiftTestCasesDates: boolean;
  associateMeasures: boolean;
  qiCoreStu4Updates: boolean;
}
const initialState: FeatureFlags = {
  CQLBuilderIncludes: false,
  qiCore6: false,
  qiCoreElementsTab: false,
  qiCoreBonnieTestCases: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  qdmCodeSearch: false,
  QDMValueSetSearch: false,
  CQLBuilderDefinitions: false,
  ShiftTestCasesDates: false,
  associateMeasures: false,
  qiCoreStu4Updates: false,
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
