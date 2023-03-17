import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  export: boolean;
  //measureVersioning: boolean;
  populationCriteriaTabs: boolean;
  applyDefaults: boolean;
  importTestCases: boolean;

  qdm: boolean;
}
const initialState: FeatureFlags = {
  export: false,
  //measureVersioning: false,
  populationCriteriaTabs: true,
  applyDefaults: false,
  importTestCases: false,
  qdm: false,
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
