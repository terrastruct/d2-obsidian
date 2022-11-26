import { Plugin } from "obsidian";

import { D2PluginSettings, D2SettingsTab, DEFAULT_SETTINGS } from "./settings";
import { DebouncedProcessors } from "./debouncedProcessors";
import { Replacer } from "./replacer";

export default class D2Plugin extends Plugin {
	settings: D2PluginSettings;
	replacer: Replacer;
	observer: MutationObserver;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new D2SettingsTab(this.app, this));
		this.replacer = new Replacer(this);

		const processor = new DebouncedProcessors(this);

		this.registerMarkdownCodeBlockProcessor("d2", processor.export);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
