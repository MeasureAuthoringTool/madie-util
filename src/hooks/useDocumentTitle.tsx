import { useRef, useEffect } from "react";

export function useDocumentTitle(title, prevailOnUnmount = false) {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(
    () => () => {
      if (!prevailOnUnmount) {
        document.title = defaultTitle.current;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty - cleanup should use prevailOnUnmount value from mount time
  );
}
