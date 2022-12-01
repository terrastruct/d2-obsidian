<div align="center">
  <img src="./docs/assets/banner.png" alt="D2" />
  <h2>
    D2 Support for Obsidian
  </h2>

[Language docs](https://d2lang.com) | [Cheat sheet](./docs/assets/cheat_sheet.pdf)

[![discord](https://img.shields.io/discord/1039184639652265985?label=discord)](https://discord.gg/NF6X8K4eDq)
[![twitter](https://img.shields.io/twitter/follow/terrastruct?style=social)](https://twitter.com/terrastruct)
[![license](https://img.shields.io/github/license/terrastruct/d2?color=9cf)](./LICENSE.txt)

</div>

## Installation

### Installing the Plugin on Obsidian

Settings > Community plugins > Browse > Search for D2

### Installing D2

D2 must be installed for this plugin to work, for instructions on how to install D2, click [here](https://github.com/terrastruct/d2#install).

In the future, we will release a version of this Plugin that allows the user to choose either a local or server version of D2.

### Configuring the Plugin

-   `Layout engine`: Layout engines we support include `dagre`, `ELK`, and `TALA` (`TALA` must be installed separately from D2. For more information on how to install TALA, click [here](https://github.com/terrastruct/tala))
-   `API token`: To use TALA, copy your Terrastruct API token here or in `~/.local/state/tstruct/auth.json` under the field `api_token`. You can generate an API Token in your Terrastruct console.
-   `Theme ID`: For a list of available themes, click [here](https://github.com/terrastruct/d2/tree/master/d2themes)
-   `Debounce`: How often you want the diagram to refresh in miliseconds (min 100)

## Using the Plugin

Create a fenced codeblock using d2 as the language and type in your D2 DSL, such as:

````
```d2
Hello -> World
```
````

## How to run this plugin locally

-   Clone this repo.
-   run `yarn` to install dependencies
-   `yarn run dev` to start compilation in watch mode.
-   Copy over `main.js`, `styles.css`, `manifest.json` to your vault `[VaultFolder]/.obsidian/plugins/d2/`.
