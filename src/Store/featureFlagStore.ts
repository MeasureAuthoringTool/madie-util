import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  export: boolean;
  populationCriteriaTabs: boolean;
  importTestCases: boolean;

  qdm: boolean;
  qdmExport: boolean;
  qdmVersioning: boolean;
  qiCoreElementsTab: boolean;
  highlightingTabs: boolean;
  exportQiCoreBundleType: boolean;
}
const initialState: FeatureFlags = {
  export: false,
  populationCriteriaTabs: true,
  importTestCases: false,
  qdm: false,
  qdmExport: false,
  qdmVersioning: false,
  qiCoreElementsTab: false,
  highlightingTabs: false,
  exportQiCoreBundleType: false,
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
