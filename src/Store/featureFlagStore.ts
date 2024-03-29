import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  includeSDEValues: boolean;
  qdmExport: boolean;
  qiCoreElementsTab: boolean;
  qdmHideJson: boolean;
  qiCoreBonnieTestCases: boolean;
  enableQdmRepeatTransfer: boolean;
  generateCMSID: boolean;
  manifestExpansion: boolean;
  testCaseExport: boolean;
  qdmCodeSearch: boolean;
}
const initialState: FeatureFlags = {
  includeSDEValues: false,
  qdmExport: false,
  qiCoreElementsTab: false,
  qiCoreBonnieTestCases: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  generateCMSID: false,
  manifestExpansion: false,
  testCaseExport: false,
  qdmCodeSearch: false,
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
