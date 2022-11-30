import { Notice, App, PluginSettingTab, Setting } from "obsidian";

import D2Plugin from "./main";
import { LAYOUT_ENGINES } from "./constants";

export interface D2PluginSettings {
	layoutEngine: string;
	apiToken: string;
	debounce: number;
	theme: number;
}

export const DEFAULT_SETTINGS: D2PluginSettings = {
	layoutEngine: "dagre",
	debounce: 500,
	theme: 0,
	apiToken: "",
};

export class D2SettingsTab extends PluginSettingTab {
	plugin: D2Plugin;
	talaSettings: HTMLDivElement;

	constructor(app: App, plugin: D2Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	addTALASettings() {
		const talaSettings = this.containerEl.createEl("div");
		talaSettings.createEl("h3", {
			text: "TALA settings",
		});
		new Setting(talaSettings)
			.setName("API token")
			.setDesc(
				'To use TALA, copy your API token here or in ~/.local/state/tstruct/auth.json under the field "api_token"'
			)
			.addText((text) =>
				text
					.setPlaceholder("tstruct_...")
					.setValue(this.plugin.settings.apiToken)
					.setDisabled(this.plugin.settings.layoutEngine !== "tala")
					.onChange(async (value) => {
						if (value && !value.startsWith("tstruct_")) {
							new Notice("Invalid API token");
						} else {
							this.plugin.settings.apiToken = value;
							await this.plugin.saveSettings();
						}
					})
			);

		this.talaSettings = talaSettings;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h1", { text: "D2 plugin settings" });

		new Setting(containerEl)
			.setName("Layout engine")
			.setDesc(
				'Available layout engines include "dagre", "ELK", and "TALA" (TALA must be installed separately from D2)'
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption(
						LAYOUT_ENGINES.DAGRE.value,
						LAYOUT_ENGINES.DAGRE.label
					)
					.addOption(
						LAYOUT_ENGINES.ELK.value,
						LAYOUT_ENGINES.ELK.label
					)
					.addOption(
						LAYOUT_ENGINES.TALA.value,
						LAYOUT_ENGINES.TALA.label
					)
					.setValue(this.plugin.settings.layoutEngine)
					.onChange(async (value) => {
						this.plugin.settings.layoutEngine = value;
						await this.plugin.saveSettings();
						if (value === LAYOUT_ENGINES.TALA.value) {
							this.addTALASettings();
						} else {
							this.talaSettings?.remove();
						}
					});
			});

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
			.setDesc(
				"How often should the diagram refresh in milliseconds (min 100)"
			)
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.debounce))
					.setValue(String(this.plugin.settings.debounce))
					.onChange(async (value) => {
						if (isNaN(Number(value))) {
							new Notice("Please specify a valid number");
							this.plugin.settings.debounce = Number(
								DEFAULT_SETTINGS.debounce
							);
						} else if (value === undefined) {
							this.plugin.settings.debounce = Number(
								DEFAULT_SETTINGS.debounce
							);
						} else if (Number(value) < 100) {
							new Notice("The value must be greater than 100");
							this.plugin.settings.debounce = Number(
								DEFAULT_SETTINGS.debounce
							);
						} else {
							this.plugin.settings.debounce = Number(value);
						}
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.layoutEngine === LAYOUT_ENGINES.TALA.value) {
			this.addTALASettings();
		}
	}
}
