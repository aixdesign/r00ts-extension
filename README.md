# r00ts Browser Extension

Made in collaboration with [AIxDESIGN](https://aixdesign.co) and [Andrea Albiac](https://andreaalbiac.com/).
Support from [Stimulerings Fonds](https://www.stimuleringsfonds.nl/).

Available for Chrome and Firefox.

See also [r00ts-website](https://github.com/al165/r00ts-website) for the
companion site.

> [!IMPORTANT]
> Currently under active development!

## (Temporary) Installation

> !Note
> This will be easier once the extension has been submitted to the Chrome and
> Firefox extension stores in version v1.0

1. Download the [latest version](https://github.com/al165/r00ts-extension/releases)
   for your browser and extract the contents somewhere
2. - Firefox: visit `about:debugging` in the address bar, click "This Firefox",
     "Load Temporary Add-on..." and select `manifest.json` in `firefox-extension`
   - Chrome: visit `chrome://extensions/` in the address bar, enable "Developer
     mode" with the toggle in the top right, click "Load unpacked" and select
     `chrome-extension`
3. The extension icon may be hidden under the puzzle icon in the browser toolbar.
   Pin it to the toolbar for easier access!

Note that this is only a temporary installation, and it will disappear when you
restart the browser!

## Build Instructions

Clone this repo and run install the dependencies:

```sh
git clone git@github.com:al165/r00ts-extension.git
cd r00ts-extension/
npm install
```

Create a `.env` file with the following keys:

```env
API_ENDPOINT=<r00ts URL>
```

- `API_ENDPOINT`: address to an instance of
  [r00ts-website](https://github.com/al165/r00ts-website)

Note that `.env` files is untracked by git.
This file is for development builds, use `.env.prod` for production environment
variables

Next, build the extension:

```sh
# For development build:
npm run build:dev:all

# For production:
npm run build:production:all
```

This will produce 2 unpacked directories under `./dist/`, one for each browser.

To load the extension in your browser:

- Firefox: visit `about:debugging` in the address bar, click "This Firefox",
  "Load Temporary Add-on..." and select `manifest.json` in `dist/firefox-extension`
- Chrome: visit `chrome://extensions/` in the address bar, enable "Developer
  mode" with the toggle in the top right, click "Load unpacked" and select
  `dist/chrome-extension`
