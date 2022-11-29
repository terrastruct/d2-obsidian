import { debounce, Debouncer, MarkdownPostProcessorContext } from "obsidian";
import { exec } from "child_process";

import D2Plugin from "./main";

export class D2Processor {
	plugin: D2Plugin;
	debouncedExport?: Debouncer<[string, HTMLElement], Promise<void>>;
	prevImage: string;

	constructor(plugin: D2Plugin) {
		this.plugin = plugin;
		this.debouncedExport = debounce(
			this.export,
			plugin.settings.debounce,
			true
		);
	}

	debounceExport = async (
		source: string,
		el: HTMLElement,
		_: MarkdownPostProcessorContext
	) => {
		el.createEl("h6", {
			text: "Generating D2 diagram...",
			cls: "D2__Loading",
		});
		this.debouncedExport?.(source, el);
	};

	insertImage(el: HTMLElement, image: string) {
		this.prevImage = image;
		const parser = new DOMParser();
		const svg = parser.parseFromString(image, "image/svg+xml");

		const svgEl = svg.documentElement;
		// Have svg image be contained within the obsidian window
		svgEl.setAttribute("preserveAspectRatio", "xMinYMin slice");
		svgEl.removeAttribute("width");
		svgEl.removeAttribute("height");
		el.insertAdjacentHTML("beforeend", svg.documentElement.outerHTML);
	}

	export = async (source: string, el: HTMLElement) => {
		try {
			const image = await this.generatePreview(source);
			if (image) {
				el.empty();
				this.insertImage(el, image);
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
				this.insertImage(el, this.prevImage);
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
