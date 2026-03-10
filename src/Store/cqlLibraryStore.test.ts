import { cqlLibraryStore } from "./cqlLibraryStore";
import { CqlLibrary } from "@madie/madie-models";
import { Subscription } from "rxjs";

describe("cqlLibraryStore", () => {
  it("returns initial state as null", () => {
    expect(cqlLibraryStore.initialState).toBeNull();
    expect(cqlLibraryStore.state).toBeNull();
  });

  it("updates library and notifies subscribers", () => {
    const mockLibrary: CqlLibrary = {
      id: "lib1",
      cqlLibraryName: "Test Library",
      // add other required properties as needed
    } as CqlLibrary;
    let received: CqlLibrary | null = null;
    const subscription: Subscription = cqlLibraryStore.subscribe((state) => {
      received = typeof state === "function" ? state(received) : state;
    });
    cqlLibraryStore.updateLibrary(mockLibrary);
    expect(received).toEqual(mockLibrary);
    subscription.unsubscribe();
  });

  it("can unsubscribe from updates", () => {
    const mockLibrary: CqlLibrary = {
      id: "lib2",
      cqlLibraryName: "Another Library",
    } as CqlLibrary;
    let received: CqlLibrary | null = null;
    const subscription: Subscription = cqlLibraryStore.subscribe((state) => {
      received = typeof state === "function" ? state(received) : state;
    });
    subscription.unsubscribe();
    cqlLibraryStore.updateLibrary(mockLibrary);
    // Should not update received after unsubscribe
    expect(received).not.toEqual(mockLibrary);
  });
});
