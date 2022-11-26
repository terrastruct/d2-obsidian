# D2 Support for Obsidian

## Installation

### Installing the Plugin

Settings > Community plugins > Browse > Search for D2

### Installing D2

D2 must be installed for this plugin to work

### Configuring the Plugin

-   `GOPATH`
-   `Layout engine`
-   `API token`
-   `Theme ID`
-   `Debounce`

## Using the Plugin

Create a fenced codeblock using d2 as the language and type in your D2 DSL below. For example:

```
\`\`\`d2
A -> B
\`\`\`
```

## How to build locally

-   Clone this repo.
-   `npm i` or `yarn` to install dependencies
-   `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

-   Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.
