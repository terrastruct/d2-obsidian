import { debounce, Debouncer, MarkdownPostProcessorContext } from "obsidian";
import { v4 as uuidv4 } from "uuid";

import { D2Processor } from "./processor";

import D2Plugin from "./main";

const SECONDS_MS = 1000;
export class DebouncedProcessors implements Processor {
	debounceMap = new Map<
		string,
		Debouncer<
			[string, HTMLElement, MarkdownPostProcessorContext],
			Promise<void>
		>
	>();

	debounceTime: number;
	plugin: D2Plugin;

	constructor(plugin: D2Plugin) {
		this.plugin = plugin;
		this.debounceTime = plugin.settings.debounce * SECONDS_MS;
	}

	getProcessor(): Processor {
		return new D2Processor(this.plugin);
	}

	export = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		await this.processor(source, el, ctx, this.getProcessor().export);
	};

	processor = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		processor: (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => Promise<void>
	) => {
		el.createEl("h6", {
			text: "Generating D2 diagram...",
			cls: "D2__Loading",
		});

		if (el.dataset.D2Debounce) {
			const debounceId = el.dataset.D2Debounce;
			if (this.debounceMap.has(debounceId)) {
				await this.debounceMap.get(debounceId)?.(source, el, ctx);
			}
		} else {
			const func = debounce(processor, this.debounceTime, true);
			const uuid = uuidv4();
			el.dataset.D2Debouce = uuid;
			this.debounceMap.set(uuid, func);
			await processor(source, el, ctx);
		}
	};
}
