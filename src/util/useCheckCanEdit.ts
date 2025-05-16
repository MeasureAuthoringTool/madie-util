import useOktaTokens from "../hooks/useOktaTokens";
import { Acl } from "@madie/madie-models/dist/Measure";

const useCheckUserCanEdit = (
  createdBy: string,
  acls: Array<Acl>,
  draft: boolean = true,
  editTestsOnVersionedMeasures?: boolean
): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  if (!draft && !editTestsOnVersionedMeasures) {
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
