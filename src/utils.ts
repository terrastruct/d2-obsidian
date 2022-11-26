import { MarkdownPostProcessorContext } from "obsidian";
import D2Plugin from "./main";

const getPath = (plugin: D2Plugin, ctx: MarkdownPostProcessorContext) => {
	const path = ctx ? ctx.sourcePath : "";
	const vault: any = plugin.app.vault;

	if (path.length === 0) {
		return vault.adapter.getFullPath("");
	}
	const file = vault.getAbstractFileByPath(path);

	if (!file) {
		return vault.adapter.getFullPath("");
	}

	const folder = vault.getDirectParent(file);
	return vault.adapter.getFullPath(folder.path);
};

export default {
	getPath,
};
