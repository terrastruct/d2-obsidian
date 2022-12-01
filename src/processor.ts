import { MarkdownPostProcessorContext, ButtonComponent } from "obsidian";
import { exec, execSync } from "child_process";
import debounce from "lodash.debounce";

import D2Plugin from "./main";

export class D2Processor {
	plugin: D2Plugin;
	debouncedMap: Map<
		string,
		(
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext,
			signal: AbortSignal
		) => Promise<void>
	>;
	abortControllerMap: Map<string, AbortController>;
	prevImage: string;
	abortController: AbortController;

	constructor(plugin: D2Plugin) {
		this.plugin = plugin;
		this.debouncedMap = new Map();
		this.abortControllerMap = new Map();
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
				}
			);
			this.debouncedMap.set(ctx.docId, debouncedFunc);
		}

		this.abortControllerMap.get(ctx.docId)?.abort();
		const newAbortController = new AbortController();
		this.abortControllerMap.set(ctx.docId, newAbortController);

		await debouncedFunc(source, el, ctx, newAbortController.signal);
	};

	sanitizeSVGIDs = (svgEl: HTMLElement, docID: string): string => {
		// append docId to <marker> || <mask> || <filter> id's so that they're unique across different panels & edit/view mode
		const overrides = svgEl.querySelectorAll("marker, mask, filter");
		const overrideIDs: string[] = [];
		overrides.forEach((override) => {
			const id = override.getAttribute("id");
			if (id) {
				overrideIDs.push(id);
			}
		});
		return overrideIDs.reduce((svgHTML, overrideID) => {
			return svgHTML.replaceAll(
				overrideID,
				[overrideID, docID].join("-")
			);
		}, svgEl.outerHTML);
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

		el.insertAdjacentHTML(
			"beforeend",
			this.sanitizeSVGIDs(svgEl, ctx.docId)
		);
	}

	export = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		signal: AbortSignal
	) => {
		try {
			const image = await this.generatePreview(source, signal);
			if (image) {
				el.empty();
				this.prevImage = image;
				this.insertImage(image, el, ctx);

				const button = new ButtonComponent(el)
					.setClass("Preview__Recompile")
					.setIcon("recompile")
					.onClick((e) => {
						e.preventDefault();
						e.stopPropagation();
						el.empty();
						this.attemptExport(source, el, ctx);
					});

				button.buttonEl.createEl("span", {
					text: "Recompile",
				});
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

	async generatePreview(
		source: string,
		signal: AbortSignal
	): Promise<string> {
		const pathArray = [process.env.PATH, "/opt/homebrew/bin"];
		let GOPATH = "";
		try {
			GOPATH = execSync("go env GOPATH", {
				env: {
					...process.env,
					PATH: pathArray.join(":"),
				},
			}).toString();
		} catch (error) {
			// ignore if go is not installed
		}

		if (GOPATH) {
			pathArray.push(`${GOPATH.replace("\n", "")}/bin`);
		}
		const options: any = {
			...process.env,
			env: {
				PATH: pathArray.join(":"),
			},
			signal,
		};
		if (this.plugin.settings.apiToken) {
			options.env.TSTRUCT_TOKEN = this.plugin.settings.apiToken;
		}

		let args = [
			`d2`,
			"-",
			`--theme=${this.plugin.settings.theme}`,
			`--layout=${this.plugin.settings.layoutEngine}`,
			"--bundle=false",
		];
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
