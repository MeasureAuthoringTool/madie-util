import React from "react";
import { BehaviorSubject } from "rxjs";
import { Measure } from "@madie/madie-models/dist/Measure";
import { TestCase } from "@madie/madie-models";

// immutable object that retains state, tracks updates
const subject = new BehaviorSubject<Measure | null>(null);
// initial value just for initialization.
const initialState: null = null;
// this will be the references that updates events are emitted against.
let state: Measure | null = initialState;
// expose everything.
export const measureStore = {
  // setMeasureState can be swapped with hook setters to auto do update (listen)
  subscribe: (setMeasureState: React.Dispatch<React.SetStateAction<Measure>>) =>
    subject.subscribe((state) => setMeasureState(state)),
  // updateMeasure is mapped to an updating state function
  updateMeasure: (measure: Measure | null) => {
    state = Object.assign({}, measure);
    subject.next(state);
  },
  updateTestCases: (testCases: TestCase[] | null) => {
    state = { ...state, testCases };
    subject.next(state);
  },
  initialState,
  state,
};
