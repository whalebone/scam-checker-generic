# CLAUDE.md

White-label demo of Whalebone's Scam Check for telcos: a frontend-only static site built with Vite (plain HTML, CSS and JavaScript) and hosted on Netlify. A visitor pastes a suspicious message or a screenshot and gets a verdict, the reason, what to do, and a short cartoon of how that scam works. By default it carries no operator's name, logo or colours, so Whalebone can show it to any telco; `src/brand.js` dresses it up for one. The backend is a separate project (`whalebone/scam-check`). The only server-side code here is `netlify/functions/api.mjs`, which passes `/api` on to it and adds the token.

Forked on 2026-11-02 from the O₂ Germany PoC (`whalebone/poc-o2_germany_scamchecker_frontend`): same flow, cartoons, scam categories and animations, with the O₂ brand removed. Its UX decisions still hold; `docs/product.md` keeps them.

Status: four languages (English by default, German, Indonesian, Khmer). One example flow per language (a parcel/customs scam of that market) with a stand-in answer, and the real backend for any other text or an attached screenshot when `VITE_API_URL` is set (locally via `.env.development.local`, on Netlify via its environment variables and the function). The landing page shows seven common scam types as a row of cards that scrolls sideways; the result explains the detected type with an animated story. Separate layouts for phones (one column) and desktop (from 1024 px: a wide composer, then full-width split cards).

**Before any UI or UX work, read `docs/product.md`.** It holds:
- the product goal and how to dress the demo up for an operator
- the languages, their voice and the Khmer typography
- the backend: its contract, how the page reads each field, what it still lacks (Indonesian and Khmer among them)
- every UX decision with its reason, and the measured layout limits
- the open items
- the iteration loop, including how to run a product-designer review

Don't redo that research. Update the file when a decision changes.

## Principles (KISS)

- Plain HTML, CSS and JavaScript (ES modules). No framework, TypeScript, linters or extra tooling until there is a concrete need.
- Add a dependency only when it clearly pays for itself, and say why in the commit message. (The fonts are files in `public/fonts/`, not a package.)
- Prefer small, readable files over abstractions. Delete code that isn't used.

## Commands

