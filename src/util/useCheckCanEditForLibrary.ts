import useOktaTokens from "../hooks/useOktaTokens";
import { Measure } from "@madie/madie-models/dist/Measure";
import { CqlLibrary } from "@madie/madie-models";

const useCheckCanEditForLibrary = (library: CqlLibrary): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  return library?.createdBy?.toLowerCase() === userName?.toLowerCase();
};

export default useCheckCanEditForLibrary;
