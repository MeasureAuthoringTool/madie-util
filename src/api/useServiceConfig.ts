import React, { useContext } from "react";
import { ServiceContext, ServiceConfig } from "./ServiceContext";

// Default config if no context is provided
export default function useServiceConfig(): ServiceConfig {
  return useContext(ServiceContext);
}
