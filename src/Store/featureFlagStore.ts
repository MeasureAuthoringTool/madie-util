import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qdmExport: boolean;
  qdmTestCases: boolean;
  qiCoreElementsTab: boolean;
  highlightingTabs: boolean;
  qdmHighlightingTabs: boolean;
  disableRunTestCaseWithObservStrat: boolean;
  qdmHideJson: boolean;
  importTestCases: boolean;
  qiCoreBonnieTestCases: boolean;
}
const initialState: FeatureFlags = {
  qdmExport: false,
  qdmTestCases: true,
  qiCoreElementsTab: false,
  highlightingTabs: true,
  qdmHighlightingTabs: false,
  importTestCases: false,
  qiCoreBonnieTestCases: false,
  disableRunTestCaseWithObservStrat: true,
  qdmHideJson: true,
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
