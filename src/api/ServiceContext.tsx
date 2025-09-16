import { createContext } from "react";

export type OktaConfig = {
  baseUrl: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  useClassicEngine: boolean;
};

export interface ServiceConfig {
  qdmElmTranslationService?: {
    baseUrl: string;
  };
  fhirElmTranslationService?: {
    baseUrl: string;
  };
  terminologyService?: {
    baseUrl: string;
  };
  cqlLibraryService?: {
    baseUrl: string;
  };
  measureService: {
    baseUrl: string;
  };
  elmTranslationService?: {
    baseUrl: string;
  };
  loggingService?: {
    baseUrl: string;
  };
  okta?: {
    baseUrl: string;
    issuer: string;
    clientId: string;
    redirectUri: string;
  };
  madieVersion?: string;
  features?: {
    export?: boolean;
    qdmToFhirConversion?: boolean;
  };
}

export const ServiceContext = createContext<ServiceConfig>(null);

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
