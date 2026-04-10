import { h, render } from "preact";
import SidepanelAskAIExperience, {
  type SidepanelAskAIConfig,
} from "../components/sidepanel-askai";
import { resolveContainerElement } from "./resolve-container-element";

type InitOptions = SidepanelAskAIConfig & { container: string | HTMLElement };

export function init({ container, ...config }: InitOptions): void {
  const containerElement = resolveContainerElement(container);
  if (!containerElement) {
    throw new Error("Container not found");
  }
  render(h(SidepanelAskAIExperience, { ...config }), containerElement);
}

export function destroy(container: string | HTMLElement): void {
  const containerElement = resolveContainerElement(container);
  if (!containerElement) return;
  render(null, containerElement);
}

export default { init, destroy };