- `npm install` — install dependencies
- `npm run dev` — dev server with live reload at http://localhost:5190
- `npm run build` — production build into `dist/` (what Netlify runs)
- `npm run preview` — serve the built `dist/` locally
- `npm run check` — first the Netlify function against a stand-in backend, then behaviour checks against the running dev server (texts in every language and no operator's name in them, language menu, scam carousel in every language, check flow, result, the Indonesian and Khmer examples, feedback, share, keyboard, contrast), then the real backend's part: it starts a second dev server on port 5191 with `VITE_API_URL` set and answers its calls in the browser (verdicts, token, errors, the languages the backend lacks). Checks never reach the real backend.
- `npm run shots` — screenshots of every state into `shots/` (git-ignored): phone 390 px English, small phones, German, Indonesian and Khmer at 360 px, the scam cards on a 768 px tablet, desktop 1440 and 1024 px
- `npm run og` — re-render `public/og.jpg` (link preview) after changing the hero title, the logo or the brand's colours

On Windows, `runapp.bat` starts the dev server in the background and opens the browser; `shutdown.bat` stops it. Server output goes to `dev-server.log`. If it's already running, edits reload in the browser on their own, so don't start a second server. The port is 5190 because the O₂ project keeps 5180 and both may run at once; never stop a server on 5180, it isn't this repo's. `check`, `shots` and `og` use `playwright-core` with the installed Google Chrome; no browser download.

## UI iteration loop

1. Read `docs/product.md` and make the change. Texts go in `src/strings.js` (every language), operator-specific values in `src/brand.js`, styles in `src/style.css`, cartoons in `src/scenes.js` with their animations in `src/scenes.css`.
2. Run `npm run check`. If you changed behaviour on purpose, update `scripts/check.mjs` too.
3. Run `npm run shots` and look at the result: the English phone, 360 px, Khmer (`k…`) and desktop shots at least.
4. For a visible UX change, run a product-designer review as described in `docs/product.md`.
5. Record any new decision in `docs/product.md`.
6. Run `npm run build`, then commit and push to `dev`.

## Layout

- `index.html` — page markup and entry point; every state (checking, result, notice for the demo or an error, the attached screenshot) is a `hidden` section
- `src/main.js` — JavaScript entry (imports `style.css`): language, check flow, result, feedback, share
- `src/brand.js` — everything operator-specific: colours, the hero gradient, the protection upsell's name and link, the default language
- `src/strings.js` — every visible text, in English (`en`), German (`de`), Indonesian (`id`) and Khmer (`km`), with the same keys
- `src/api.js` — the real backend: `POST /v1/scam-check` and `POST /v1/feedback`, the token, errors, the languages it takes, and the map from its threat types to the page's seven
- `src/image.js` — makes a picked or pasted screenshot ready for the backend: redrawn as one JPEG of at most 4 megapixels, without its EXIF data, as base64
- `src/demo.js` — the example message per language and its stand-in answer, in the backend's shape; feedback on it is only logged
- `.env.example` — what to put in `.env.development.local` (git-ignored) to talk to the real backend locally
- `src/scenes.js` — the cartoons as inline SVG strings, drawn in the brand's colours: the five scam stories, the loader, the still "spotted" picture, the still protection picture, the card pictures (with their white-rim filter)
- `src/scenes.css` — their keyframes; stories play once via `data-state` (set in `main.js`), the loader via `data-phase`
- `src/style.css` — styles, mobile first; the Khmer line heights at the end
- `public/` — static files served as-is from the site root: the fonts (Figtree, Noto Sans Khmer, with their OFL licences), the icons, `logo.svg`, `favicon.svg`, `og.jpg` (link preview)
- `vite.config.js` — dev server port 5190 (also set in both `.bat` files); proxies `/api` to `API_PROXY`; writes the brand's colours into the page's head; fills in `__SITE_URL__` and `__THEME_COLOR__`
- `netlify.toml` — Netlify build settings
- `netlify/functions/api.mjs` — on Netlify, `/api/v1/scam-check` and `/api/v1/feedback` go through it to the backend; it adds `SCAM_CHECK_TOKEN` and keeps the rotated token to itself
- `docs/product.md` — product context, branding, languages, the backend and its gaps, UX decisions, open items
- `scripts/` — `check.mjs`, `shots.mjs`, `og.mjs` (see Commands)

## Dressing it up for an operator

- Everything operator-specific is in `src/brand.js`. `vite.config.js` writes its colours into the page as CSS variables (`--brand`, `--brand-dark`, `--brand-soft`, `--accent`, `--gradient`), `scenes.js` draws with the same values, and `strings.js` writes `{protection}` where the protection's name goes.
- To show it in a telco's look: change `brand.js`, replace `public/logo.svg` (and give the `<img>` in `index.html` the operator's name as alt text) and `public/favicon.svg`, run `npm run og`, `npm run check` and `npm run shots`, and look at the result. Keep white on `--brand` and ink on `--accent` at 4.5:1 or more, and `--brand-dark` dark enough for white text.
- No operator's name in `strings.js`, `demo.js` or `index.html`: the texts speak as "we" and "our network", which fits whoever runs the page. `npm run check` fails on O₂, Onlineschutz and Telefónica.
- A real operator's logo and name on a public URL looks like that operator's own page. Show such a version on a branch deploy or behind a password, not on the shared demo, and not without the operator knowing.

## Texts and languages

- Never put text in `index.html`. Elements name a key from `src/strings.js` with `data-i18n` (text), `data-i18n-placeholder`, `data-i18n-label` (aria-label) or `data-i18n-alt`. Add every key to every language; `npm run check` compares them.
- Languages: `en`, `de`, `id`, `km`, in that order in the menu (the order of `STRINGS`). Order of choice: `?lang=` in the URL (for that visit only), then the choice saved from the menu, then the browser (`in` counts as Indonesian), then `BRAND.language` (English).
- The language menu is a native `<select>` lying invisible on top of a pill with the language's label (`lang.code`: EN, DE, ID, ខ្មែរ), so phones open their own picker. While a check runs it has `aria-disabled` and ignores a pick.
- Per market: `share.app` is the messenger on the desktop share pill (WhatsApp; Telegram in Khmer, for Cambodia), and the placeholder names the same one.
- Voice in every language: short, spoken and calm, no exclamation marks, no operator's name. English is British, with ’ and ‘…’. German uses "du" and „…“. Indonesian uses "kamu". Khmer uses អ្នក, ends sentences with ។ and uses ៖ as its colon. The Indonesian and Khmer copy hasn't been checked by native speakers yet.
- Placeholders: `{name}` (a scam type), `{protection}` (from `brand.js`, joined with no-break spaces so it never splits), `{number}` (a phone number in the help line).
- No-break spaces (U+00A0) and no-break hyphens (U+2011) are literal characters in the source, invisible in most editors: in "7 scams", "2,99 €", "Scam‑Check", "E‑Mail" and the hyphenated type names. Keep them when you edit a string; an editing tool may turn a written escape into the character, which is fine.
- Khmer stacks vowels and subscript letters above and below the line: it gets taller lines and 16 px at least (`--lh` and the `:lang(km)` rules at the end of `style.css`). Browsers break Khmer lines between dictionary words, also inside compounds, so the page's Khmer texts carry an invisible word joiner (U+2060) in បោកប្រាស់, រួចហើយ and ត្រូវបាន (not the share texts). Keep them, and add one where a new heading splits a compound. Check the `k…` shots after any change to Khmer text or line heights.

