/*
  This is our index.
  We need to register and export anything we want our spa suite to have access to
  rxjs here can track state and deliver it across multipe apps listening to the same instance.
  if we want other apps to use functions defined here, we need to
    update types file with expected values in each app consuming
*/
import useServiceConfig from "./api/useServiceConfig";
import { getOktaConfig, getServiceConfig } from "./Config/Config";
import {
  ServiceContext,
  ApiContextConsumer,
  ApiContextProvider,
  type OktaConfig,
} from "./api/ServiceContext";

import { default as useKeyPress } from "./hooks/useKeyPress";
import { default as useOktaTokens } from "./hooks/useOktaTokens";
import { default as useOnClickOutside } from "./hooks/useOnClickOutside";
import wafIntercept from "./util/wafIntercept";
import { measureStore } from "./Store/measureStore";
import { cqlLibraryStore } from "./Store/cqlLibraryStore";
import { routeHandlerStore } from "./Store/routeHandlerStore";
import { featureFlagsStore } from "./Store/featureFlagStore";
import { userRolesStore } from "./Store/userRolesStore";
import { adminUserStore } from "./Store/adminUserStore";
import { default as useTerminologyServiceApi } from "./api/useTerminologyServiceApi";
import { default as useMeasureServiceApi } from "./api/useMeasureServiceApi";
import { default as useMeasureReviewServiceApi } from "./api/useMeasureReviewServiceApi";
import { default as useUserServiceApi } from "./api/useUserServiceApi";
import { default as useCqlLibraryServiceApi } from "./api/useCqlLibraryServiceApi";
import { default as useCqlLibraryReviewServiceApi } from "./api/useCqlLibraryReviewServiceApi";
import { default as useOrganizationApi } from "./api/useOrganizationApi";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { default as useOwnerName } from "./hooks/useOwnerName";
import { default as checkUserCanEdit } from "./util/useCheckCanEdit";
import { default as checkUserCanDelete } from "./util/useCheckCanDelete";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { useUserRoles } from "./hooks/useUserRoles";
import { getOidFromString } from "./util/terminologyUtils";
import { formatCmsId, padCmsId } from "./util/cmsIdFormatter";
import {
  validateCompositeMeasure,
  getAllowedScoringTypes,
  compositeScoringValues,
  COMPOSITE_VALIDATION_MESSAGES,
} from "./util/compositeMeasureValidation";
import axios from "./api/axios-instance";
import { useIsRoleOrFeatureEnabled } from "./hooks/useIsRoleOrFeatureEnabled";
import {
  ExportAction,
  ViewHRAction,
  HistoryAction,
  CompareVersionsAction,
  ExportDialog,
  ExportIcon,
  ViewHRModal,
  ViewMeasureHistoryDialog,
  CompareVersionsDialog,
  getNewestMeasureInstance,
  exportMeasure,
  downloadZipFile,
  generateTimestampedFileName,
  parseErrorMessageFromBlob,
  EXPORT_FAILURE_MESSAGE,
  ShareAction,
  ShareDialog,
  TransferAction,
  TransferDialog,
} from "./components/measureActions";
import {
  LibraryShareDialog,
  LibraryShareAction,
} from "./components/libraryActions";
import { ManageReviewDialog } from "./components/reviewActions";
export {
  useServiceConfig,
  getServiceConfig,
  getOktaConfig,
  ServiceContext,
  useKeyPress,
  useOktaTokens,
  useOnClickOutside,
  measureStore,
  cqlLibraryStore,
  routeHandlerStore,
  featureFlagsStore,
  userRolesStore,
  adminUserStore,
  useTerminologyServiceApi,
  useMeasureServiceApi,
  useMeasureReviewServiceApi,
  useUserServiceApi,
  useCqlLibraryServiceApi,
  useCqlLibraryReviewServiceApi,
  useOrganizationApi,
  useDocumentTitle,
  useOwnerName,
  checkUserCanEdit,
  checkUserCanDelete,
  useFeatureFlags,
  useUserRoles,
  getOidFromString,
  formatCmsId,
  padCmsId,
  wafIntercept,
  validateCompositeMeasure,
  getAllowedScoringTypes,
  compositeScoringValues,
  COMPOSITE_VALIDATION_MESSAGES,
  axios,
  ApiContextConsumer,
  ApiContextProvider,
  OktaConfig,
  useIsRoleOrFeatureEnabled,
  ExportAction,
  ViewHRAction,
  HistoryAction,
  CompareVersionsAction,
  ExportDialog,
  ExportIcon,
  ViewHRModal,
  ViewMeasureHistoryDialog,
  CompareVersionsDialog,
  LibraryShareAction,
  LibraryShareDialog,
  ManageReviewDialog,
  getNewestMeasureInstance,
  exportMeasure,
  downloadZipFile,
  generateTimestampedFileName,
  parseErrorMessageFromBlob,
  EXPORT_FAILURE_MESSAGE,
  ShareAction,
  ShareDialog,
  TransferAction,
  TransferDialog,
};
