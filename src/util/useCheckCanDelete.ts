import useOktaTokens from "../hooks/useOktaTokens";

const useCheckUserCanDelete = (
  user: string,
  draft: boolean = true
): boolean => {
  const { getUserName } = useOktaTokens();
  const loggedInUser = getUserName();
  // versioned measures/libraries can never be deleted.
  if (!draft) {
    return false;
  }

  return user?.toLowerCase() === loggedInUser?.toLowerCase();
};

export default useCheckUserCanDelete;
