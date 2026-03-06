import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qiCoreElementsTab: boolean;
  qdmHideJson: boolean;
  enableQdmRepeatTransfer: boolean;
  qiCore7: boolean;
  QICoreCompositeMeasure: boolean;
  AdminTransferMeasures: boolean;
  AdminShareMeasures: boolean;
  AdminTransferMeasure: boolean;
  AdminTransferLibrary: boolean;
}
const initialState: FeatureFlags = {
  qiCoreElementsTab: false,
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  qiCore7: false,
  QICoreCompositeMeasure: false,
  AdminTransferMeasures: false,
  AdminShareMeasures: false,
  AdminTransferMeasure: false,
  AdminTransferLibrary: false,
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
