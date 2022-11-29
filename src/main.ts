import { Plugin } from "obsidian";

import { D2PluginSettings, D2SettingsTab, DEFAULT_SETTINGS } from "./settings";
import { D2Processor } from "./processor";

export default class D2Plugin extends Plugin {
	settings: D2PluginSettings;
	observer: MutationObserver;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new D2SettingsTab(this.app, this));

		const processor = new D2Processor(this);
		this.registerMarkdownCodeBlockProcessor("d2", processor.attemptExport);
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
