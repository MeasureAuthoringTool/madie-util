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
  testCaseService?: {
    baseUrl: string;
  };
  excelExportService?: {
    baseUrl: string;
  };
  fhirService?: {
    baseUrl: string;
  };
  userService?: {
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
    qiCoreElementsTab?: boolean;
    qdmHideJson?: boolean;
    enableQdmRepeatTransfer?: boolean;
    EnhancedTextFormatting?: boolean;
    qiCore7?: boolean;
    QICoreCompositeMeasure?: boolean;
    AdminTransferMeasures?: boolean;
  };
}

export const ServiceContext = createContext<ServiceConfig | null>(null);

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
