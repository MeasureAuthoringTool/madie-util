import { measureStore } from "./measureStore";
import { Measure, TestCase } from "@madie/madie-models";
import { Subscription } from "rxjs";

describe("measureStore", () => {
  it("returns initial state as null", () => {
    expect(measureStore.initialState).toBeNull();
    expect(measureStore.state).toBeNull();
  });

  it("updates measure and notifies subscribers", () => {
    const mockMeasure: Measure = {
      id: "m1",
      measureName: "Test Measure",
      cqlLibraryName: "TestLib",
      measureSetId: "set1",
      scoring: "Proportion",
      patientBasis: true,
      cql: "",
      testCases: [],
      version: "1.0.0",
      draft: false,
    } as unknown as Measure;
    let received: Measure | null = null;
    const subscription: Subscription = measureStore.subscribe((state) => {
      received = typeof state === "function" ? state(received) : state;
    });
    measureStore.updateMeasure(mockMeasure);
    expect(received).toEqual(mockMeasure);
    subscription.unsubscribe();
  });

  it("updates test cases and notifies subscribers", () => {
    const mockMeasure: Measure = {
      id: "m2",
      measureName: "Test Measure 2",
      cqlLibraryName: "TestLib2",
      measureSetId: "set2",
      scoring: "Ratio",
      patientBasis: false,
      cql: "",
      testCases: [],
      version: "2.0.0",
      draft: true,
    } as unknown as Measure;
    measureStore.updateMeasure(mockMeasure);
    let received: Measure | null = null;
    const subscription: Subscription = measureStore.subscribe((state) => {
      received = typeof state === "function" ? state(received) : state;
    });
    const testCases: TestCase[] = [
      { id: "tc1", title: "Test Case 1" } as TestCase,
    ];
    measureStore.updateTestCases(testCases);
    expect(received?.testCases).toEqual(testCases);
    subscription.unsubscribe();
  });

  it("can unsubscribe from updates", () => {
    const mockMeasure: Measure = {
      id: "m3",
      measureName: "Test Measure 3",
      cqlLibraryName: "TestLib3",
      measureSetId: "set3",
      scoring: "Continuous Variable",
      patientBasis: true,
      cql: "",
      testCases: [],
      version: "3.0.0",
      draft: false,
    } as unknown as Measure;
    let received: Measure | null = null;
    const subscription: Subscription = measureStore.subscribe((state) => {
      received = typeof state === "function" ? state(received) : state;
    });
    subscription.unsubscribe();
    measureStore.updateMeasure(mockMeasure);
    // Should not update received after unsubscribe
    expect(received).not.toEqual(mockMeasure);
  });
});
