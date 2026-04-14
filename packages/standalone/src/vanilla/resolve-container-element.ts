/**
 * Resolves the vanilla widget mount node. String `container` must be an id selector (`#my-root`);
 * we use {@link Document.getElementById} instead of `querySelector` so the value is treated as an
 * id token, not arbitrary selector/HTML text.
 */
const ID_SELECTOR = /^#[^#\s]+$/;

export function resolveContainerElement(
  container: string | HTMLElement,
): HTMLElement | null {
  if (typeof container !== "string") {
    return container;
  }
  if (!ID_SELECTOR.test(container)) {
    throw new Error(
      'SiteSearch: container must be an HTMLElement or an id selector (e.g. "#search-root").',
    );
  }
  return document.getElementById(container.slice(1));
}
