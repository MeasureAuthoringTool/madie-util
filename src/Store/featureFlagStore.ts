import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qiCoreElementsTab: boolean;
  qdmHideJson: boolean;
  enableQdmRepeatTransfer: boolean;
  stu6TestCaseValidation: boolean;
  MeasureSearch: boolean;
  LibrarySearch: boolean;
  Locking: boolean;
  qiCore7: boolean;
  TransferMeasure: boolean;
  TransferLibrary: boolean;
  MeasureHistory: boolean;
  Calculator: boolean;
  LibraryHistory: boolean;
  CompareLibraryVersions: boolean;
  CompareMeasureVersions: boolean;
  ExecutionConfigurationTab: boolean;
  QICoreCompositeMeasure: boolean;
  DisplayOwner: boolean;
}
const initialState: FeatureFlags = {
  qiCoreElementsTab: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  stu6TestCaseValidation: false,
  MeasureSearch: false,
  LibrarySearch: false,
  Locking: false,
  qiCore7: false,
  TransferMeasure: false,
  TransferLibrary: false,
  MeasureHistory: false,
  Calculator: false,
  LibraryHistory: false,
  CompareLibraryVersions: false,
  CompareMeasureVersions: false,
  ExecutionConfigurationTab: false,
  QICoreCompositeMeasure: false,
  DisplayOwner: false,
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
