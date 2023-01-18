import React, { useContext } from "react";
import { ServiceConfig } from "../Config/Config";
import ServiceContext from "../context/ServiceContext";

export default function useServiceConfig(): ServiceConfig {
  return useContext(ServiceContext);
}
