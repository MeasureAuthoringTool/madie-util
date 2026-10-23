import DOMPurify from "dompurify";

// Sanitizes markup produced by the rich text editor before it is stored or
// rendered. Entities are left encoded: this is for HTML fields, not plain text.
export const sanitizeRichText = (input?: string): string =>
  input ? DOMPurify.sanitize(input) : "";

// True when the markup contains visible text, so an empty-looking editor
// value (e.g. "<p></p>") is treated as empty.
export const richTextHasContent = (input?: string): boolean =>
  (input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
