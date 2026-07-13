import { useEffect, useState } from "react";
import { UserDetails } from "@madie/madie-models";
import useUserServiceApi from "../api/useUserServiceApi";

// Builds the "First Last" display name from a user's details, falling back to
// the provided value (e.g. the harpId) when no first/last name is available.
export const getUserDisplayName = (
  userDetails: UserDetails,
  fallback: string
): string => {
  const names = [userDetails?.firstName, userDetails?.lastName]
    .map((name) => name?.trim())
    .filter(Boolean);
  return names.length ? names.join(" ") : fallback;
};

const useOwnerName = (harpId: string): string => {
  const userServiceApi = useUserServiceApi();
  const [displayName, setDisplayName] = useState<string>(harpId);

  useEffect(() => {
    if (harpId) {
      userServiceApi
        .getOwnerDetails(harpId)
        .then((userDetails) => {
          setDisplayName(getUserDisplayName(userDetails, harpId));
        })
        .catch(() => {
          setDisplayName(harpId);
        });
    }
  }, [harpId]);

  return displayName;
};

export default useOwnerName;
