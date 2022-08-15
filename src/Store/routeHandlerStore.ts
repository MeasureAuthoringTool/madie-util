import React from "react";
import { BehaviorSubject } from "rxjs";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<object>({
  canTravel: true,
  pendingRoute: "",
});
// initial value just for initialization.
const initialState: object = {
  canTravel: true,
  pendingRoute: "",
};
// this will be the references that updates events are emitted against.
let state: object = initialState;
// expose everything.
export const routeHandlerStore = {
  // setMeasureState can be swapped with hook setters to auto do update (listen)
  subscribe: (
    setRouteHandlerState: React.Dispatch<React.SetStateAction<object>>
  ) => subject.subscribe((state) => setRouteHandlerState(state)),
  // updateMeasure is mapped to an updating state function
  updateRouteHandlerState: (routeHandlerState: object) => {
    state = Object.assign({}, routeHandlerState);
    subject.next(routeHandlerState);
  },
  initialState,
  state,
};

/*
We need to retain
route: string
formDirty: bool. Single object?
Can travel

*/
