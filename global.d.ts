import { MarkdownPostProcessorContext } from "obsidian";

declare global {
	interface Processor {
		export: (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => Promise<void>;
	}
}

export {};
