import useOktaTokens from "../hooks/useOktaTokens";
import { Measure } from "@madie/madie-models/dist/Measure";

const CheckUserCanEdit = (measure: Measure): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  return (
    measure?.createdBy?.toLowerCase() === userName?.toLowerCase() ||
    measure?.acls?.some(
      (acl) =>
        acl.userId?.toLowerCase() === userName?.toLowerCase() &&
        acl.roles?.indexOf("SHARED_WITH") >= 0
    )
  );
};

export default CheckUserCanEdit;
