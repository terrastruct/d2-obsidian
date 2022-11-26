import { MarkdownPostProcessorContext } from "obsidian";
import { exec } from "child_process";

import D2Plugin from "./main";
import Utils from "./utils";

export function insertImage(el: HTMLElement, image: string) {
	el.empty();

	const parser = new DOMParser();
	const svg = parser.parseFromString(image, "image/svg+xml");

	el.insertAdjacentHTML("beforeend", svg.documentElement.outerHTML);
	const svgEl = el.children[0];
	// Have svg image be contained within the obsidian window
	svgEl.setAttribute("preserveAspectRatio", "xMinYMin slice");
	svgEl.removeAttribute("width");
	svgEl.removeAttribute("height");
}

export class D2Processor implements Processor {
	plugin: D2Plugin;

	constructor(plugin: D2Plugin) {
		this.plugin = plugin;
	}

	export = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		try {
			const image = await this.generatePreview(
				source,
				Utils.getPath(this.plugin, ctx)
			);
			if (image) {
				insertImage(el, image);
			}
		} catch (err) {
			el.empty();
			el.createEl("div", {
				text: "D2 Compilation Error:",
				cls: "Preview__Error--Title",
			});
			el.createEl("div", { text: err.message, cls: "Preview__Error" });
		}
	};

	async generatePreview(source: string, path: string): Promise<string> {
		const options = {
			encoding: "utf-8",
			cwd: path,
		};
		const env: any = {
			...process.env,
			PATH: [process.env.PATH, `${this.plugin.settings.goPath}/bin`].join(
				":"
			),
		};

		if (this.plugin.settings.apiToken) {
			env.TSTRUCT_TOKEN = this.plugin.settings.apiToken;
		}

		let args = [`d2`, "-", "-", "--theme", this.plugin.settings.theme];
		if (this.plugin.settings.layoutEngine.toLowerCase() === "tala") {
			args.unshift("D2_LAYOUT=tala");
		} else {
			args = args.concat(["--layout", this.plugin.settings.layoutEngine]);
		}
		const cmd = args.join(" ");
		const child = exec(cmd, { ...options, env });
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
