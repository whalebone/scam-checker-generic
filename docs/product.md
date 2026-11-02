# Scam Check, the white-label telco demo: product context and UX decisions

Read this before UI or UX work. It holds what the page is built on: the goal, how to dress it up for an operator, the languages, the backend and how the page reads it, the protection upsell, and the UX decisions with their reasons. Update it when a decision changes, so the next session doesn't redo the research.

This repo was forked on 2026-11-02 from the O₂ Germany PoC (`whalebone/poc-o2_germany_scamchecker_frontend`). Its decisions come from four product-designer review rounds (round 1 on 2026-10-19, rounds 2–4 on 2026-10-20), the backend integration (2026-10-22) and the screenshot input (2026-10-27). They still hold and are kept below, with O₂'s brand taken out. "The owner" below is the PoC's product owner at O₂; their requests shaped the page.

## The product

- **What:** a customer pastes a suspicious SMS, e-mail or chat message (or a screenshot) and gets a clear answer in seconds: scam or not, why, and what to do now.
- **Who:** Whalebone builds the backend (threat intelligence plus an AI verdict) and the network protection behind the upsell. In a pilot, the telco owns the page, its UX, approvals and traffic, and sells the protection under its own name.
- **This repo's goal:** a demo Whalebone can show to any telco, in that telco's market language, with no other operator's brand on it. For a pilot, `src/brand.js` dresses it up for that operator.
- **The PoC's questions** (they still apply in a pilot): what do people check, do they follow the advice, do they come back and upgrade? Every click should be tracked; tracking isn't built yet.

## What the page must do

Acceptance criteria, collected from the PoC's rounds:

