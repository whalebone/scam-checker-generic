# Scam Check – white-label telco demo (frontend)

Whalebone's Scam Check as a neutral demo page for any telco: paste a suspicious message, get a clear answer in seconds. Static frontend built with [Vite](https://vite.dev): plain HTML, CSS and JavaScript, hosted on Netlify. Work happens on `dev`; `main` only accepts pull requests. The backend is a separate project (`whalebone/scam-check`).

Forked from an earlier operator-branded PoC and stripped of its brand; the flow, the cartoons and the scam categories are the same.

## What it does

One page in four languages: English (default), Deutsch, Bahasa Indonesia and ខ្មែរ (Khmer), from the language menu in the header or `?lang=de|id|km`. Phones get one column; desktops get one wide message field, then full-width cards split in two halves.

1. Paste a suspicious SMS, e-mail or chat message, or tap **Use example**: a parcel/customs scam of the chosen language's market. Then tap **Check now**.
2. While it checks (about 5 seconds), a magnifying glass reads the message and looks the link up in the blocklist.
3. The answer: verdict, why (the fake site in red, the real one in green), what to do now, and who to call if you already entered details. For a known scam type, the "Trickser" in that scam's costume and a short cartoon of how the trick works.
4. Feedback (thumbs up/down plus an optional reason) is tied to the answer's id.
5. If the link is already on the blocklist, the page says the operator's network protection would have blocked it, with a link to it (the upsell).
6. For a common scam, a card asks you to warn others: the native share sheet on phones, WhatsApp, e-mail or copy elsewhere.

Before anything is checked, the page shows seven common scam types as a row of cards that scrolls sideways.

A screenshot can go with the text or instead of it: the camera button attaches one, or paste it into the field. The example gets a stand-in answer from `src/demo.js`; anything else goes to the real backend when `VITE_API_URL` is set, and otherwise gets a short demo notice.

## Dress it up for a telco

Everything operator-specific lives in [`src/brand.js`](src/brand.js): colours, the hero gradient, the name and link of the network protection that the upsell offers (a placeholder, "Network Shield", by default) and the default language. Replace `public/logo.svg` and `public/favicon.svg`, then run `npm run og`, `npm run check` and `npm run shots`. Details in [CLAUDE.md](CLAUDE.md) and [docs/product.md](docs/product.md).

## Run locally

Requires [Node.js](https://nodejs.org) 22 or newer (LTS) and Google Chrome (for the checks and screenshots).

**Windows:** double-click `runapp.bat`. It installs dependencies, starts the dev server in the background and opens http://localhost:5190 in your browser. Edits show up live. Double-click `shutdown.bat` to stop it. Server output goes to `dev-server.log`.

**Any OS:**

```sh
npm install
npm run dev       # http://localhost:5190 with live reload
npm run build     # production build in dist/
npm run preview   # serve dist/ locally
npm run check     # behaviour checks (needs the dev server and Google Chrome)
npm run shots     # screenshots of every state into shots/
npm run og        # re-render the link-preview image public/og.jpg
```

Product context, the backend and every UX decision are in [docs/product.md](docs/product.md).

## Deploy

Netlify reads `netlify.toml` (build command `npm run build`, publish directory `dist`, Node 22). One-time setup: in Netlify, choose **Add new site → Import an existing project → GitHub**, pick this repository, set the production branch to `dev` and keep the other detected settings. For the real backend, also set `VITE_API_URL=/api`, `SCAM_CHECK_URL` and `SCAM_CHECK_TOKEN` (see CLAUDE.md).

## Layout

```
index.html          page markup (entry point), no texts
src/brand.js        everything operator-specific: colours, protection name and link, default language
src/main.js         behaviour: language, check, result, feedback, share
src/strings.js      all texts: English, German, Indonesian, Khmer
src/demo.js         backend stand-in: the example per language and its answer
src/api.js          the real backend
src/scenes.js       the cartoons (inline SVG): five scam stories, loader, result, protection
src/scenes.css      their animations
src/style.css       styles (mobile first)
public/             fonts (with their licences), icons, logo, favicon, link-preview image (served as-is)
docs/product.md     product context, branding, languages, backend, UX decisions, open items
scripts/            behaviour checks, screenshots, link-preview image
vite.config.js      dev server settings, the brand's colours in the page, link-preview URL
netlify.toml        Netlify build settings
netlify/functions/  the /api proxy that adds the backend token
runapp.bat          start the dev server and open the browser (Windows)
shutdown.bat        stop the dev server (Windows)
CLAUDE.md           instructions for Claude Code
```
