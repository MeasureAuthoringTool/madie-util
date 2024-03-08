import useOktaTokens from "../hooks/useOktaTokens";

const useCheckUserCanDelete = (
  createdBy: string,
  draft: boolean = true
): boolean => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  // versioned measures/libraries can never be deleted.
  if (!draft) {
    return false;
  }

  return createdBy?.toLowerCase() === userName?.toLowerCase();
};

export default useCheckUserCanDelete;
