import { useState, useEffect } from "react";
import { UserRoles, userRolesStore } from "../Store/userRolesStore";

export function useUserRoles(): UserRoles {
  const [userRoles, setUserRoles] = useState<UserRoles>(
    userRolesStore.getState()
  );

  useEffect(() => {
    const subscription = userRolesStore.subscribe(setUserRoles);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return userRoles;
}
