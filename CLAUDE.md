# CLAUDE.md

Frontend-only PoC for the O₂ Germany Scam Checker: a static site built with Vite (plain HTML, CSS and JavaScript) and hosted on Netlify. The backend is a separate project (`whalebone/scam-check`). The only server-side code here is `netlify/functions/api.mjs`, which passes `/api` on to it and adds the token.

Status: one example flow (a fake customs/parcel SMS) with a stand-in answer, in German and English, and the real backend connected for any other text or an attached screenshot when `VITE_API_URL` is set (locally via `.env.development.local`, on Netlify via its environment variables and the function). The landing page shows seven common scam types (taken from O₂ CZ) as a row of cards that scrolls sideways; the result explains the detected type with an animated story. Separate layouts for phones (one column) and desktop (from 1024 px: a wide composer, then full-width split cards).

**Before any UI or UX work, read `docs/product.md`.** It holds:
- the product goal and the owner's requirements
- the backend: its contract, how the page reads each field, what it still lacks
- the O₂ Onlineschutz facts behind the upsell
- every UX decision with its reason, and the measured layout limits
- the open items
- the iteration loop, including how to run a product-designer review

Don't redo that research. Update the file when a decision changes.

## Principles (KISS)

- Plain HTML, CSS and JavaScript (ES modules). No framework, TypeScript, linters or extra tooling until there is a concrete need.
- Add a dependency only when it clearly pays for itself, and say why in the commit message.
- Prefer small, readable files over abstractions. Delete code that isn't used.

## Commands

- `npm install` — install dependencies
- `npm run dev` — dev server with live reload at http://localhost:5180
- `npm run build` — production build into `dist/` (what Netlify runs)
- `npm run preview` — serve the built `dist/` locally
- `npm run check` — first the Netlify function against a stand-in backend, then behaviour checks against the running dev server (language, scam carousel, check flow, result, feedback, share, keyboard, contrast), then the real backend's part: it starts a second dev server on port 5181 with `VITE_API_URL` set and answers its calls in the browser (verdicts, token, errors). Checks never reach the real backend.
- `npm run shots` — screenshots of every state into `shots/` (git-ignored): phone 390 px German, small phones, English at 360 px, the scam cards on a 768 px tablet, desktop 1440 and 1024 px
- `npm run og` — re-render `public/og.jpg` (link preview) after changing the hero title or logo

On Windows, `runapp.bat` starts the dev server in the background and opens the browser; `shutdown.bat` stops it. The user usually has it running with the page open: edits reload in the browser on their own, so don't start a second server. Server output goes to `dev-server.log`. `check`, `shots` and `og` use `playwright-core` with the installed Google Chrome; no browser download.

## UI iteration loop

1. Read `docs/product.md` and make the change. Texts go in `src/strings.js` (both languages), styles in `src/style.css`, cartoons in `src/scenes.js` with their animations in `src/scenes.css`.
2. Run `npm run check`. If you changed behaviour on purpose, update `scripts/check.mjs` too.
3. Run `npm run shots` and look at the result, 360 px, English and desktop shots.
4. For a visible UX change, run a product-designer review as described in `docs/product.md`.
5. Record any new decision in `docs/product.md`.
6. Run `npm run build`, then commit and push to `dev`.

## Layout

- `index.html` — page markup and entry point; every state (checking, result, notice for the demo or an error, the attached screenshot) is a `hidden` section
- `src/main.js` — JavaScript entry (imports `style.css`): language, check flow, result, feedback, share
- `src/strings.js` — every visible text, German (`de`) and English (`en`) with the same keys
- `src/api.js` — the real backend: `POST /v1/scam-check` and `POST /v1/feedback`, the token, errors, and the map from its threat types to the page's seven
- `src/image.js` — makes a picked or pasted screenshot ready for the backend: redrawn as one JPEG of at most 4 megapixels, without its EXIF data, as base64
- `src/demo.js` — the example message and its stand-in answer, in the backend's shape; feedback on it is only logged
- `.env.example` — what to put in `.env.development.local` (git-ignored) to talk to the real backend locally
- `src/scenes.js` — the cartoons as inline SVG strings: the five scam stories, the loader, the still "spotted" picture, the still Onlineschutz picture, the card pictures (with their white-rim filter)
- `src/scenes.css` — their keyframes; stories play once via `data-state` (set in `main.js`), the loader via `data-phase`
- `src/style.css` — styles, mobile first
- `public/` — static files served as-is from the site root: On Air fonts, O₂ icons and logo, the hero bubble, `og.jpg` (link preview)
- `vite.config.js` — dev server port 5180 (also set in both `.bat` files); proxies `/api` to `API_PROXY`; fills in `__SITE_URL__` for the link preview
- `netlify.toml` — Netlify build settings
- `netlify/functions/api.mjs` — on Netlify, `/api/v1/scam-check` and `/api/v1/feedback` go through it to the backend; it adds `SCAM_CHECK_TOKEN` and keeps the rotated token to itself
- `docs/product.md` — product context, the backend and its gaps, UX decisions, open items
- `scripts/` — `check.mjs`, `shots.mjs`, `og.mjs` (see Commands)
- `.claude/skills/o2-design/` — O₂ brand design skill

