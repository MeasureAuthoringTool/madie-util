import { createContext } from "react";
import { ServiceConfig } from "../Config/Config";

const ServiceContext = createContext<ServiceConfig>(null);

export default ServiceContext;

export const ApiContextProvider = ServiceContext.Provider;
export const ApiContextConsumer = ServiceContext.Consumer;
