export interface HitsAttributesMapping {
  /** Attribute path (supports dotted path) for the primary line of text */
  primaryText: string;
  /** Attribute path (supports dotted path) for the secondary line of text */
  secondaryText?: string;
  /** Attribute path (supports dotted path) for an optional tertiary line */
  tertiaryText?: string;
  /** Attribute path (supports dotted path) for the URL */
  url?: string;
  /** Attribute path (supports dotted path) for an optional image URL */
  image?: string;
}

/** Convert a dotted string path into an array path accepted by react-instantsearch components */
export function toAttributePath(attribute: undefined): undefined;
export function toAttributePath(attribute: string): string | string[];
export function toAttributePath(
  attribute?: string,
): string | string[] | undefined {
  if (!attribute) return undefined;
  return attribute.includes(".") ? attribute.split(".") : attribute;
}

/** Safely read a nested value from an object using a dotted path */
export function getByPath<T = unknown>(
  obj: unknown,
  path: string | undefined,
): T | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    const record = current as Record<string, unknown>;
    current = record[part];
  }
  return current as T | undefined;
}

export type SearchHit = Record<string, unknown>;
