import useOktaTokens from "../hooks/useOktaTokens";
import { Acl } from "@madie/madie-models/dist/Measure";

const useCheckUserCanEdit = (createdBy: string, acls: Array<Acl>): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  // Always allow editing if user is owner or has shared access
  // (EditTestsOnVersionedMeasures feature flag removed - always enabled)
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
