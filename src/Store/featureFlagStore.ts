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
  ShareMeasure: boolean;
  TestCaseListActionCenter: boolean;
  CopyTestCases: boolean;
  LibraryListCheckboxes: boolean;
  LibraryListButtons: boolean;
  QICoreIncludeSDEValues: boolean;
  MeasureSearch: boolean;
  ShareLibrary: boolean;
  QICoreManifestExpansion: boolean;
  QICoreMeasureReferences: boolean;
}
const initialState: FeatureFlags = {
  qiCoreElementsTab: false,
  qiCoreBonnieTestCases: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  stu6TestCaseValidation: false,
  ShareMeasure: false,
  TestCaseListActionCenter: false,
  CopyTestCases: false,
  LibraryListCheckboxes: false,
  LibraryListButtons: false,
  QICoreIncludeSDEValues: false,
  QICoreMeasureReferences: false,
  MeasureSearch: false,
  ShareLibrary: false,
  QICoreManifestExpansion: false,
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
