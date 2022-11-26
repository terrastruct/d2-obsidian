import { MarkdownPostProcessorContext } from "obsidian";
import D2Plugin from "./main";

const getPath = (plugin: D2Plugin, ctx: MarkdownPostProcessorContext) => {
	const path = ctx ? ctx.sourcePath : "";
	if (path.length === 0) {
		//@ts-ignore
		return plugin.app.vault.adapter.getFullPath("");
	}
	const file = plugin.app.vault.getAbstractFileByPath(path);

	if (!file) {
		//@ts-ignore
		return plugin.app.vault.adapter.getFullPath("");
	}

	//@ts-ignore
	const folder = plugin.app.vault.getDirectParent(file);
	//@ts-ignore
	return plugin.app.vault.adapter.getFullPath(folder.path);
};

export default {
	getPath,
};
