import { MarkdownPostProcessorContext, ButtonComponent } from "obsidian";
import { exec, execSync } from "child_process";
import { delimiter } from "path";
import debounce from "lodash.debounce";
import os from "os";
import panzoom from 'panzoom';

import D2Plugin from "./main";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 15;

export class D2Processor {
  plugin: D2Plugin;
  debouncedMap: Map<
    string,
    (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
      signal?: AbortSignal
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

    // we need to generate a debounce per split page, and ctx.containerEl is the only element we have access to that's page specific
    // however, it is not publically available in MarkdownPostProcessorContext, so we hack its access by casting it to an 'any' type
    const pageContainer = (ctx as any).containerEl;
    let pageID = pageContainer.dataset.pageID;
    if (!pageID) {
      pageID = Math.floor(Math.random() * Date.now()).toString();
      pageContainer.dataset.pageID = pageID;
    }

    let debouncedFunc = this.debouncedMap.get(pageID);
    if (!debouncedFunc) {
      // No need to debounce initial render
      await this.export(source, el, ctx);

      debouncedFunc = debounce(this.export, this.plugin.settings.debounce, {
        leading: true,
      });
      this.debouncedMap.set(pageID, debouncedFunc);
      return;
    }

    this.abortControllerMap.get(pageID)?.abort();
    const newAbortController = new AbortController();
    this.abortControllerMap.set(pageID, newAbortController);

    await debouncedFunc(source, el, ctx, newAbortController.signal);
  };

  isValidUrl = (urlString: string) => {
    let url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  };

  formatLinks = (svgEl: HTMLElement) => {
    // Add attributes to <a> tags to make them Obsidian compatible :
    const links = svgEl.querySelectorAll("a");
    links.forEach((link: HTMLElement) => {
      const href = link.getAttribute("href") ?? "";
      // Check for internal link
      if (!this.isValidUrl(href)) {
        link.classList.add("internal-link");
        link.setAttribute("data-href", href);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      }
    });
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
      return svgHTML.replaceAll(overrideID, [overrideID, docID].join("-"));
    }, svgEl.outerHTML);
  };

  insertImage(image: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const parser = new DOMParser();
    const svg = parser.parseFromString(image, "image/svg+xml");
    const containerEl = el.createDiv();

    const svgEl = svg.documentElement;
    svgEl.style.maxHeight = `${this.plugin.settings.containerHeight}px`;
    svgEl.style.maxWidth = "100%";
    svgEl.style.height = "fit-content";
    svgEl.style.width = "fit-content";

    this.formatLinks(svgEl);
    containerEl.innerHTML = this.sanitizeSVGIDs(svgEl, ctx.docId);
    panzoom(containerEl, {
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      beforeWheel: (e) => {
        return !e.ctrlKey;
      },
    })
  }

  export = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    signal?: AbortSignal
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
    } finally {
      const pageContainer = (ctx as any).containerEl;
      this.abortControllerMap.delete(pageContainer.dataset.id);
    }
  };

  async generatePreview(source: string, signal?: AbortSignal): Promise<string> {
    const pathArray = [process.env.PATH, "/opt/homebrew/bin", "/usr/local/bin"];

    // platform will be win32 even on 64 bit windows
    if (os.platform() === "win32") {
      pathArray.push(`C:\Program Files\D2`);
    } else {
      pathArray.push(`${process.env.HOME}/.local/bin`);
    }

    let GOPATH = "";
    try {
      GOPATH = execSync("go env GOPATH", {
        env: {
          ...process.env,
          PATH: pathArray.join(delimiter),
        },
      }).toString();
    } catch (error) {
      // ignore if go is not installed
    }

    if (GOPATH) {
      pathArray.push(`${GOPATH.replace("\n", "")}/bin`);
    }
    if (this.plugin.settings.d2Path) {
      pathArray.push(this.plugin.settings.d2Path);
    }

    const options: any = {
      ...process.env,
      env: {
        PATH: pathArray.join(delimiter),
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
      `--pad=${this.plugin.settings.pad}`,
      `--sketch=${this.plugin.settings.sketch}`,
      "--bundle=false",
      "--scale=1",
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
