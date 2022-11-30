import { MarkdownPostProcessorContext } from "obsidian";
import { exec } from "child_process";
import debounce from "lodash.debounce";

import D2Plugin from "./main";

export class D2Processor {
	plugin: D2Plugin;
	debouncedMap: Map<
		string,
		(
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => Promise<void>
	>;
	prevImage: string;

	constructor(plugin: D2Plugin) {
		this.plugin = plugin;
		this.debouncedMap = new Map();
	}

	attemptExport = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		el.createEl("h6", {
			text: "Generating D2 diagram...",
			cls: "D2__Loading",
		});
		let debouncedFunc = this.debouncedMap.get(ctx.docId);
		if (!debouncedFunc) {
			debouncedFunc = debounce(
				this.export,
				this.plugin.settings.debounce,
				{
					leading: true,
					trailing: true,
				}
			);
			this.debouncedMap.set(ctx.docId, debouncedFunc);
		}
		await debouncedFunc?.(source, el, ctx);
	};

	insertImage(
		image: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const parser = new DOMParser();
		const svg = parser.parseFromString(image, "image/svg+xml");
		const svgEl = svg.documentElement;

		// Have svg image be contained within the obsidian window
		svgEl.setAttribute("preserveAspectRatio", "xMinYMin slice");
		svgEl.removeAttribute("width");
		svgEl.removeAttribute("height");

		// append docId to <marker> id's so that they're unique across different panels & edit/view mode
		const markers = svgEl.querySelectorAll("marker");
		const markerIDs: string[] = [];
		markers.forEach((marker) => {
			const id = marker.getAttribute("id");
			if (id) {
				markerIDs.push(id);
			}
		});
		const html = markerIDs.reduce((svgHTML, markerID) => {
			return svgHTML.replaceAll(
				markerID,
				[markerID, ctx.docId].join("-")
			);
		}, svgEl.outerHTML);

		el.insertAdjacentHTML("beforeend", html);
	}

	export = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		try {
			const image = await this.generatePreview(source);
			if (image) {
				el.empty();
				this.prevImage = image;
				this.insertImage(image, el, ctx);
			}
		} catch (err) {
			el.empty();
			const errorEl = el.createEl("pre", {
				cls: "markdown-rendered pre Preview__Error",
			});
			errorEl.createEl("code", {
				text: "D2 Compilation Error:",
				cls: "Preview__Error--Title",
			});
			errorEl.createEl("code", {
				text: err.message,
			});
			if (this.prevImage) {
				this.insertImage(this.prevImage, el, ctx);
			}
		}
	};

	async generatePreview(source: string): Promise<string> {
		const options: any = {
			encoding: "utf-8",
			env: {
				...process.env,
				PATH: [
					process.env.PATH,
					`${process.env.HOME}/go/bin`,
					"/opt/homebrew/bin",
				].join(":"),
			},
		};

		if (this.plugin.settings.apiToken) {
			options.env.TSTRUCT_TOKEN = this.plugin.settings.apiToken;
		}

		let args = [`d2`, "-", "-", "--theme", this.plugin.settings.theme];
		if (this.plugin.settings.layoutEngine.toLowerCase() === "tala") {
			args.unshift("D2_LAYOUT=tala");
		} else {
			args = args.concat(["--layout", this.plugin.settings.layoutEngine]);
		}
		const cmd = args.join(" ");
		const child = exec(cmd, options);
		child.stdin?.write(source);
		child.stdin?.end();

		let stdout: any;
		let stderr: any;

		if (child.stdout) {
			child.stdout.on("data", (data) => {
				if (stdout === undefined) {
					stdout = data;
				} else {
					stdout += data;
				}
			});
		}

		if (child.stderr) {
			child.stderr.on("data", (data) => {
				if (stderr === undefined) {
					stderr = data;
				} else {
					stderr += data;
				}
			});
		}

		return new Promise((resolve, reject) => {
			child.on("error", reject);
			child.on("close", (code: number) => {
				if (code === 0) {
					resolve(stdout);
					return;
				} else if (stderr) {
					console.error(stderr);
					reject(new Error(stderr));
				} else if (stdout) {
					console.error(stdout);
					reject(new Error(stdout));
				}
			});
		});
	}
}
