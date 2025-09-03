import { createContext } from "react";

export interface ServiceConfig {
  qdmElmTranslationService: {
    baseUrl: string;
  };
  fhirElmTranslationService: {
    baseUrl: string;
  };
  terminologyService: {
    baseUrl: string;
  };
  cqlLibraryService: {
    baseUrl: string;
  };
  measureService: {
    baseUrl: string;
  };
}

const ServiceContext = createContext<ServiceConfig>(null);

export default ServiceContext;

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
