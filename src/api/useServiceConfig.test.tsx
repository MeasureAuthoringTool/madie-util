import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import useServiceConfig from "./useServiceConfig";
import { ServiceContext } from "./ServiceContext";
import { mockServiceConfig } from "../__mocks__/mockServiceConfig";

describe("useServiceConfig", () => {
  it("returns the value from ServiceContext provider", () => {
    const wrapper = ({ children }) => (
      <ServiceContext.Provider value={mockServiceConfig}>
        {children}
      </ServiceContext.Provider>
    );
    const { result } = renderHook(() => useServiceConfig(), { wrapper });
    expect(result.current).toEqual(mockServiceConfig);
  });

  it("returns null if no provider is used", () => {
    const { result } = renderHook(() => useServiceConfig());
    expect(result.current).toBeNull();
  });
});
