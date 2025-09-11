import * as React from "react";
import { getServiceConfig } from "./Config";
import { ServiceConfig } from "../api/ServiceContext";
import axios from "../api/axios-instance";

jest.mock("../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Service Config Utility", () => {
  it("should retrieve the service configuration info", () => {
    expect.assertions(1);
    const config: ServiceConfig = {
      measureService: {
        baseUrl: "url",
      },
      elmTranslationService: {
        baseUrl: "url",
      },
      terminologyService: {
        baseUrl: "url",
      },
      madieVersion: "1.0.3",
      features: { export: true },
    };
    const resp = { data: config };
    mockedAxios.get.mockResolvedValue(resp);
    getServiceConfig().then((result) => expect(result).toEqual(config));
  });

  it("should error if the config is inaccessible", async () => {
    expect.assertions(1);
    const resp = { data: {} };
    mockedAxios.get.mockResolvedValue(resp);
    try {
      await getServiceConfig();
    } catch (err) {
      expect(err.message).toBe("Invalid Service Config");
    }
  });
});
