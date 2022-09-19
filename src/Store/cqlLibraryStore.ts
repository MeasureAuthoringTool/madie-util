import React from "react";
import { BehaviorSubject } from "rxjs";
import { CqlLibrary } from "@madie/madie-models";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<CqlLibrary | null>(null);
const initialState: null = null;
let state: CqlLibrary | null = initialState;

export const cqlLibraryStore = {
  subscribe: (
    setLibraryState: React.Dispatch<React.SetStateAction<CqlLibrary>>
  ) => subject.subscribe((state) => setLibraryState(state)),
  updateLibrary: (cqlLibrary: CqlLibrary | null) => {
    state = Object.assign({}, cqlLibrary);
    subject.next(state);
  },
  initialState,
  state,
};
