import DOMPurify from "dompurify";

export const sanitizeRichText = (input?: string): string =>
  input ? DOMPurify.sanitize(input) : "";

export const richTextHasContent = (input?: string): boolean =>
  (input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
