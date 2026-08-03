import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<FeatureFlags | null>(null);
export interface FeatureFlags {
  qdmHideJson: boolean;
  enableQdmRepeatTransfer: boolean;
  qiCore7: boolean;
  QICoreCompositeMeasure: boolean;
  AdminUserList: boolean;
  AdminUserProfile: boolean;
  usQualityCore?: boolean;
  MeasureReviewStatus?: boolean;
  LibraryReviewStatus?: boolean;
}
const initialState: FeatureFlags = {
  qdmHideJson: true,
  enableQdmRepeatTransfer: false,
  qiCore7: false,
  QICoreCompositeMeasure: true,
  AdminUserList: true,
  AdminUserProfile: true,
  usQualityCore: false,
  MeasureReviewStatus: true,
  LibraryReviewStatus: true,
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
