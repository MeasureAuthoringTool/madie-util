import React from "react";
import { BehaviorSubject } from "rxjs";
import { UserDetails } from "@madie/madie-models";

const subject = new BehaviorSubject<UserDetails | null>(null);
const initialState: null = null;
let state: UserDetails | null = initialState;

export const adminUserStore = {
  subscribe: (
    setUserState: React.Dispatch<React.SetStateAction<UserDetails | null>>
  ) => subject.subscribe((value) => setUserState(value)),
  updateUser: (user: UserDetails | null) => {
    state = user;
    subject.next(state);
  },
  initialState,
  state,
};
