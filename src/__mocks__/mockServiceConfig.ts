import { ServiceConfig } from "../api/ServiceContext";

export const mockServiceConfig: ServiceConfig = {
  qdmElmTranslationService: {
    baseUrl: "qdm-elm-translator.com",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-elm-translator.com",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
  cqlLibraryService: {
    baseUrl: "library-service.com",
  },
  measureService: {
    baseUrl: "measure-service.com",
  },
};
