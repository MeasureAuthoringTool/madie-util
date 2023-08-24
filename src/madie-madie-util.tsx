/*
  This is our index.
  We need to register and export anything we want our spa suite to have access to
  rxjs here can track state and deliver it across multipe apps listening to the same instance.
  if we want other apps to use functions defined here, we need to
    update types file with expected values in each app consuming
*/
import { getServiceConfig } from "./Config/Config";
import { default as useKeyPress } from "./hooks/useKeyPress";
import { default as useOktaTokens } from "./hooks/useOktaTokens";
import { default as useOnClickOutside } from "./hooks/useOnClickOutside";
import { measureStore } from "./Store/measureStore";
import { cqlLibraryStore } from "./Store/cqlLibraryStore";
import { routeHandlerStore } from "./Store/routeHandlerStore";
import { featureFlagsStore } from "./Store/featureFlagStore";
import { default as useTerminologyServiceApi } from "./api/useTerminologyServiceApi";
import { default as useOrganizationApi } from "./api/useOrganizationApi";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { default as checkUserCanEdit } from "./util/useCheckCanEdit";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { getOidFromString } from "./util/terminologyUtils";

export {
  getServiceConfig,
  useKeyPress,
  useOktaTokens,
  useOnClickOutside,
  measureStore,
  cqlLibraryStore,
  routeHandlerStore,
  featureFlagsStore,
  useTerminologyServiceApi,
  useOrganizationApi,
  useDocumentTitle,
  checkUserCanEdit,
  useFeatureFlags,
  getOidFromString,
};
