import DOMPurify from "dompurify";

/**
 * Sanitises user-controlled text before it is displayed.
 *
 * ProjectForge currently displays descriptions, bios, notes and
 * moderation reasons as plain text, so HTML tags are not required.
 * Removing tags also prevents scripts or event handlers from being
 * stored and displayed as executable content.
 */
export function sanitizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}