import { Notice, App, PluginSettingTab, Setting } from "obsidian";

import D2Plugin from "./main";

export interface D2PluginSettings {
	goPath: string;
	layoutEngine: string;
	apiToken: string;
	debounce: number;
	theme: number;
}

export const DEFAULT_SETTINGS: D2PluginSettings = {
	goPath: "/usr/local/go",
	layoutEngine: "dagre",
	debounce: 3,
	theme: 0,
	apiToken: "",
};

export class D2SettingsTab extends PluginSettingTab {
	plugin: D2Plugin;

	constructor(app: App, plugin: D2Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "D2 Plugin settings" });

		new Setting(containerEl)
			.setName("GOPATH")
			.setDesc("Specify GOPATH here to allow us to find D2")
			.addText((text) =>
				text
					.setPlaceholder("Enter your go path")
					.setValue(this.plugin.settings.goPath)
					.onChange(async (value) => {
						this.plugin.settings.goPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Layout engine")
			.setDesc(
				'Available layout engines include "dagre", "elk", and "tala" (TALA must be bundled with D2)'
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter a layout engine")
					.setValue(this.plugin.settings.layoutEngine)
					.onChange(async (value) => {
						this.plugin.settings.layoutEngine = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("API token")
			.setDesc(
				'To use TALA, copy your Terrastruct API token here or in ~/.local/state/tstruct/auth.json under the field "api_token"'
			)
			.addText((text) =>
				text
					.setPlaceholder("tstruct_...")
					.setValue("")
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Theme ID")
			.setDesc(
				"Available themes are located at https://github.com/terrastruct/d2/tree/master/d2themes"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter a theme ID")
					.setValue(String(this.plugin.settings.theme))
					.onChange(async (value) => {
						if (!isNaN(Number(value)) || value === undefined) {
							this.plugin.settings.theme = Number(
								value || DEFAULT_SETTINGS.theme
							);
							await this.plugin.saveSettings();
						} else {
							new Notice("Please specify a valid number");
						}
					})
			);

		new Setting(containerEl)
			.setName("Debounce")
			.setDesc("How often should the diagram refresh in seconds")
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.debounce))
					.setValue(String(this.plugin.settings.debounce))
					.onChange(async (value) => {
						//make sure that there is always some value defined, or reset to default
						if (!isNaN(Number(value)) || value === undefined) {
							this.plugin.settings.debounce = Number(
								value || DEFAULT_SETTINGS.debounce
							);
							await this.plugin.saveSettings();
						} else {
							new Notice("Please specify a valid number");
						}
					})
			);
	}
}
