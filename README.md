<div align="center">
  <img src="./docs/assets/banner.png" alt="D2" />
  <h2>
    D2 Obsidian Plugin
  </h2>

D2 is a modern diagram scripting language thats turns text to diagrams. The source code
for D2, as well as install instructions and all other information, can be found at
[https://github.com/terrastruct/d2](https://github.com/terrastruct/d2).

[![license](https://img.shields.io/github/license/terrastruct/obsidian-d2?color=9cf)](./LICENSE.txt)

</div>

## Installation

Settings > Community plugins > Browse > Search for "D2"

**important**: [D2](https://github.com/terrastruct/d2) must be installed for this plugin
to work currently. We will later on introduce a remote API as an option, but currently
this plugin calls your local installation of D2.

## Configurations

-   `Layout engine`: Layout engines we support include `dagre`, `ELK`, and `TALA` (`TALA` must be installed separately from D2. For more information on how to install TALA, click [here](https://github.com/terrastruct/tala))
-   `Theme ID`: For a list of available themes, click [here](https://github.com/terrastruct/d2/tree/master/d2themes)
-   `Debounce`: How often you want the diagram to refresh in miliseconds (min 100)
-   `D2 PATH`: Customize the PATH to D2 (optional)

## Usage

Create a fenced codeblock using d2 as the language and type in your D2 DSL, such as:

```d2
Hello -> World
```

## How to run this plugin locally

-   Clone this repo.
-   run `yarn` to install dependencies
-   `yarn run dev` to start compilation in watch mode.
-   Copy over `main.js`, `styles.css`, `manifest.json` to your vault `[VaultFolder]/.obsidian/plugins/d2/`.
