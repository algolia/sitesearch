/**
 * Resolves the vanilla widget mount node.
 *
 * - `HTMLElement` is returned as-is.
 * - Simple id strings (`#my-root`) use {@link Document.getElementById} (id token, not selector parsing).
 * - Any other string is passed to {@link Document.querySelector} for backwards compatibility with
 *   releases that accepted arbitrary CSS selectors (e.g. `.search-root`, `[data-sitesearch]`).
 */
const ID_SELECTOR = /^#[^#\s]+$/;

export function resolveContainerElement(
  container: string | HTMLElement,
): HTMLElement | null {
  if (typeof container !== "string") {
    return container;
  }
  if (ID_SELECTOR.test(container)) {
    return document.getElementById(container.slice(1));
  }
  return document.querySelector(container) as HTMLElement | null;
}
