import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qiCoreElementsTab: boolean;
  qdmHideJson: boolean;
  enableQdmRepeatTransfer: boolean;
  Locking: boolean;
  qiCore7: boolean;
  CompareLibraryVersions: boolean;
  CompareMeasureVersions: boolean;
  QICoreCompositeMeasure: boolean;
  DisplayOwner: boolean;
  MakeJSONMatchUI: boolean;
  AdminTransferMeasures: boolean;
}
const initialState: FeatureFlags = {
  qiCoreElementsTab: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  Locking: false,
  qiCore7: false,
  CompareLibraryVersions: false,
  CompareMeasureVersions: false,
  QICoreCompositeMeasure: false,
  DisplayOwner: false,
  MakeJSONMatchUI: false,
  AdminTransferMeasures: false,
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
