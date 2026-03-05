import { useFeatureFlags } from "./useFeatureFlags";
import { useUserRoles } from "./useUserRoles";

/**
 * Custom hook to check if admin transfer functionality is enabled for the current user.
 * Returns true if the AdminTransferMeasure feature flag is enabled AND the user has admin role.
 */
export function useIsAdminTransferEnabled(): boolean {
  const featureFlags = useFeatureFlags();
  const userRoles = useUserRoles();

  return Boolean(featureFlags?.AdminTransferMeasure && userRoles?.isAdmin);
}
