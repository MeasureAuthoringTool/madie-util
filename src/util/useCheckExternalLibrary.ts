import { LibraryListDTO } from "@madie/madie-models";

const useCheckExternalLibrary = (libraries: Array<LibraryListDTO>): boolean => {
  if (!libraries || libraries.length === 0) {
    return false;
  }
  return libraries.some((library) => library.externalLibrary === true);
};

export default useCheckExternalLibrary;
