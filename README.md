# O₂ Germany – Scam Checker (frontend PoC)

Static frontend built with [Vite](https://vite.dev): plain HTML, CSS and JavaScript. Hosted on Netlify — every push to `dev` deploys automatically. Work happens on `dev` for now; `main` only accepts pull requests. The backend is a separate project.

## What it does

One page in O₂ design, in German and English (DE/EN switch, or `?lang=en`). Phones get one column; desktops get one wide message field, then full-width cards split in two halves.

1. Paste a suspicious SMS, e-mail or chat message, or tap **Beispiel einfügen** for the demo example. Then tap **Jetzt prüfen**.
2. While it checks (about 5 seconds), a magnifying glass reads the message and looks the link up in the blocklist.
3. The answer: verdict, why, the fake site next to the real one, what to do now, and the 116 116 card-blocking number in case you already entered details. For a known scam type, the "Trickser" in that scam's costume and a short cartoon of how the trick works.
4. Feedback (thumbs up/down plus an optional reason) is tied to the answer's `request_id`.
5. If the link is already in the domain database, the page says that O₂ Onlineschutz would have blocked it, with a link to the Onlineschutz page.
6. For a common scam, a card asks you to warn others: the native share sheet on phones, WhatsApp, e-mail or copy elsewhere.

Before anything is checked, the page shows the five common scam types as short cartoons (stacked on phones, a list and one story at a time on desktop).

A screenshot can go with the text or instead of it: the camera button attaches one, or paste it into the field. The example gets a stand-in answer from `src/demo.js`; anything else goes to the real backend when `VITE_API_URL` is set, and otherwise gets a short demo notice.

## Run locally

Requires [Node.js](https://nodejs.org) 22 or newer (LTS).

**Windows:** double-click `runapp.bat`. It installs dependencies, starts the dev server in the background and opens http://localhost:5180 in your browser. Edits show up live. Double-click `shutdown.bat` to stop it. Server output goes to `dev-server.log`.

**Any OS:**

```sh
npm install
npm run dev       # http://localhost:5180 with live reload
npm run build     # production build in dist/
npm run preview   # serve dist/ locally
npm run check     # behaviour checks (needs the dev server and Google Chrome)
npm run shots     # screenshots of every state into shots/
npm run og        # re-render the link-preview image public/og.jpg
```

Product context, the backend proposal and every UX decision are in [docs/product.md](docs/product.md).

## Deploy

Netlify reads `netlify.toml` (build command `npm run build`, publish directory `dist`, Node 22). One-time setup: in Netlify, choose **Add new site → Import an existing project → GitHub**, pick this repository, set the production branch to `dev` and keep the other detected settings.

## Layout

```
index.html          page markup (entry point), no texts
src/main.js         behaviour: language, check, result, feedback, share
src/strings.js      all texts, German and English
src/demo.js         backend stand-in: the example and its answer
src/scenes.js       the cartoons (inline SVG): five scam stories, loader, result, Onlineschutz
src/scenes.css      their animations
src/style.css       styles (mobile first, O₂ tokens)
public/             fonts, icons, logo, bubble, link-preview image (served as-is)
docs/product.md     product context, backend proposal, UX decisions, open items
scripts/            behaviour checks, screenshots, link-preview image
vite.config.js      dev server settings, link-preview URL
netlify.toml        Netlify build settings
runapp.bat          start the dev server and open the browser (Windows)
shutdown.bat        stop the dev server (Windows)
CLAUDE.md           instructions for Claude Code
.claude/skills/     Claude Code skills (o2-design brand guidelines)
```
