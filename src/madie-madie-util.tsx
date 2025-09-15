/*
  This is our index.
  We need to register and export anything we want our spa suite to have access to
  rxjs here can track state and deliver it across multipe apps listening to the same instance.
  if we want other apps to use functions defined here, we need to
    update types file with expected values in each app consuming
*/
import useServiceConfig from "./api/useServiceConfig";
import { getOktaConfig } from "./Config/Config";
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
import { default as useTerminologyServiceApi } from "./api/useTerminologyServiceApi";
import { default as useMeasureServiceApi } from "./api/useMeasureServiceApi";
import { default as useCqlLibraryServiceApi } from "./api/useCqlLibraryServiceApi";
import { default as useOrganizationApi } from "./api/useOrganizationApi";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { default as checkUserCanEdit } from "./util/useCheckCanEdit";
import { default as checkUserCanDelete } from "./util/useCheckCanDelete";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { getOidFromString } from "./util/terminologyUtils";
import axios from "./api/axios-instance";

export {
  useServiceConfig,
  getOktaConfig,
  ServiceContext,
  useKeyPress,
  useOktaTokens,
  useOnClickOutside,
  measureStore,
  cqlLibraryStore,
  routeHandlerStore,
  featureFlagsStore,
  useTerminologyServiceApi,
  useMeasureServiceApi,
  useCqlLibraryServiceApi,
  useOrganizationApi,
  useDocumentTitle,
  checkUserCanEdit,
  checkUserCanDelete,
  useFeatureFlags,
  getOidFromString,
  wafIntercept,
  axios,
  ApiContextConsumer,
  ApiContextProvider,
  OktaConfig,
};