## Texts and languages

- Never put text in `index.html`. Elements name a key from `src/strings.js` with `data-i18n` (text), `data-i18n-html` (the few texts with markup), `data-i18n-placeholder` or `data-i18n-label` (aria-label). Add every key to both `de` and `en`.
- Language order: `?lang=` in the URL (for that visit only), then the choice saved from the DE/EN switch, then the browser (English for `en…`, otherwise German).
- O₂ voice in both languages: short, spoken, no exclamation marks; German uses "du" and „…“, English is British.
- On Air has no "₂" glyph: page text writes `O<sub>2</sub>` (via `data-i18n-html`). Plain "O₂" is fine only where On Air isn't used (tab title, meta tags, shared texts).

## Backend

`github.com/whalebone/scam-check`, branch `ai-239-scam-check-mvp`; its `api/swagger.yml` is the contract. dev1: `https://scam-check.dev1.whalebone.io`, behind a `wb-auth-proxy` front door. `docs/product.md` has the field-by-field map and what the backend still lacks.

- **Locally:** copy `.env.example` to `.env.development.local`, put in a token, and the running dev server restarts on its own. Then the example still gets its stand-in answer, and any other text goes to dev1 through the dev server's `/api` proxy. Each real check counts against that token's 20 per day.
- **The page reads the backend's shape directly** (`showResult()` in `main.js`): `answer_id`; `answer.verdict` (`scam` · `caution` · `legit`) sets `data-verdict`; `answer.threat_type` maps to one of the seven `SCAM_TYPES` via `scamType()` in `api.js`, only for `scam`; `summary` is the headline, `explanation` the reason, `what_to_do` the steps, `if_already_happened` the help line; `official_domains` are marked green. `links: [{ domain, signal }]` isn't in the backend yet: `signal === 'strong'` shows Onlineschutz and the domains are marked red. `demo.js` sends it for the example.
- **On Netlify:** the environment variables `VITE_API_URL=/api` (makes the build live), `SCAM_CHECK_URL` (the front door) and `SCAM_CHECK_TOKEN` (secret). The page sends no token there; the function adds it. With one shared test token, all visitors share its user's 20 checks a day and are stored under that user.
- **Token (local):** the integration JWT goes raw into `Authorization`; each response's `Wb-Token` replaces it (valid 15 minutes), and a 401 starts over once with the configured one.
- **Screenshots:** one per check, as `image: { mime_type, data }` (plain base64, from `image.js`), with `message` only when there is text; `language` always. Announced by the backend team on 2026-10-27 but not on dev1 yet, which still requires `message`, ignores `image` and refuses bodies over 1 MiB: don't deploy the screenshot input before the backend takes images.
- The page keeps the loader on screen for at least 3.5 s.

## Design: o2-design skill

Use the `o2-design` skill for any UI, styling or copy work. It holds O₂'s colour and type tokens (`colors_and_type.css`), the On Air fonts, logos, icons and the German voice rules (du/Sie, no exclamation marks, price formats). Copy the assets the app needs into `public/` (or `src/`) instead of referencing `.claude/` from app code — the skill is reference material and gets updated on its own.

## Deployment

The repo is `github.com/whalebone/poc-o2_germany_scamchecker_frontend`.

- Keep `dev` checked out. Commit and push straight to `dev`; no other branches or pull requests.
- Leave `main` alone: it only accepts pull requests that need someone else's approval.

Netlify's production branch is `dev` (set in the Netlify UI), so every push to `dev` deploys (`netlify.toml`: `npm run build` → `dist/`, Node 22). Pushing to `dev` means going live, so run `npm run build` first. The site sends `X-Robots-Tag: noindex` to keep the PoC out of search engines; remove that header at launch.

## Gotchas

- `.bat` files must keep CRLF line endings (enforced by `.gitattributes`).
- Never set `VITE_API_TOKEN` on Netlify (the token goes in `SCAM_CHECK_TOKEN`), and never commit `.env.development.local`: Vite builds `VITE_*` values into the public JavaScript (that file only reaches the dev server).
- The backend's front door answers every request without a token with a 401, also the CORS preflight. Call it through `/api` on the page's own origin, never cross-origin.
- With `.env.development.local` in place the dev server is live: `npm run check` then skips the demo-notice check, and `npm run shots` shows the error notice as `m18`.
- To change the port, update `vite.config.js`, `runapp.bat` and `shutdown.bat` together.
- Put `:hover` styles inside `@media (hover: hover)`; on phones a hover state sticks after a tap.
- Text fields need a font size of 16 px or more, or iOS zooms in on focus.
- In the scenes, animate only a `<g>` without a `transform` attribute (wrap it with `at()`): a CSS transform replaces the attribute. The `transform-origin: center` rule skips elements with the attribute on purpose, or their scale or rotate would move them.
- To check an animation frame by frame, pause it: `el.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = ms })`, then take a screenshot.
