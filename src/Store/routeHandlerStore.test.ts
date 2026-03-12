import { routeHandlerStore } from "./routeHandlerStore";
import { Subscription } from "rxjs";

describe("routeHandlerStore", () => {
  it("returns initial state", () => {
    expect(routeHandlerStore.initialState).toEqual({
      canTravel: true,
      pendingRoute: "",
    });
    expect(routeHandlerStore.state).toEqual({
      canTravel: true,
      pendingRoute: "",
    });
  });

  it("updates route handler state and notifies subscribers", () => {
    const newState = {
      canTravel: false,
      pendingRoute: "/next",
    };
    let received = null;
    const subscription: Subscription = routeHandlerStore.subscribe((state) => {
      received = state;
    });
    routeHandlerStore.updateRouteHandlerState(newState);
    expect(received).toEqual(newState);
    subscription.unsubscribe();
  });

  it("can unsubscribe from updates", () => {
    const newState = {
      canTravel: false,
      pendingRoute: "/other",
    };
    let received = null;
    const subscription: Subscription = routeHandlerStore.subscribe((state) => {
      received = state;
    });
    subscription.unsubscribe();
    routeHandlerStore.updateRouteHandlerState(newState);
    // Should not update received after unsubscribe
    expect(received).not.toEqual(newState);
  });
});
