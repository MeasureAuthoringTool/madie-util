import useOktaTokens from "../hooks/useOktaTokens";
import { Acl } from "@madie/madie-models/dist/Measure";

const useCheckUserCanEdit = (createdBy: string, acls: Array<Acl>): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

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
