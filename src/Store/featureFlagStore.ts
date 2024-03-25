import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qdmExport: boolean;
  qdmTestCases: boolean;
  qiCoreElementsTab: boolean;
  disableRunTestCaseWithObservStrat: boolean;
  qdmHideJson: boolean;
  qdmMeasureDefinitions: boolean;
  qdmMeasureReferences: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
}
const initialState: FeatureFlags = {
  qdmExport: false,
  qdmTestCases: true,
  qiCoreElementsTab: false,
  qdmMeasureDefinitions: false,
  qdmMeasureReferences: false,
  qiCoreBonnieTestCases: false,
  disableRunTestCaseWithObservStrat: true,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
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
