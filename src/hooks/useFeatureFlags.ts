import { useState, useEffect } from "react";
import { FeatureFlags, featureFlagsStore } from "../Store/featureFlagStore";

export function useFeatureFlags(): FeatureFlags {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(
    featureFlagsStore.state
  );
  useEffect(() => {
    const subscription = featureFlagsStore.subscribe(setFeatureFlags);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return featureFlags;
}
