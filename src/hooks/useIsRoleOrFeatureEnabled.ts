import { useFeatureFlags } from "./useFeatureFlags";
import { useUserRoles } from "./useUserRoles";

export enum FeatureFlagsEnum {
  QI_CORE_ELEMENTS_TAB = "qiCoreElementsTab",
  QDM_HIDE_JSON = "qdmHideJson",
  ENABLE_QDM_REPEAT_TRANSFER = "enableQdmRepeatTransfer",
  QI_CORE_7 = "qiCore7",
  QI_CORE_COMPOSITE_MEASURE = "QICoreCompositeMeasure",
  ADMIN_TRANSFER_MEASURE = "AdminTransferMeasure",
  ADMIN_TRANSFER_LIBRARY = "AdminTransferLibrary",
  ADMIN_SHARE_LIBRARY = "AdminShareLibrary",
  ADMIN_USER_LIST = "AdminUserList",
}

/**
 * Custom hook to check if admin role and/or feature flag is enabled for the current user.
 * This should serve as a central point to manage feature access control.
 */
export function useIsRoleOrFeatureEnabled(feature: string): boolean {
  const featureFlags = useFeatureFlags();
  const userRoles = useUserRoles();

  if (feature === FeatureFlagsEnum.QI_CORE_ELEMENTS_TAB) {
    return featureFlags?.qiCoreElementsTab;
  } else if (feature === FeatureFlagsEnum.QDM_HIDE_JSON) {
    return featureFlags?.qdmHideJson;
  } else if (feature === FeatureFlagsEnum.ENABLE_QDM_REPEAT_TRANSFER) {
    return featureFlags?.enableQdmRepeatTransfer;
  } else if (feature === FeatureFlagsEnum.QI_CORE_7) {
    return featureFlags?.qiCore7;
  } else if (feature === FeatureFlagsEnum.QI_CORE_COMPOSITE_MEASURE) {
    return featureFlags?.QICoreCompositeMeasure;
  } else if (feature === FeatureFlagsEnum.ADMIN_TRANSFER_MEASURE) {
    return Boolean(featureFlags?.AdminTransferMeasure && userRoles?.isAdmin);
  } else if (feature === FeatureFlagsEnum.ADMIN_TRANSFER_LIBRARY) {
    return Boolean(featureFlags?.AdminTransferLibrary && userRoles?.isAdmin);
  } else if (feature === FeatureFlagsEnum.ADMIN_SHARE_LIBRARY) {
    return Boolean(featureFlags?.AdminShareLibrary && userRoles?.isAdmin);
  } else if (feature === FeatureFlagsEnum.ADMIN_USER_LIST) {
    return Boolean(featureFlags?.AdminUserList && userRoles?.isAdmin);
  }
  return false;
}
