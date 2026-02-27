import React from "react";
import { BehaviorSubject } from "rxjs";

export interface UserRoles {
  roles: string[];
  isAdmin: boolean;
}

const STORAGE_KEY = "madie-user-roles";

// Try to restore roles from localStorage
export const getStoredRoles = (): UserRoles | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (e) {
    console.error("[userRolesStore] Error reading from localStorage:", e);
  }
  return null;
};

// immutable object that retains state, tracks updates
const storedRoles = getStoredRoles();
const subject = new BehaviorSubject<UserRoles | null>(storedRoles);

const initialState: UserRoles = {
  roles: [],
  isAdmin: false,
};

let state: UserRoles = storedRoles ?? initialState;

const ADMIN_ROLE = "MADiE-Admin";

const checkIsAdmin = (roles: string[]): boolean => {
  return roles?.includes(ADMIN_ROLE) ?? false;
};

export const userRolesStore = {
  subscribe: (
    setUserRoles: React.Dispatch<React.SetStateAction<UserRoles>>
  ) => {
    return subject.subscribe((state) => {
      setUserRoles(state);
    });
  },
  updateUserRoles: (roles: string[] | null) => {
    const rolesList = roles ?? [];
    const isAdmin = checkIsAdmin(rolesList);
    state = {
      roles: rolesList,
      isAdmin: isAdmin,
    };

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("[userRolesStore] Error saving to localStorage:", e);
    }

    subject.next(state);
  },
  clearRoles: () => {
    state = initialState;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[userRolesStore] Error clearing localStorage:", e);
    }
    subject.next(state);
  },
  initialState,
  getState: () => state,
};
