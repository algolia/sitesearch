import { render } from "preact";
import { SiteSearchExperience } from "@algolia/sitesearch-react";
import "@algolia/sitesearch-react/dist/sitesearch.css";
import type { SiteSearchInitOptions } from "./types";

// Global API for vanilla JS usage
class SiteSearch {
	private static instances: Map<HTMLElement, any> = new Map();

	static init(options: SiteSearchInitOptions): void {
		const { container, ...config } = options;

		// Get container element
		const containerElement =
			typeof container === "string"
				? (document.querySelector(container) as HTMLElement)
				: container;

		if (!containerElement) {
			throw new Error(`Container not found: ${container}`);
		}

		// Clean up existing instance if any
		if (this.instances.has(containerElement)) {
			this.destroy(containerElement);
		}

		// Render the React component with Preact
		render(SiteSearchExperience(config), containerElement);

		// Store instance reference
		this.instances.set(containerElement, config);
	}

	static destroy(container: string | HTMLElement): void {
		const containerElement =
			typeof container === "string"
				? (document.querySelector(container) as HTMLElement)
				: container;

		if (!containerElement) return;

		// Unmount component
		render(null, containerElement);

		// Remove from instances
		this.instances.delete(containerElement);
	}

	static destroyAll(): void {
		this.instances.forEach((_, container) => {
			this.destroy(container);
		});
	}
}

// Make it available globally for CDN usage
if (typeof window !== "undefined") {
	(window as any).SiteSearch = SiteSearch;
}

export default SiteSearch;
export { SiteSearch };
export type { SiteSearchInitOptions };
