import { h, render } from "preact";
import SearchWithAskAI, {
  type SearchWithAskAIConfig,
} from "../components/search-askai";
import { resolveContainerElement } from "./resolve-container-element";

type InitOptions = SearchWithAskAIConfig & { container: string | HTMLElement };
const instances = new Map<HTMLElement, true>();

export function init({ container, ...config }: InitOptions): void {
  const containerElement = resolveContainerElement(container);
  if (!containerElement) {
    throw new Error("Container not found");
  }
  render(h(SearchWithAskAI, { ...config }), containerElement);
  instances.set(containerElement, true);
}

export function destroy(container: string | HTMLElement): void {
  const containerElement = resolveContainerElement(container);
  if (!containerElement) return;
  render(null, containerElement);
  instances.delete(containerElement);
}

export default { init, destroy };
