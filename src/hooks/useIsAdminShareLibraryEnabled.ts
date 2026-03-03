import { useFeatureFlags } from "./useFeatureFlags";
import { useUserRoles } from "./useUserRoles";

/**
 * Custom hook to check if admin share library functionality is enabled for the current user.
 * Returns true if the AdminShareLibrary feature flag is enabled AND the user has admin role.
 */
export function useIsAdminShareLibraryEnabled(): boolean {
  const featureFlags = useFeatureFlags();
  const userRoles = useUserRoles();

  return Boolean(featureFlags?.AdminShareLibrary && userRoles?.isAdmin);
}
