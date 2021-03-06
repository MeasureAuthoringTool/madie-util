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
import { default as useTerminologyServiceApi } from "./api/useTerminologyServiceApi";

export {
  getServiceConfig,
  useKeyPress,
  useOktaTokens,
  useOnClickOutside,
  measureStore,
  useTerminologyServiceApi,
};
