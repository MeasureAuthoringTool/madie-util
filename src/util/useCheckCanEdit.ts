import useOktaTokens from "../hooks/useOktaTokens";
import { Acl } from "@madie/madie-models/dist/Measure";
import { hasEditAccess } from "./accessControl";

const useCheckUserCanEdit = (
  createdBy: string,
  acls: Array<Acl>,
  draft: boolean = true
): boolean => {
  const { getUserName } = useOktaTokens();

  if (!draft) {
    return false;
  }
  return hasEditAccess(getUserName(), createdBy, acls);
};

export default useCheckUserCanEdit;
