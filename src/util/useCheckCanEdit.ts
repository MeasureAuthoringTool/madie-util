import useOktaTokens from "../hooks/useOktaTokens";
import { Acl } from "@madie/madie-models/dist/Measure";

const useCheckUserCanEdit = (
  createdBy: string,
  acls: Array<Acl>,
  version: string = "0.0.000"
): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  // versioned measures are always uneditable.
  if (version !== "0.0.000") {
    return false;
  }

  return (
    createdBy?.toLowerCase() === userName?.toLowerCase() ||
    acls?.some(
      (acl) =>
        acl.userId?.toLowerCase() === userName?.toLowerCase() &&
        acl.roles?.indexOf("SHARED_WITH") >= 0
    )
  );
};

export default useCheckUserCanEdit;
