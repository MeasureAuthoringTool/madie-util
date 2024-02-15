import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  includeSDEValues: boolean;
  qdmExport: boolean;
  qdmTestCases: boolean;
  qiCoreElementsTab: boolean;
  highlightingTabs: boolean;
  qdmHighlightingTabs: boolean;
  disableRunTestCaseWithObservStrat: boolean;
  qdmHideJson: boolean;
  qdmMeasureDefinitions: boolean;
  qdmMeasureReferences: boolean;
  importTestCases: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
  generateCMSID: boolean;
}
const initialState: FeatureFlags = {
  includeSDEValues: false,
  qdmExport: false,
  qdmTestCases: true,
  qiCoreElementsTab: false,
  highlightingTabs: true,
  qdmHighlightingTabs: false,
  qdmMeasureDefinitions: false,
  qdmMeasureReferences: false,
  importTestCases: false,
  qiCoreBonnieTestCases: false,
  disableRunTestCaseWithObservStrat: true,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  generateCMSID: false,
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