- A clean, minimalist page. Mobile first, separate UX for desktop.
- Minimal text. The user always knows what to do next.
- One example per language with a stand-in answer, and the real backend for anything else.
- Screenshots: attach one instead of, or with, the text.
- A feedback button on the answer.
- A share option when the result is a common scam: a call to protect other people, plus sharing to platforms.
- An upsell to the operator's network protection that says explicitly: this site is already on our blocklist, so with the protection you would already be safe. The main upsell moment.
- About 5 s of backend time, made into a fun, engaging wait.
- The key scam types with a super simple animated "diagram" of how each works, explained like to a kindergartner: minimum words, animated characters, 5–10 s each. The detected type's animation on the result too.
- A more playful result: bring in an element of the scam type, explain, recommend the real website.
- Calm overall ("a bit too busy" in round 2): only the result's story moves, plus the loader.
- A carousel of the scam types on the landing page, with clear one-line descriptions (modelled on O₂ CZ's „Alenčin atlas šmejdů“, whose seven categories the page took over in round 4).
- "Super understandable overall with as minimum amount of text as possible."
- Since 2026-11-02: no operator's brand by default; English, German, Indonesian and Khmer.

## Dressing it up for an operator (2026-11-02)

**One file.** `src/brand.js` holds everything operator-specific:
- `colors`: `brand` (buttons, links, the cards' picture panels), `brand-dark` (the top of the hero, hover, outlines in the drawings), `brand-soft` (behind drawings and small buttons), `accent` (the Demo tag, highlights in the drawings)
- `gradient`: the hero, the page's only gradient
- `protection`: the name and link of the network protection the upsell offers
- `language`: the default when nothing else picks one

`vite.config.js` writes the colours into the page's head as CSS variables, so the first paint has them; `scenes.js` imports the same values for the cartoons; `strings.js` writes `{protection}`. Besides `brand.js`, replace `public/logo.svg` (give its `<img>` the operator's name as alt text) and `public/favicon.svg`, and run `npm run og`.

**The neutral defaults and why**
- **Colours:** a deep teal gradient (`#042f2e` → `#0f766e` → `#11807a`) with a mint accent (`#8eeadb`). The first rebrand kept a navy-to-sapphire blue; the designer's review (below) found that a vertical blue gradient with a white heavy headline still reads as O₂ Germany's look, only recoloured. Teal keeps every part of the style the owner liked (gradient hero, rounded bottom, overlapping white card, tag, cartoons) and is its own product. It also sits well with the lila Trickser and the orange coins, and clashes with none of the status colours. White on `#0f766e` is 5.5:1, on the gradient's last colour 4.8:1, on `#042f2e` 14.5:1; ink on the accent 13.3:1. For an operator, three values change.
- **Neutral greys and status colours:** ink `#0b1220`, greys `#374151` · `#6b7280` (4.8:1 on white, inputs and placeholders) · `#c4c9d2` · `#f3f4f6`, red `#d1304d` (5.0:1, works as text), orange `#ffa94d`, green `#22d38a`. O₂'s violet-tinted greys and exact status colours are gone; the roles and contrasts are the same.
- **The mark:** a white message bubble with a magnifying glass cut out, so the hero shows through: "a message, checked". The first mark had a tick, which reads as "verified safe", off-message for a scam check. It names no one. The favicon is the same on a brand-coloured square.
- **The hero decoration:** faint concentric rings, like a signal spreading from the top right corner, replace O₂'s bubble (a brand asset). Plain CSS, so they take any brand's colours. Like the bubble, only from 720 px, behind no text.
- **Fonts:** Figtree (Latin) and Noto Sans Khmer replace O₂'s proprietary On Air. Both are variable (every weight in one file) and under the SIL Open Font License, with their licences in `public/fonts/`. Self-hosted, so no request goes to Google Fonts (a GDPR issue in the EU). `unicode-range` means a browser only loads what the page shows: Figtree's Latin set is 20 KB for all weights (On Air was 3 × 48 KB), the Khmer font's 59 KB load only for Khmer text (`check.mjs` checks both).
- **Icons:** an own set of 24 × 24 outlines in `public/icons/`, recoloured through CSS masks like O₂'s before. Same file names, plus a globe and a chevron for the language menu.
- **The protection:** "Network Shield", a placeholder that says what it does, linking to whalebone.io. In a pilot it becomes the operator's product name and page.
- **Coins without a currency sign:** a gold disc with a rim and a shine; the money sack wears one as its emblem; the romance story's bubble asks "coin?". With a sign, the German page showed "2,99 €" next to $ coins and the Indonesian "Rp15.000" next to them, and "Rp" doesn't fit a coin. One drawing now serves every market.
- **No operator's name in any text.** The page speaks as "we" and "our network", which fits whoever runs it. `check.mjs` fails on O₂, Onlineschutz and Telefónica in the texts, the examples and `index.html`.
- **Real brands are for pilots.** A real operator's logo and name on a public URL looks like that operator's own page (and its scam warning like theirs). Show such a version on a branch deploy or behind a password, with the operator's knowledge.

## Languages (2026-11-02)

**Which and in what order:** English (`en`, the default from `brand.js`), German (`de`), Indonesian (`id`) and Khmer (`km`), the menu's order. A `?lang=` link wins for that visit, then the choice saved from the menu, then the browser's languages (`in` is Indonesian's old code), then the default.

**The language menu**
- A white outline pill in the hero with a globe, the language's label (`lang.code`: EN, DE, ID and ខ្មែរ, since "KM" means nothing to most Cambodians) and a chevron. A native `<select>` lies invisible on top of it with a 48 px tap area: a tap opens the phone's own picker, where each language shows in its own name and script (English, Deutsch, Bahasa Indonesia, ខ្មែរ). It's named "Language" in the page's language.
- Why not the DE|EN buttons any more: four segments don't fit at 360 px next to the mark, the product name and the Demo tag, and a native picker is the most familiar control on every phone.
- While a check or a refresh runs it has `aria-disabled` (not `disabled`, which would drop focus), looks dimmed and ignores a pick.
- The rest of the language switch is as before (see "Flow").

**Voice in every language:** short, spoken and calm, no exclamation marks, no operator's name.
- English: British, with ’ and ‘…’, "Checking…" with no space before the ellipsis.
- German: "du", „…“, "Wir prüfen …" with a space before the ellipsis. Some operators address customers with "Sie": a pilot with one of them needs the German rewritten.
- Indonesian: "kamu", friendly like the German "du"; plain words over English loanwords, except where Indonesians use the English ("link", "login", "screenshot"). The example SMS uses the scammers' formal "Anda", as real ones do.
- Khmer: អ្នក; sentences end with ។, the colon is ៖. "Yes/No" in Khmer is gendered (បាទ/ចាស), so feedback asks „តើវាបានជួយអ្នកទេ?“ ("Did it help you?") with the neutral answers បាន / មិនបាន.

**Names**
- The product: "Scam Check" in English and Khmer (a Latin product name, like many Cambodian apps), "Scam‑Check" in German, "Cek Penipuan" in Indonesian (plainer for older people, the main targets).
- The scam types in Indonesian: Kurir Gadungan, Pembobol Akun, Penyamar Keluarga, Si Cuan Kilat, Pembual Cinta, Bankir Gadungan, Teknisi Palsu ("gadungan" and "bodong" are the everyday words for fake people and fake investments).
- In Khmer: អ្នកដឹកជញ្ជូនក្លែងក្លាយ (fake courier), ចោរគណនី (account thief), កូនក្លែងក្លាយ (fake child), មាន់ពងមាស (the hen with the golden eggs), អ្នកកុហកស្នេហា (love liar), ធនាគារិកក្លែងក្លាយ (fake banker), អ្នកបច្ចេកទេសក្លែងក្លាយ (fake technician).
- "Spotted" in every language, never "caught": the danger isn't over while the message is still in the inbox (Durchschaut, Ketahuan, រកឃើញ).

**The examples: each market's own parcel scam** (`demo.js`), so a demo in a telco's language shows a message its customers know. All share the scam domain `parcel-fee.info`, by which the demo recognises them.

| Language | Message | Fee | Real site (green) | Help line |
|---|---|---|---|---|
| English | customs holds your parcel | $2.99 | none: English stays international | call your bank |
| German | the Zoll holds your parcel | 2,99 € | zoll.de | 116 116 (card blocking in Germany), a `tel:` link |
| Indonesian | Bea Cukai holds your parcel | Rp15.000 | beacukai.go.id | call your bank |
| Khmer | customs (គយ) holds your parcel | $2.99 | customs.gov.kh | call your bank |

- A phone number in the help line (`if_already_happened`) becomes a `tel:` link, whatever the country: the most urgent action for someone who already tapped the link.
- **The messenger is the market's:** `share.app` names the one on the desktop share pill and the placeholder names the same: WhatsApp for English, German and Indonesian, Telegram for Khmer (Cambodia's main messenger; its share link is `t.me/share/url`).

**Khmer typography**
- Khmer stacks vowels and subscript consonants above and below the line. Its lines are taller: body 1.65 (`--lh`), headings and the lead 1.5, the reason 1.75 (its domain marks 1.4, or their backgrounds nearly touch), the story's steps 1.5. The text field's rows follow `--lh`, up to 6 rows (a Khmer keyboard has 5 rows of keys).
- Nothing in Khmer is smaller than 16 px: below that the subscripts get too small (the steps, the "Spotted" pill, the example chip, the hint).
- Headlines split into sentences at ។ as well as at a full stop; a domain mark keeps a following ។ or ៖ on its line.
- Chrome and Safari break Khmer lines between dictionary words, which also splits compounds (បោក|ប្រាស់, រួច|ហើយ, ត្រូវ|បាន). Those compounds carry a word joiner (U+2060, invisible) in the page's Khmer texts, not in the share texts. Balanced wrapping stays on: it put the H1's break at the natural place. Firefox is untested.
- The loader's captions fit one line at 360 px in every language, so the card doesn't jump between phases.
- The H1 takes two lines on phones; the card names fit at 360 px (`check.mjs` checks every language).

**Not yet:** native speakers haven't read the Indonesian and Khmer copy. Do that before a customer sees it (open items).

## The backend (built; connected on 2026-10-22)

`github.com/whalebone/scam-check`, branch `ai-239-scam-check-mvp` (Jira epic AI-239; `main` is still the Go template). The contract is its `api/swagger.yml`, the reasons are in its `docs/DESIGN.md`. Running on dev1: `https://scam-check.dev1.whalebone.io`. Go, one Gemini call (`gemini-3.5-flash-lite` on Vertex AI, EU) after four evidence tools run in parallel (Whalebone threat intelligence via feed-warden, WHOIS, one HTTP probe, a TLS check), then a DNS check of the official domains. Answers are stored in Postgres with their id.

**Calls.** Both go through the front door, a `wb-auth-proxy`:
- `POST /v1/scam-check { message (max 4000), language: de · en · cs }` → `{ answer_id, answer, fallback, timing, versions }`. A model failure or an overrun of the deadline is a `caution` answer with `fallback: true`, never an error.
- **Languages:** `language` must be `de`, `en` or `cs`; anything else is a `400`. Given, every text field is in it. Without it, the model answers in the language of the message (or of the screenshot's text), and a fallback answer is German. So in Indonesian and Khmer only the example is checked; any other text gets the demo notice, also with the backend on (`speaks()` in `api.js`), and a language switch to them with a real answer showing turns it into the notice. Otherwise a Khmer card could carry an English answer or a German fallback. Once the backend has `id` and `km` (ask 8), add them to `LANGUAGES` in `api.js`.
- **Persona:** the API answers as "O₂'s Scam‑Check" in O₂'s voice (`persona_o2.md` in the backend; its WhatsApp channel answers as Whalebone's "Mobee"). A live answer can mention O₂ or follow German conventions. The examples' stand-in answers are neutral, so a demo with the examples is too.
- **Screenshots** (in the backend's branches since 2026-10-27): an optional `image: { mime_type: image/jpeg · image/png · image/webp, data: <plain base64> }`, exactly one, at most 5 MB decoded; `message` becomes optional when an image is sent; the whole body may be 8 MiB (else `413`); a `mime_type` that doesn't match the bytes is a `400`. With an image, a first model call reads its text and links, so a link only in the screenshot is checked too. Check that dev1 takes images before relying on them live.
- `POST /v1/feedback { answer_id, rating: up · down, comment (max 500) }` → `200`. A second rating replaces the first; a foreign or unknown id is `404`.
- **Token:** an HS256 integration JWT (`client_id`, `user_id`, `exp`) goes raw into `Authorization`, without "Bearer". Every response carries a fresh one in `Wb-Token`, valid **15 minutes** (measured: the refreshed token expires 15 min after the call, whatever the original's expiry).
- **Limits:** 20 checks per `user_id` per UTC day (`429 QUOTA_EXCEEDED`), 60 per tenant per minute (`429 RATE_LIMITED`), and the proxy's own limit per client, user and IP (plain-text `429 Limit exceeded`). Feedback is free.
- **The front door answers everything without a token with a plain-text 401**, also `/health/check` and the CORS preflight (`OPTIONS`, verified 2026-10-22). A browser can't call it from another origin, so the page calls `/api` on its own origin: the Vite dev server proxies it (`API_PROXY` in `.env.development.local`), Netlify through `netlify/functions/api.mjs`.

**How the page reads the answer** (`showResult()` in `main.js`; `api.js` holds the type map):

| Backend field | Page |
|---|---|
| `answer_id` | the feedback call |
| `answer.verdict`: `scam` · `caution` · `legit` | `data-verdict` on the card |
| `answer.threat_type` | `scamType()`: `parcel_delivery` → parcel, `credential_phishing` and `banking_phishing` → account, `family_emergency` → family, `investment_crypto` → profit. The others (`payment_card_theft`, `malware_delivery`, `fake_shop`, `authority_impersonation`, `telecom_impersonation`, `other`, `none`) get the plain Trickser, no story, no share. Only for `scam`. |
| `answer.summary` (1 sentence) | the headline |
| `answer.explanation` (≤ 3 sentences) | the reason; domains in it get marked |
| `answer.official_domains` | marked green in the reason |
| `answer.what_to_do` (2–4) | "How to stay safe" |
| `answer.if_already_happened` (list, empty for `legit`) | joined into the help line; a phone number in it becomes a `tel:` link |
| `answer.impersonated_entity`, `language`, `fallback`, `timing`, `versions` | not shown |
| `links: [{ domain, signal }]` (**asked for, not built**) | `signal: strong` shows the protection card; the domains are marked red |

**Measured on dev1** (2026-10-22, 5 checks): 1.5–3.0 s round trips from the page through the dev proxy; one curl call took 5.1 s with `total_ms` 3.2 s. The 3.5 s loader minimum hides most of it. A German parcel SMS got `scam` / `parcel_delivery`; a fake bank login `scam` / `banking_phishing`; a dinner invitation from grandma `legit`. None named a domain, so nothing was marked.

**What the backend still needs for the page** (to ask the backend team):
1. **The protection signal.** The main upsell ("This site is on our blocklist") needs to know that a link is on the blocklist: `links: [{ domain, signal }]` at the top level of the response, from the service's ioclookup `signal`. TI to confirm that `strong` is exactly what the protection blocks. Until then no live answer shows the card, which is the safe side.
2. **The reason contract:** name the suspicious domain and the official one in `explanation`, written as in `links` and `official_domains`, so the page can mark them red and green.
3. **Threat types for the other three cards:** romance, tech support and the fake bank adviser or police have none. Ask for `romance`, `tech_support` and `bank_impersonation`, or an agreed map.
4. **A reason field for feedback:** the page sends its code (`wrong_verdict` · `unclear` · `not_helpful`) in `comment` for now.
5. **Shorter help:** `if_already_happened` came back with 1–3 sentences; one short sentence fits the help line.
6. `/health/check` is listed without auth in the swagger, but the front door wants a token.
7. **Screenshots:** does the deadline hold with an image, or do most screenshot checks come back as the fallback `caution`? The page allows 25 s for a check with a screenshot (15 s for text); the Netlify function stops after 9 s.
8. **Indonesian and Khmer** (since 2026-11-02): `id` and `km` in the `language` enum, and fallback texts in both. Until then the page checks only the examples in those languages (see "Languages" above).
9. **A neutral persona** (since 2026-11-02): an API persona without O₂'s name and voice, or one per `client_id`, so live answers fit whichever operator the demo is dressed for.

- **Kept from the PoC's brief:** the reason contract: 2 short sentences, where the link really goes and the real site, then what they're after. A domain that isn't in the text just isn't marked.
- **Dropped from the brief's demo:** the follow-up question with answer buttons, and the tip.
- **Share texts** exist for the four types the backend can send (parcel, account, family, profit), in every language. A type without `share.message.*` gets no share card.

## The protection (the upsell)

- **What it is:** Whalebone's DNS filter in the operator's mobile and home network checks each address against a list of known scam and malware sites, so the page never loads. Operators sell it under their own name (at O₂ Germany: "Onlineschutz"); here it's `{protection}` from `brand.js`.
- **Its limits:** it only works on the operator's own network (not on other Wi-Fi), and brand-new scam sites can slip through.
- **The pitch:** Scam Check found the domain in the same database the protection uses, so "With {protection}, you're already protected from this." It shows only for a link with `signal: strong`.
- **The page shows no prices:** they differ per operator and change with promotions.

## The page today

**Phones (one column):**
1. **Hero:** the gradient with the mark, the product name, an accent-coloured "Demo" tag and the language menu. H1 "Is this a scam?" and the lead "You’ll know in seconds."
2. **Form card:** it overlaps the hero.
   - The field, with a small "Use example" chip and an icon-only camera button inside its border. An attached screenshot shows as a thumbnail with a × in their place.
   - The empty-field hint.
   - "Check now" with a search icon.
3. **Slot below the form** shows one of:
   - the checking card: the Lupe (the magnifying glass) reads the message, takes the link to the blocklist book, thinks; one caption line per phase
   - the result:
     - the verdict card: a red-tinted head with a still picture (the Lupe has caught the Trickser in the type's costume) and the "Spotted: the Parcel Trickster" caption; then the headline, the reason (the scam domain and the real site, marked red and green), numbered steps, the help line and the feedback
     - the protection card (a still: your phone behind the shield)
     - "How the trick works": the type's story, the only cartoon that moves on the result
     - the share card and "Check another message"
   - the demo notice for any text other than the example
4. **"Know these 7 scams?"** below the slot, only while the slot is empty: a row of seven cards that scrolls sideways (name, one line, a still picture on the brand colour), with ← a scroll bar → under it. The cards don't open.

**Desktop (from 1024 px):** full-width rows, one thing at a time, no tiles side by side.
1. A compact hero (H1 64 px, the lead on one line, the rings in the free dark area at the top right).
2. One wide composer card overlapping the hero: the field (3 rows, growing to 8) and "Check now" to its right, bottom-aligned.
3. Below it, either the scam cards (whole cards that fill the composer's width: 3 at 1024, 4 from 1200 px), or the checking card (the drawing centred, at most 720 px), or the result.
4. The result as full-width cards, each split in two halves of the same height: verdict (tinted half with the still picture and its caption / the headline as title, the reason, steps, help, feedback), protection (phone and shield / words and button), the trick (scene / steps and rule), share as a slim band.

**A story** (on the result only): a cartoon of 9 s in three beats, the three steps under it as a little diagram (① — ② — ③, lit in step with the beats), and one rule to remember with a tick.

## UX decisions and why

Keep these unless you have a reason to change them. Round 1 comes first (the designer's verdict after its third review: ship as an internal PoC); the later rounds add to it, and the later round wins where they differ. UI labels are quoted in English; the German original is given where the decision was about its wording.

**Flow**
- One task. The H1 is the user's own question, so it fits any verdict.
- "Use example" only fills the field. It doesn't focus it, so no keyboard opens, and the user learns the flow: paste, then check.
- An empty check shows the hint and focuses the field. The button is never disabled.
- Text other than the example gets a neutral demo notice at once, with no fake checking. The example is recognised by its domain, so small edits still work.
- **One scroll.**
  - On check, the slot moves to the top of the screen and reserves a screen of height.
  - The checking card, then the result, swap in place.
  - Focus moves to the headline.
- Nothing in the loader may sound like "reply to the message", the one thing a scam target must not do.
- **Result order:** verdict card → protection → "How the trick works" → share → restart, on every screen size, so reading and tab order match what people see.
  - Feedback sits inside the verdict card because it rates the answer. Under two promo cards it would get fewer taps.
  - Its question sits above the Yes/No pills. Side by side doesn't fit below 390 px.
- **One filled button per view.** The form has "Check now". On the result, only the white protection button is filled; share is an outline button and restart is a text button.
- **The help line stays** (`if_already_happened`). It's the only help for people who already tapped the link. A phone number in it is a `tel:` link with a 48 px tap area.
- **Share:**
  - Touch devices get one "Share the warning" button that opens the native share sheet. Other devices get WhatsApp · Email · Copy.
  - No Facebook, because it drops the text. No "More …".
  - The shared text never contains the scam link, and the shared URL has no `?lang`.
  - Links show a preview (`public/og.jpg`).
- **Language switch while a result shows:**
  - The answer is fetched again in the new language.
  - The card stays fully in the old language (with a `lang` attribute) until the new answer arrives, then swaps all at once.
  - Meanwhile the language menu looks disabled.

**Mobile mechanics**
- While typing, the page keeps "Check now" 12 px above the keyboard via `visualViewport`.
- The textarea grows from 4 to 8 rows with the text. Its font is 16 px or more, or iOS zooms in; so is the language menu's.
- Hover styles only apply under `(hover: hover)`, so taps don't leave stuck hover states.
- Tap targets: 48 px for the field buttons (36 px visible), pills, feedback and the story button, the language menu and the popup's close button.

**Visual**
- One gradient per layout: the hero. The protection card is a solid brand colour.
- **The hero decoration only shows from 720 px:** on phones it would sit behind white text. (O₂'s bubble behind white text measured 2.3:1.)
- **Red is only the danger signal:** a `#D42E50` icon disk and a `#FFF0F3` tint. The headline stays near-black.
- **Contrast:** WCAG AA. Accessibility laws in many markets require it for consumer services (in the EU the European Accessibility Act, in Germany the BFSG).
  - field and pill borders `#6b7280`
  - placeholder `#6b7280`
- The "Demo" tag is accent-coloured so it doesn't read as a button. The language menu is a white outline pill.
- **Icons:** only the page's own set, recoloured via CSS mask; no emoji, no third-party sets. The thumbs are one icon, rotated for "No".

**Copy**
- See "Languages" for the voice in each language.
- **Characters that keep words together:**
  - no-break space in "7 scams" (so the number never ends a line alone) and in "2,99 €", and the protection's name never splits
  - no-break hyphen U+2011 in "Scam‑Check", "E‑Mail" and the hyphenated type names
  - the domain mark is `inline-block`
  - the example's URL sits on its own line

**Measured layout limits** (phones 360–390 px wide; measured with O₂'s On Air, Figtree runs close to it; `check.mjs` checks that every card name fits in every language)
- **Field button row:** fits only with an icon-only camera.
- **Verdict headline (26 px):** one span per sentence, so it breaks only between sentences.
- **H1:** at most 44 px below 400 px; at 48 px the German wraps at 360.
- **Card titles:** 22 px.
- **Wrapping:** the reason pills wrap 2 + 1; the share fallback pills wrap below 390 px.

### Round 2 (2026-10-20)

The designer's verdict on the concept: go with changes; on the build: ship once the family plate mask was redrawn (done).

**The cast and its grammar**
- One recurring villain, the Trickser: a lila blob with a bandit mask, cheeky, never scary. Each scam type gives him a costume: delivery cap and parcel, grey beanie and fishing rod with a reel, a paper-plate child's face on a stick, top hat and money sack, an orange bow tie behind a dating photo (orange, so red stays the danger signal).
- Your phone on the left is you, he stands on the right, and whatever moves to the right is lost. Every story ends with your coins at his feet: one ending, so the logic is learnt after the first story.
- Lila marks his things (his SMS, the fishing line, the crayon, the plate's stick, the hearts, the "coin?" bubble, his fingers on the photo), so the viewer sees the trick before the victim does. Hearts are lila, not red.
- The Lupe, a magnifying glass with eyes in the brand colour, is the page's helper: it reads in the loader and catches him on the result. **Only the Lupe may be a round face on a diagonal handle.** The first family mask (a ringed plate on a slanted stick) read as a second Lupe; now it's a plain white plate with a cap, a brand-dark fringe and pigtails, on a vertical lila stick, held by his hand in front (ink with a white rim like his other hands, not lila: lila on lila would vanish).
- Sticker style: a white rim and a brand-dark outline around the Trickser. Lila alone is 2.9:1 on the red verdict tint and 1.8:1 on the brand colour; graphics need 3:1.
- No words and no currency sign in the drawings, only ?, so one drawing serves every language and market; the steps under it carry the words.
- Characters may squash and hop. UI motion stays on a 200 ms easing with no overshoot.

**Stories**
- 9 s in three beats of 3 s, in step with the three steps ① — ② — ③ under the scene. One thing moves per beat; in beat ③ the money goes first, then the reveal.
- The storyboards (steps and rules are in `strings.js`):
  - Parcel: his SMS with a parcel and a coin → you tap, your card and a coin go into his pay page → the card flies to him, your coins follow, his parcel opens and a moth flutters out: empty.
  - Account: a padlock with a lila "?" → his login page comes down into your screen on his fishing line (lila hook), you type → he reels in your key, your coins follow.
  - Family: a "?" number with a heart → "?" with a coin and a clock, the plate face wobbles → your coins fly, the plate falls flat.
  - Profit: his crayon hops from his hand into your phone along a dotted arc and draws a chart that only goes up → you pay in, his sack grows, the crayon keeps drawing, then hops back → he runs off with the sack, the chart crashes.
  - Romance: hearts between your phone and a photo (his lila fingertips on both edges, his bandana tail peeking out) → "coin?", you send coins → the photo tips over, it was him, the heart breaks.
- **Play once, pausable** (WCAG 2.2.2). A story plays once when it is fully in view (95 %, or 80 % of a short screen), so nobody gets a half-seen start at the bottom edge, and rests on its last frame with all steps lit. Its 48 px button sits next to the heading, outside the drawing, and reads Pause / Play / Watch again. Leaving the screen mid-play resets it.
- **Reduced motion:** nothing plays and there is no button. Each scene shows its last frame, which tells the most (him with the loot; in the profit story he has already left), and all steps are lit. The loader stays still.
- The landing section hides while the slot shows anything and comes back with "Check another message": under a result it would dilute the protection moment, and the result has its own story.

**Loader**
- Phases set by `main.js`: read (1.7 s) → link (1.8 s) → think (until the answer) → done (0.7 s). The Lupe's path takes the first 3.5 s, which is also the minimum on screen for a fresh check: a quick answer still shows the work (labour illusion). The refetch after a language switch keeps the old card and shows no loader.
- With no link in the text, phase 2 says "Looking for known tricks…" and hides the link pill.
- Verdict-neutral: no red and no match signal before the answer. No progress bar: a bar that stalls reads as broken.
- The live region says "Checking…" once; then the headline gets focus. The phase captions are `aria-hidden`.

**Result**
- The spotted picture: his hands are up and his prop lies on the ground while the Lupe looks at him. A still since round 3.
- Round 2's "Real or fake?" block is folded into the reason since round 3. The real site stays plain text, not a link: step 1 says don't tap links, and typing the address yourself is the habit we teach.
- The reason gets a little grin: "The $2.99 fee is just bait …".
- `verdict: scam` with `type: null`: the plain Trickser, no tag, no story, no share card.
- The verdict scene is at most 120 px tall on phones, so step 1 of "How to stay safe" stays on the first screen at 390×844.
- The share card names the type: "The Parcel Trickster is doing the rounds."

**Desktop**
- From 1024 px; 720–1023 px stays one wide column.
- **Full-width rows, not side-by-side tiles.** The first desktop build put the form left and everything else right: two tiles of unequal height and a long empty left column on the result. The owner called it "meh". Each block is now one full-width card; where a card has two parts, it splits them into halves of the same height.
- **The protection straight after the verdict**, as a band, not a sticky box in a side rail: a rail reads like an ad, and next to a scam warning like a sales pitch. At 1440×900 it is one short scroll away.
- On check, the page scrolls only as far as the loader needs (`nearest`); phones still move the slot to the top.
- Ctrl/Cmd+Enter in the field checks the message.

**Copy and details**
- Lead: "You’ll know in seconds." ("immediately" over-promised with a 5 s wait).
- Removed at the owner's request: "Free. We don't open links.", a footer line and "Opens a page in German". A footer comes back for the imprint and the privacy notice.
- "Use example" is a small chip (36 px visible, 14 px text, 48 px tap area); the camera button matches.

**More measured limits**
- Steps: three columns of about 92 px at 360 px; each label has two lines reserved, so nothing jumps while they light up.
- The trick's story is 280 px tall on desktop, so the rule stays on a 900 px screen; 220 px on windows up to 860 px tall.

### Round 3 (2026-10-20)

The designer's verdict on the concept: go with changes (all four MUSTs taken); on the build: SHIP.

**Less motion**
- On the result only "How the trick works" moves, and the loader moves while checking. The owner asked for a fun wait in round 2 and didn't mention it after; ask before stilling it.
- The spotted scene and the protection picture are stills.
- The protection picture is your phone behind the shield, without the Trickser. The result showed him three times, and the hero of an operator's offer is the shield, not the villain.

**Verdict card**
- The tinted half (top on phones, left on desktop) holds the still picture with the "Spotted: …" caption under it, centred. Desktop screens up to 860 px tall top-align it, so the caption stays above the fold at 1024×768.
- The white half opens with the headline as its title: 26 px on phones, 34 px on desktop.
- The reason is the main message: 18 px on phones, 20 px on desktop, ink, line height 1.45 (1.75 in Khmer).
- It names both domains: the scam domain with the red mark, the real site with a green mark (`#DDF7EA`, ink text). Never use `#00DC7D` as a text colour: it's 1.9:1 on white. The words ("not the real …") carry the meaning, so colour isn't the only signal (WCAG 1.4.1).
- The marks have 2 px of padding on each side. More looked like a double space before them, or like an indent at the start of a line.
- A mark and the punctuation right after it sit in a `nowrap` span (`.glued`). After an inline-block, Chrome wrapped the comma to the next line at some widths.
- The steps are 18 px, as large as the reason, with 24 px above "How to stay safe", so the actions don't look secondary.

**Landing page**
- Round 3 replaced round 2's stories with still tiles that opened; round 4 replaced the tiles with the carousel below. Real pictures must follow the brand's image rules: no hooded-hacker stock photos.

**Copy**
- Placeholder, two or three short lines: "Paste the whole message,↵from a text, email or WhatsApp.↵A screenshot works too."
  - "Paste" is the word in the phone's own paste menu (also einfügen, Tempel, បិទភ្ជាប់).
  - It doesn't mention the link: "with the link" nudged people to copy the link itself, and a long press on a link can open a preview that loads the page on an iPhone.
  - Each line still reads as a sentence if a browser drops the line break.
- The card lines describe what he promises ("Promises quick, huge profits …"), never state it, so they don't read as our own promise.

### Round 4 (2026-10-20)

The designer's verdict on the concept: go with changes; on the build: SHIP.

**The carousel**
- The owner asked for it, so it reverses round 2's "no carousel, because most people never swipe one". What makes up for that:
  - on phones the next card peeks in (from 600 px whole cards instead, see below)
  - ← and → buttons under the row on every screen size
  - a bar between them that shows how far the row is scrolled
  - "7" in the heading, so swiping feels worth it, with a no-break space so it never ends a line alone. `check.mjs` compares it with the number of cards in every language.
- Native horizontal scroll with `scroll-snap`, no library. The `<ul>` is the scroller: `tabindex="0"` so arrow keys scroll it (Safari doesn't make scrollers focusable), labelled by the heading, read as "list, 7 items". It needs `role="list"`, because Safari drops the list role when `list-style` is none.
- **Phones (below 600 px):** the row runs to the screen edges. A card snaps to the centre: the cards before and after it peek in by about 33 px at 390, and the first and last stop at the page edge. With start snapping, 4 px of the previous card showed, which looked like a glitch. Card width `min(300px, 100% - 56px)`.
- **From 600 px:** whole cards only, inside the column, filling it exactly: 2 on tablets, 3 at 1024–1199, 4 from 1200 px (`--per-view` in `style.css`, read by `main.js` too). They snap to the start; the gap is 20 px. A card sliced at the window edge looked weird to the owner.
  - 8 px of padding on each side keep the card shadows. The gap is wider than that, so no sliver of a scrolled-out card, or its shadow, shows.
  - Four in view need at least 1164 px for the names to fit.
- Cards stretch to the tallest; the picture sits at the bottom, so the pictures line up.
- The arrows:
  - move by the cards in view (one on phones): → brings in the cards after the last one in view, or as many as remain. Back from the end retraces that way, so it shows no set you haven't seen.
  - aim at a card, not a distance, so a second press while the row still moves adds up
  - are labelled "Previous scams" / "Next scams"
  - are outline (white disc, 2 px ring), so "Check now" stays the only filled button
  - at the ends they dim with `aria-disabled`, not `disabled`, so a focused → keeps its focus
  - jump instead of scrolling smoothly with reduced motion
- The bar is `aria-hidden`; it's a scrollbar to look at.
- **The cards don't open.** Minimum text, as asked: the three steps and the rule stay in the result's story. Nothing looks tappable: no pointer, no hover.

**Seven types**
- Order: parcel, account, family, profit, romance, then bank and tech support. Scams that arrive as messages go first, because that's what people paste; the two last mostly start as calls and have no story yet.
- Each line says what he does, and what he's after. At most 3 lines in a 232 px column.
- The two last types show their name, costume and spotted picture on a result, but no "How the trick works" until a story is drawn (`hasStory()` in `scenes.js`).

**The pictures**
- A panel in the brand colour at the bottom of each white card, full width (the card clips the corners). Solid: the hero keeps the page's only gradient.
- The Trickser, 1.3× the story size, in his costume, standing on a flat brand-dark floor. His bait sits on the left:
  - parcel: his SMS with the parcel, a coin and a link; he holds the parcel
  - account: a fake login page on his fishing line
  - family: his two texts (? + heart, coin + clock), and he hides behind the plate face
  - profit: his crayon draws a chart that only goes up, on a brand-dark board like a trading app; he holds the sack
  - romance: hearts, and he holds the sweet photo beside him with his face visible (a covered face would twin the plate)
  - bank: shirt and tie, the handset at his ear, his bubble with a bank and a coin. No safe: it reads as "security", our own promise.
  - tech support: a headset; a lila alarm and his lila cursor on your laptop
- Everything except the floor gets a white rim from one SVG filter (`RIM`, defined once in the page): on the brand colour, grey, lila, brand-dark and orange alone stay under 3:1; white makes it.
- No red on the landing page.

### Backend integration (2026-10-22)

No designer review yet: the new states are stand-ins until caution and legit get their design.

**Flow**
- **The example keeps its stand-in answer** (`demo.js`), also when the backend is on: only the stand-in shows the full result (the protection card, the marks) until the backend sends `links`. Other text goes to the backend when `VITE_API_URL` is set, otherwise it gets the demo notice.
- `demo.js` answers in the backend's own shape, so the example and real messages run through the same `showResult()`.
- **Errors use the notice card** (one icon, one line, at most one outline button), after the loader:
  - no connection, timeout, token or server error: "We couldn’t check the message just now. Until then, don’t tap any links." with "Try again". A safety tip, because the person is holding a suspicious message.
  - a rate limit (`RATE_LIMITED` or the proxy's plain-text 429): "Lots of people are checking right now. Try again in a minute." with the retry.
  - the daily quota: "You’ve checked a lot of messages today. You can check more tomorrow.", without a button: a retry can't work today.
  - The text gets focus, like the headline after an answer. No "Done." phase before an error.
- **Over 4000 characters** (the backend's limit) gets the hint "That’s too long. Paste just the message itself." before any call. No `maxlength`: it would cut a pasted e-mail without saying so.
- **Language switch:** still fetches the answer again. With the real backend that's a new check: it counts against the daily quota, gets a new `answer_id` and could, rarely, change the verdict. If it fails, the card stays as it was, in its own language.
- **Token:** the page sends the configured token, then the one from each `Wb-Token`. After a 401 the page starts over once with the configured token.
- **Feedback** posts one after the other, so the reason after "No" can't land before the bare "No" (the backend keeps the last rating).

**Verdicts**
- **Only `scam` gets the Trickser** and the "Spotted" tag. A `caution` with a known type would overclaim: it means "we're not sure".
- `caution` (also the fallback): an orange disk (`#FFA55A`, ink icon: white would be 1.9:1) on a `#FFF4EA` tint. `legit`: a green disk with a tick, ink on `#DDF7EA`. "How to stay safe" stays the steps' title for both, which reads oddly over "Enjoy your dinner."; that's for their design.
- Nothing is red unless the backend flagged the domain (`links`), and nothing red on `legit`.

### Screenshots (2026-10-27)

The designer's verdict on the concept: go with changes (all MUSTs taken); on the build: SHIP once dev1 takes images.

**Attaching**
- The camera button opens the system picker (`accept="image/*"`: the photo library, the camera or files on phones). An image pasted into the field attaches too, but only when the clipboard has no text: Outlook, Word and others put a picture of the selection next to copied text, and pasting an e‑mail must paste the e‑mail. An empty text, which some apps add, doesn't count.
- No drag and drop: the picker and paste cover it, and a drop beside the field would open the image in the tab unless the whole window catches it.
- The label is "Add a screenshot", not "upload": nothing leaves the phone before "Check now".
- A third placeholder line says it can be done: "A screenshot works too." Desktop's 3 rows hold exactly the three lines.

**Prepared in the browser** (`image.js`): drawn anew as one JPEG (quality 0.85) of at most 4 megapixels, on white. So anything the browser can show works (HEIC on an iPhone, GIF), the declared type always matches the bytes, location data (EXIF) stays on the phone, and the request stays far below Netlify's 6 MB per function request. The cap is on pixels, not the long edge, so a tall scrolling screenshot keeps readable text. A file the browser can't show gets the hint "That image won’t work. Try another screenshot." and keeps any screenshot already attached.

**Attached**
- One at a time. The thumbnail takes the place of "Use example" and the camera, at the bottom of the field: the text above it doesn't move, and the field gets 2 rows, so "Check now" ends up a little higher, not lower. A camera beside a thumbnail would read as "add another", and "Use example" beside it would throw the screenshot away with no undo. To replace it: × then the camera; a new paste replaces it.
- The thumbnail is 64 px tall and keeps the picture's shape between 48 and 112 px wide, showing its top (where the sender is).
- The × is a 32 px white disc with an ink ring and a plain cross, sticking out 8 px past the corner, with a 48 px tap area. White with a ring shows on light and dark screenshots alike.
- Focus: after a pick, focus moves to × (the camera is gone); after ×, back to the camera; a paste keeps it in the field. `#status` says "Screenshot added.", "Screenshot removed." or the image hint. It is emptied first and filled a frame later, so the same message twice in a row is read out again.
- With a screenshot the text is optional, and the placeholder says so: "Anything to add? It’s optional." With neither, the hint is "Paste a message or add a screenshot first."

**Checking**
- Text, screenshot or both go to the backend. The example's stand-in answer is only for the example text without a screenshot; the notice's "Use example" removes the screenshot. Without the backend, a screenshot gets the demo notice like any other text.
- The loader's first caption is "Reading your screenshot…". Phase 2 looks up links only when the text has one: links inside the image aren't known before the answer.
- A "Check now" while the image is still being prepared waits for it before the loader starts.
- The screenshot stays attached after the answer, like the text; "Check another message" clears both, and a language switch checks both again.
- The result doesn't show the screenshot again.

### The rebrand (2026-11-02)

A product-designer review of the first rebrand (blue, a tick in the mark, `$` coins, Indonesian and Khmer sent to the backend without a language): NOT YET, close. Taken:
- **MUST:** the Khmer heading that split a word (new copy, and word joiners in compounds); coins without a currency sign; Indonesian and Khmer example-only with the backend on.
- **SHOULD:** a no-break space in "2,99 €"; the button's hover a darker brand colour (`color-mix`), not `brand-dark`, which is the busy look; loader captions shortened to one line in every language (instead of reserving two lines for all); Khmer at 16 px at least; Telegram for Cambodia.
- **COULD:** the language menu's 48 px tap area and ខ្មែរ on its pill; a magnifier in the mark instead of a tick; normal line height for the Khmer domain marks.
- **O₂ resemblance:** teal instead of blue, neutral greys and status colours, the cartoon orange and green shifted a little. Not taken: a flat hero (the owner wants the style kept) and moving the rings (they sit where O₂'s bubble sat, but rings in teal aren't a bubble).
- **Copy:** every Indonesian and Khmer change it proposed. Among them, „dari ini“ became „dari situs ini“, the Khmer steps got their passive right, and the Khmer demo and error notices got the usual words.
- Its alternative for the live backend, a fallback text in the page's language, isn't taken: the notice is simpler and tells the truth.

## Open items

Before a telco sees it:
- **Native speakers** read the Indonesian and Khmer copy (`strings.js` and the examples in `demo.js`), on a phone. The type names and the product name in Indonesian are the most important. The review above was a model's, not a native speaker's.
- **The cartoons' owner:** the Trickser and his cast were drawn for the O₂ PoC and were waiting for O₂'s sign-off as a brand asset. Clarify that Whalebone may show them to other operators.
- **The repo's history** still holds the O₂ brand files from before 2026-11-02, among them O₂'s licensed On Air font. Fine inside Whalebone; before sharing the repository itself with anyone outside, start a clean history.
- **Netlify:** link a site to this repo with `dev` as the production branch; for live answers set `VITE_API_URL=/api`, `SCAM_CHECK_URL` and `SCAM_CHECK_TOKEN`. Until then, check that the push to `dev` reached a site at all.
- **Live answers:** with the backend's O₂ persona (backend ask 9) a live answer can sound like O₂. For a demo, stay with the examples or get the neutral persona first.
- **Real devices:** Khmer on an Android phone and an iPhone (line heights, the font loading), the keyboard handling in Safari and Chrome with the example pasted, attaching a screenshot by tapping the camera.

Before real people use a pilot:
- **Legal, per market:** imprint and privacy links, plus one line on what happens to pasted text and screenshots (a screenshot shows more than the message: other chats, names, notifications). The backend stores every message with its answer, with no deletion yet. Check whether an AI notice is needed ("AI writes the answers. It can get things wrong.").
- **A token per visitor.** `netlify/functions/api.mjs` passes `/api` on with one shared test token: fine for a demo, but everyone shares its user's 20 checks a day and every check is stored under that user. For a pilot, the function mints a short token per request with the operator's `client_id` and a random `user_id` kept in an HttpOnly cookie, so the quota counts per browser. Not an IP hash: mobile customers share carrier NAT addresses. Needs the front door's secret and a `client_id` from the backend team. If the operator hosts the page, its backend does this.
- **Operator sign-off:** red as the scam signal, the protection's wording, and the Trickser with its lila grammar (a new kind of brand asset).
- **Backend asks** 1–9 above, most of all `links` for the protection card.

Next iteration:
- **Real API:** designs for the `caution` (orange) and `legit` (green) verdicts; the error states have stand-in copy.
- **Tracking:** example vs. own text, each check, the verdict, feedback and its reason, protection clicks and shares, screenshots added and checked, the language picked, stories watched to the end, the last card seen in the carousel. These answer the PoC's questions.
- **Stories** for the bank and tech-support types (9 s, three beats, steps `scam.*.s1–s3` and `scam.*.rule`), so their results get "How the trick works".
- **Share texts** for the other types, once the backend sends them.
- **A second example:** a scam without a link (the family scam).
- **Accessibility audit:** axe or Lighthouse, plus a VoiceOver run, including the carousel and the language menu.
- **Carousel at 500–599 px** (phones in landscape, split screen): the phone layout centres a 300 px card, so up to 271 px of the next one shows, cut at the window edge.
- **Carousel at 1024×768:** the arrows and the bar sit below the fold, so only the "7" says there are more than the three cards.
- **More languages** need their keys in every part of `strings.js`, an example in `demo.js`, the backend's language (ask 8), and a look at their script's line heights.

## How to iterate

1. Keep the dev server running (`runapp.bat`): http://localhost:5190. Add `?lang=de`, `?lang=id` or `?lang=km`.
2. Where things live:
   - texts: `src/strings.js` (every language)
   - operator-specific values: `src/brand.js`
   - styles: `src/style.css`
   - cartoons: `src/scenes.js`, their animations: `src/scenes.css`
   - markup: `index.html` (no texts)
   - behaviour: `src/main.js`
   - the demo answers: `src/demo.js`
3. `npm run check` runs the behaviour checks against the dev server. When you change behaviour on purpose, update `scripts/check.mjs` with it.
4. `npm run shots` writes every state to `shots/`:
   - `m…` phone 390 px English
   - `s…` small phones
   - `g…`, `i…`, `k…` German, Indonesian and Khmer at 360 px
   - `t…` the scam cards on a 768 px tablet
   - `d…` desktop 1440 and 1024 px
5. To check an animation, pause every animation at fixed times and take a screenshot of each moment, as a filmstrip (see the Gotchas in `CLAUDE.md`).
6. For any visible UX change, run a design review (below).
7. `npm run og` re-renders `public/og.jpg` after the hero title, the logo or the colours change.
8. `npm run build`, then commit and push to `dev`.

**Design review:**
- Start a general-purpose agent as a senior product designer (mobile-first consumer apps, anti-fraud UX, telcos in Europe and South-East Asia).
- Give it read-only access to:
  - this file
  - `src/brand.js` and `src/style.css`
  - the `shots/` folder
  - the source files
- Ask for:
  - MUST / SHOULD / COULD fixes, each naming its screenshot
  - exact copy for any new text, in every language
  - layout risks at 360–390 px, also in Khmer
  - a SHIP / NOT YET verdict
- Keep the same agent across rounds with SendMessage, and report your deviations back to it.
- Its standing checks:
  - the keyboard never hides the button
  - one scroll to the result
  - one filled button per view
  - feedback inside the result card
  - 48 px targets and AA contrast
  - copy word for word, in every language
  - no hero decoration behind text on phones
  - no mixed languages during a refresh
  - no operator's name unless the demo is dressed for that operator
  - every story readable frame by frame, anything moving longer than 5 s pausable, still frames with reduced motion