## Backend

`github.com/whalebone/scam-check`, branch `ai-239-scam-check-mvp`; its `api/swagger.yml` is the contract. dev1: `https://scam-check.dev1.whalebone.io`, behind a `wb-auth-proxy` front door. `docs/product.md` has the field-by-field map and what the backend still lacks.

- **Locally:** copy `.env.example` to `.env.development.local`, put in a token, and the running dev server restarts on its own. Then the example still gets its stand-in answer, and any other text goes to dev1 through the dev server's `/api` proxy. Each real check counts against that token's 20 per day.
- **The page reads the backend's shape directly** (`showResult()` in `main.js`): `answer_id`; `answer.verdict` (`scam` · `caution` · `legit`) sets `data-verdict`; `answer.threat_type` maps to one of the seven `SCAM_TYPES` via `scamType()` in `api.js`, only for `scam`; `summary` is the headline, `explanation` the reason, `what_to_do` the steps, `if_already_happened` the help line (a phone number in it becomes a `tel:` link); `official_domains` are marked green. `links: [{ domain, signal }]` isn't in the backend yet: `signal === 'strong'` shows the protection card and the domains are marked red. `demo.js` sends it for the example.
- **Languages:** the backend takes `language` `de`, `en` or `cs` and refuses anything else. Without one it would answer in the message's own language (and a fallback in German), so one card could mix two languages. So in Indonesian and Khmer only the example is checked; any other text gets the demo notice, also with the backend on (`speaks()` in `api.js`). Ask the backend team for `id` and `km`, then add them to `LANGUAGES` in `api.js`.
- **Persona:** the API answers as O₂'s Scam‑Check, in O₂'s voice. Live answers can sound like O₂ (German conventions, its tone). Before showing live answers to another telco, ask the backend team for a neutral persona (or one per `client_id`). The examples' stand-in answers are neutral.
- **On Netlify:** the environment variables `VITE_API_URL=/api` (makes the build live), `SCAM_CHECK_URL` (the front door) and `SCAM_CHECK_TOKEN` (secret). The page sends no token there; the function adds it. With one shared test token, all visitors share its user's 20 checks a day and are stored under that user.
- **Token (local):** the integration JWT goes raw into `Authorization`; each response's `Wb-Token` replaces it (valid 15 minutes), and a 401 starts over once with the configured one.
- **Screenshots:** one per check, as `image: { mime_type, data }` (plain base64, from `image.js`), with `message` only when there is text. Supported by the backend's newer branches (announced 2026-10-27); check that dev1 takes images before relying on them in a live demo.
- The page keeps the loader on screen for at least 3.5 s.

## Deployment

The repo is `github.com/whalebone/scam-checker-generic`.

- Keep `dev` checked out. Commit and push straight to `dev`; no other branches or pull requests.
- Leave `main` alone: it only accepts pull requests that need someone else's approval.

Netlify builds `dev` once a site is linked to this repo with `dev` as its production branch (set in the Netlify UI; `netlify.toml`: `npm run build` → `dist/`, Node 22). Then pushing to `dev` means going live, so run `npm run build` first. The site sends `X-Robots-Tag: noindex` to keep the demo out of search engines.

## Gotchas

- `.bat` files must keep CRLF line endings (enforced by `.gitattributes`). `sed -i` in Git Bash writes LF: convert them back.
- Never set `VITE_API_TOKEN` on Netlify (the token goes in `SCAM_CHECK_TOKEN`), and never commit `.env.development.local`: Vite builds `VITE_*` values into the public JavaScript (that file only reaches the dev server).
- The backend's front door answers every request without a token with a 401, also the CORS preflight. Call it through `/api` on the page's own origin, never cross-origin.
- With `.env.development.local` in place the dev server is live: `npm run check` then skips the demo-notice check, and `npm run shots` shows the error notice as `m18`.
- To change the port, update `vite.config.js`, `runapp.bat`, `shutdown.bat` and the default URLs in `scripts/check.mjs` and `scripts/shots.mjs` together.
- Put `:hover` styles inside `@media (hover: hover)`; on phones a hover state sticks after a tap.
- Text fields (and the language `<select>`) need a font size of 16 px or more, or iOS zooms in on focus.
- In the scenes, animate only a `<g>` without a `transform` attribute (wrap it with `at()`): a CSS transform replaces the attribute. The `transform-origin: center` rule skips elements with the attribute on purpose, or their scale or rotate would move them.
- To check an animation frame by frame, pause it: `el.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = ms })`, then take a screenshot.
- Playwright's `selectOption` waits until `aria-disabled` ends, even with `force`. To test a pick on the busy menu, set its value and dispatch `change` (as `check.mjs` does).
