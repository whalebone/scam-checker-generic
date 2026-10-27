# O₂ Scam-Check: product context and UX decisions

Read this before UI or UX work. It holds what the page is built on: the brief, the backend and how the page reads it, the O₂ Onlineschutz facts and the decisions from the product-designer reviews of round 1 (2026-10-19) and rounds 2, 3 and 4 (all 2026-10-20). Update it when a decision changes, so the next session doesn't redo the research.

## The product

- **What:** a customer pastes a suspicious SMS, e-mail or chat message and gets a clear answer in seconds: scam or not, why, and what to do now.
- **Who:** O₂ Telefónica Germany owns the page, the UX, approvals and traffic. Whalebone builds the backend (the "WhaleCheck API"), adds threat intelligence and sends a weekly usage report.
- **PoC goal:** learn how real people use it, live fast and better every week. The questions: what do people check, do they follow the advice, do they come back and upgrade? The brief wants every click tracked; tracking isn't built yet.
- **Sources:**
  - The brief deck, slides "Intro" to "Later": https://claude.ai/artifact/KEj3tMyfNzY3zh4sMZqTcy (org-shared; read it with the Artifact tool).
  - A desktop mock vibe-coded by O₂'s product manager, `onlineschutz.vercel.app/en/url-checker`: a URL checker inside an O₂ "Security" portal with a sidebar, comparing "Security Basis · free" with "Onlineschutz Smart".
  - The `o2-design` skill in `.claude/skills/`.

## What the owner asked for

These are the acceptance criteria for the page:

- A nice-looking, clean, minimalist O₂ page that follows the o2-design skill. Mobile first.
- Minimal text. The user always knows what to do next.
- One example case, no backend yet. Use only the key fields of the proposed response.
- Image upload exists, but for now it only shows a popup asking for patience. (Real since 2026-10-27, now that the backend takes images: see "Screenshots" below.)
- A feedback button on the answer.
- A share option when the result is a common scam: a call to protect other people, plus sharing to platforms.
- An upsell link to Onlineschutz that says explicitly: this site is already in our domain database, so with Onlineschutz you would already be protected. This is the main upsell moment.
- German and English from the start.

Round 2 (feedback on the deployed round 1, 2026-10-20):
- Separate UX for mobile and desktop; mobile was a good start.
- Expect about 5 s of backend time and make the wait a fun, engaging animation.
- Show the key scam types, with a super simple animated "diagram" of how each one works, explained like to a kindergartner: minimum words, animated characters, 5–10 s each, no walls of text. Show the detected type's animation on the result too.
- A smaller "Beispiel einfügen", but keep it.
- A more playful result ("Steer clear" was "meh"): bring in an element of the scam type, explain, recommend the real website.
- Drop „Kostenlos. Wir öffnen keine Links.“, the footer „Scam‑Check ersetzt keinen Virenschutz.“ and "Opens a page in German".
- The empty landing page gets scrolling information on the five threat types.

Round 3 (feedback on the deployed round 2, 2026-10-20):
- "A bit too busy overall": animation only for „So läuft der Trick“ on the result. None in the verdict card, the Onlineschutz card or on the landing page.
- The verdict headline becomes the title of the right half of the verdict card.
- No „Echt oder Fake?“ block: the description should say it in natural language.
- A more dominant description; it was "some weird small text".
- The landing page: 5 image tiles "for expansion", with an image placeholder.
- Improve the main message and the placeholder text.

Round 4 (feedback on the deployed round 3, 2026-10-20):
- A nice carousel for the scam types on the landing page, like O₂ CZ's „Alenčin atlas šmejdů“ on https://www.o2.cz/osobni/volani/kybersmejdi.
- Better graphics in the O₂ DE style.
- Clear one-line descriptions like O₂ CZ's.
- Optionally take over O₂ CZ's categories, "to already use what someone tested".
- "Super understandable overall with as minimum amount of text as possible."

## The backend (built; connected on 2026-10-22)

`github.com/whalebone/scam-check`, branch `ai-239-scam-check-mvp` (Jira epic AI-239; `main` is still the Go template). The contract is its `api/swagger.yml`, the reasons are in its `docs/DESIGN.md`. Running on dev1: `https://scam-check.dev1.whalebone.io`. Go, one Gemini call (`gemini-3.5-flash-lite` on Vertex AI, EU) after four evidence tools run in parallel (Whalebone threat intelligence via feed-warden, WHOIS, one HTTP probe, a TLS check), then a DNS check of the official domains. Answers are stored in Postgres with their id.

**Calls.** Both go through the front door, a `wb-auth-proxy`:
- `POST /v1/scam-check { message (max 4000), language: de · en · cs }` → `{ answer_id, answer, fallback, timing, versions }`. A model failure or an overrun of the 5 s deadline is a `caution` answer with `fallback: true`, never an error.
- **Screenshots (announced 2026-10-27, not on any pushed branch or dev1 yet):** an optional `image: { mime_type: image/jpeg · image/png · image/webp, data: <plain base64> }`, exactly one, at most 5 MB decoded; `message` becomes optional when an image is sent (one of the two is required); the whole body may be 8 MiB (else `413`); a `mime_type` that doesn't match the bytes is a `400`. `language` binds the answer's language, so the page always sends its own. Today's backend ignores the unknown `image`, still requires `message` and refuses bodies over 1 MiB: until it ships, a screenshot alone fails and one with text is checked as text only. So the page's screenshot support must not deploy before the backend's.
- `POST /v1/feedback { answer_id, rating: up · down, comment (max 500) }` → `200`. A second rating replaces the first; a foreign or unknown id is `404`.
- **Token:** an HS256 integration JWT (`client_id`, `user_id`, `exp`) goes raw into `Authorization`, without "Bearer". Every response carries a fresh one in `Wb-Token`, valid **15 minutes** (measured: the refreshed token expires 15 min after the call, whatever the original's expiry).
- **Limits:** 20 checks per `user_id` per UTC day (`429 QUOTA_EXCEEDED`), 60 per tenant per minute (`429 RATE_LIMITED`), and the proxy's own limit per client, user and IP (plain-text `429 Limit exceeded`). Feedback is free.
- **The front door answers everything without a token with a plain-text 401**, also `/health/check` and the CORS preflight (`OPTIONS`, verified 2026-10-22). A browser can't call it from another origin, so the page calls `/api` on its own origin: the Vite dev server proxies it (`API_PROXY` in `.env.development.local`), Netlify will with a redirect (prepared in `netlify.toml`).

**How the page reads the answer** (`showResult()` in `main.js`; `api.js` holds the type map):

| Backend field | Page |
|---|---|
| `answer_id` | the feedback call |
| `answer.verdict`: `scam` · `caution` · `legit` | `data-verdict` on the card (the brief said `ok`; it's `legit`) |
| `answer.threat_type` | `scamType()`: `parcel_delivery` → Paket‑Trickser, `credential_phishing` and `banking_phishing` → Konto‑Knacker, `family_emergency` → Hallo‑Mama, `investment_crypto` → Goldesel. The others (`payment_card_theft`, `malware_delivery`, `fake_shop`, `authority_impersonation`, `telecom_impersonation`, `other`, `none`) get the plain Trickser, no story, no share. Only for `scam`. |
| `answer.summary` (1 sentence) | the headline |
| `answer.explanation` (≤ 3 sentences) | the reason; domains in it get marked |
| `answer.official_domains` | marked green in the reason (was `link.imitates`) |
| `answer.what_to_do` (2–4) | „So bleibst du sicher“ |
| `answer.if_already_happened` (list, empty for `legit`) | joined into the help line; „116 116“ stays a `tel:` link |
| `answer.impersonated_entity`, `language`, `fallback`, `timing`, `versions` | not shown |
| `links: [{ domain, signal }]` (**asked for, not built**) | `signal: strong` shows Onlineschutz; the domains are marked red |

**Measured on dev1** (2026-10-22, 5 checks: 1 by curl, 4 from the page): 1.5–3.0 s round trips from the page through the dev proxy; the curl call took 5.1 s with `total_ms` 3.2 s. The 3.5 s loader minimum hides most of it. The example SMS got `scam` / `parcel_delivery` / Zoll; a fake Sparkasse login `scam` / `banking_phishing`; „Hallo, kommst du heute Abend zum Essen? … Oma“ `legit`. The answers follow the O₂ voice, but none named a domain, so nothing was marked.

**What the backend still needs for the page** (to ask the backend team):
1. **The Onlineschutz signal.** The page's main upsell („Die Seite steht auf unserer Sperrliste“) needs to know that a link is on the blocklist. The service already has ioclookup's `signal` per domain; asked: `links: [{ domain, signal }]` at the top level of the response. TI to confirm that `strong` is exactly what Onlineschutz blocks. Until then no answer shows the card, which is the safe side.
2. **The reason contract:** name the suspicious domain and the official one in `explanation`, written as in `links` and `official_domains`, so the page can mark them red and green.
3. **Threat types for the other three cards:** romance (Liebes‑Lügner), tech support (Support‑Spion) and the fake bank adviser or police (Schein‑Banker) have none. Ask for `romance`, `tech_support` and `bank_impersonation`, or an agreed map.
4. **A reason field for feedback:** the page sends its code (`wrong_verdict` · `unclear` · `not_helpful`) in `comment` for now.
5. **Shorter help:** `if_already_happened` came back with 1–3 sentences; one short sentence fits the help line.
6. `/health/check` is listed without auth in the swagger, but the front door wants a token.
7. **Screenshots** (from the designer's concept review, 2026-10-27): are links read from an image looked up in threat intelligence? If not, a screenshot never gets Onlineschutz, the main upsell. Does the 5 s deadline hold with an image, or do most screenshot checks come back as the fallback `caution`? The page allows 25 s for a check with a screenshot (15 s for text), for the upload from a phone; the Netlify function still stops after 9 s.

- **Kept from the brief:** the reason contract (round 4): 2 short sentences, where the link really goes and the real site, then what they're after. A domain that isn't in the text just isn't marked.
- **Dropped from the brief's demo:** the follow-up question with answer buttons, and the tip.
- **Type names from the deck**, shown on the page since round 2: Paket‑Trickser, Konto‑Knacker, Hallo‑Mama‑Schwindler, Goldesel, Liebes‑Lügner. English: Parcel Trickster, Account Cracker, Hi‑Mum Faker, Golden Goose, Love Liar.
- **Two types from O₂ CZ** (round 4), not in the deck: Schein‑Banker / Bogus Banker (`bank_impersonation`: poses as the bank or the police, wants your money in a „sicheres Konto“) and Support‑Spion / Support Spy (`tech_support`: fake tech support, wants remote access). CZ's seventh, „Pan Naléhavý“ (Mr Urgent: panic, then a fake link), is the Konto‑Knacker here.
- **Share texts** exist for the four types the backend can send (parcel, account, family, profit; the last three written on 2026-10-22, not reviewed yet). A type without `share.message.*` gets no share card. Romance, bank and tech support need theirs once the backend sends them.
- **Later ideas in the brief:** screenshots and images (built 2026-10-27), WhatsApp and other messengers, the "Oma Hilde" avatar, and a place inside the O₂ Security Hub (2027).

## O₂ Onlineschutz (the upsell)

- **Page:** https://www.o2online.de/extras/cloud-sicherheit/onlineschutz/. Its headline is "O₂ Onlineschutz: Vor Betrug, Datenklau & Gefahrenseiten." with "Automatisch im O₂ Netz. Ohne Installation."
- **How it works:**
  - A DNS filter in the O₂ mobile and home network checks each address against a list of known scam and malware sites, so the page never loads.
  - It does not work on other Wi-Fi networks, and brand-new scam sites can slip through.
  - The Plus tier adds a McAfee app and VPN.
- **Prices conflict** between sources (1,99 € with a 12-month term vs. 6 months free, then 2,49 € monthly, promo until 19.11.2026). **The page shows no prices.**
- **The pitch:** Scam-Check found the domain in the same database that Onlineschutz uses. Hence "Mit Onlineschutz bist du davor schon geschützt." It is shown only when `link.status === 'malicious'`.

## The page today

**Phones (one column):**
1. **Hero:** Blauverlauf (the O₂ blue gradient) with the logo, "Scam-Check", a Light Blue "Demo" tag and the DE|EN switch. H1 "Ist das Betrug?" and the lead „In Sekunden weißt du Bescheid.“
2. **Form card:** it overlaps the hero.
   - The field, with a small "Beispiel einfügen" chip and an icon-only camera button inside its border. An attached screenshot shows as a thumbnail with a × in their place.
   - The empty-field hint.
   - "Jetzt prüfen" with a search icon.
3. **Slot below the form** shows one of:
   - the checking card: the Lupe reads the message, takes the link to the blocklist book, thinks; one caption line per phase
   - the result:
     - the verdict card: a pink head with a still picture (the Lupe has caught the Trickser in the type's costume) and the „Durchschaut: Paket‑Trickser“ caption; then the headline, the reason (it names the scam domain and the real site, marked red and green), numbered steps, the 116 116 help line and the feedback
     - the Onlineschutz card (a still: your phone behind the shield)
     - „So läuft der Trick“: the type's story, the only cartoon that moves on the result
     - the share card and "Andere Nachricht prüfen"
   - the demo notice for any text other than the example
4. **„Kennst du diese 7 Maschen?“** below the slot, only while the slot is empty: a row of seven cards that scrolls sideways (name, one line, a still picture on Beyond Blue), with ← a scroll bar → under it. The cards don't open.

**Desktop (from 1024 px):** full-width rows, one thing at a time, no tiles side by side.
1. A compact hero (H1 64 px, the lead on one line, a small bubble in the free dark area).
2. One wide composer card overlapping the hero: the field (3 rows, growing to 8) and "Jetzt prüfen" to its right, bottom-aligned.
3. Below it, either the scam cards (the same row, whole cards that fill the composer's width: 3 at 1024, 4 from 1200 px), or the checking card (the drawing centred, at most 720 px), or the result.
4. The result as full-width cards, each split in two halves of the same height: verdict (pink half with the still picture and its caption / the headline as title, the reason, steps, help, feedback), Onlineschutz (phone and shield / words and button), the trick (scene / steps and rule), share as a slim band.

**A story** (on the result only, since round 3): a cartoon of 9 s in three beats, the three steps under it as a little diagram (① — ② — ③, lit in step with the beats), and one rule to remember with a tick.

## UX decisions and why

Keep these unless you have a reason to change them. Round 1 comes first (the designer's verdict after its third review: ship as an internal PoC); **rounds 2 and 3** below add to it, and the later round wins where they differ.

**Flow**
- One task. The H1 is the user's own question, so it fits any verdict. Phones get one column; desktop gets two since round 2.
- "Beispiel einfügen" only fills the field. It doesn't focus it, so no keyboard opens, and the user learns the flow: paste, then check.
- An empty check shows the hint and focuses the field. The button is never disabled.
- Text other than the example gets a neutral demo notice at once, with no fake checking. The example is recognised by its domain, so small edits still work.
- **One scroll.**
  - On check, the slot moves to the top of the screen and reserves a screen of height.
  - The checking card, then the result, swap in place.
  - Focus moves to the headline.
- Nothing in the loader may sound like "reply to the message" (e.g. "Antwort schreiben"), the one thing a scam target must not do. Round 1's checklist became the Lupe loader in round 2.
- **Result order:** verdict card → Onlineschutz → „So läuft der Trick“ (round 2) → share → restart, on every screen size, so reading and tab order match what people see.
  - Feedback sits inside the verdict card because it rates the answer. Under two promo cards it would get fewer taps.
  - Its question sits above the Ja/Nein pills. Side by side doesn't fit below 390 px.
- **One filled button per view.** The form has "Jetzt prüfen". On the result, only the white Onlineschutz button is filled; share is an outline button and restart is a text button.
- **The 116 116 line stays** (the `if_it_happened` field). It's the only help for people who already tapped the link. It's a `tel:` link with a 48 px tap area.
- **Share:**
  - Touch devices get one "Warnung teilen" button that opens the native share sheet. Other devices get WhatsApp · E-Mail · Kopieren.
  - No Facebook, because it drops the text. No "Mehr …".
  - The shared text never contains the scam link, and the shared URL has no `?lang`.
  - Links show a branded preview (`public/og.jpg`).
- **Screenshot button:** a camera icon only. Until 2026-10-27 it opened a "coming soon" popup as a fake door; now it attaches a screenshot (see "Screenshots" below).
- **Language switch while a result shows:**
  - The answer is fetched again in the new language.
  - The card stays fully in the old language (with a `lang` attribute) until the new answer arrives, then swaps all at once.
  - Meanwhile the switch looks disabled.

**Mobile mechanics**
- While typing, the page keeps "Jetzt prüfen" 12 px above the keyboard via `visualViewport`.
- The textarea grows from 4 to 8 rows with the text. Its font is 16 px or more, or iOS zooms in.
- Hover styles only apply under `(hover: hover)`, so taps don't leave stuck hover states.
- Tap targets: 48 px for the field buttons (36 px visible since round 2), pills, feedback and the story button; 44 px for the switch and the popup's close button.

**Brand and visual**
- Per the brand rules, one gradient per layout: the hero (the functional variant from the skill). The Onlineschutz card is solid Beyond Blue.
- **The bubble only shows from 720 px.**
  - On phones it sat behind white text: 2.3:1 contrast, and the brand keeps white text on the dark part of the gradient.
  - It's a CSS background, so phones don't download it.
- **Red:** O₂ red is officially reserved for price stickers. Here it's only the danger signal: an `#D42E50` icon disk and an `#FFF0F3` tint. The headline stays near-black. O₂ sign-off is still open.
- **Contrast:** WCAG AA, because Germany's accessibility law (BFSG) covers O₂'s consumer services.
  - field and pill borders `#73737D`
  - placeholder `#73737D`
- The "Demo" tag is Light Blue so it doesn't read as a button. The switch is a white outline pill.
- **Icons:** only O₂ icons from the skill, recoloured via CSS mask; no emoji, no third-party sets. The thumbs are O₂'s "Success" icon, rotated for "Nein".

**Copy**
- O₂ voice: short and spoken, no exclamation marks.
  - German: "du", „…“, "Wir prüfen …" with a space before the ellipsis.
  - English: British, with ’ and ‘…’, "Checking…" with no space.
- The product name is "Scam-Check" in German and "Scam Check" in English.
- **Typography:**
  - Page text writes `O<sub>2</sub>`, because On Air has no ₂.
  - In English, "Onlineschutz" sits in `lang="de"`.
- **Characters that keep words together:**
  - no-break space in "2,99 €" and "straight away"
  - no-break hyphen U+2011 in "Scam‑Check" and "E‑Mail"
  - the domain tag is `inline-block`
  - the example's URL sits on its own line
- In English, the 116 116 line adds "or your bank", because many English speakers in Germany have foreign cards.

**Measured layout limits** (On Air metrics, phones 360–390 px wide)
- **Field button row:** German only fits with an icon-only camera.
- **Verdict headline (26 px):** one span per sentence, so it breaks only between sentences.
- **H1:** at most 44 px below 400 px; at 48 px the German wraps at 360.
- **Card titles:** 22 px. The Onlineschutz title takes 2 lines at 22 px and 3 at 26.
- **Popup title:** one line only because the icon sits above it.
- **Wrapping:** the reason pills wrap 2 + 1; the share fallback pills wrap below 390 px.

**Not taken from the PM's portal mock:**
- portal chrome
- the stats row (zeros look broken)
- the empty result placeholder
- check history (privacy, no login)
- the tips block and prices
- "Network Protection" naming
- a link-only input (scams without a link need the text)
- side-by-side layouts (desktop has split cards since round 2, but no tiles side by side)

**Taken from it:**
- the "you check yourself → it stops automatically" contrast
- the product name next to the logo
- the icon in the main button
- the "we don't open links" reassurance (dropped in round 2 at the owner's request)
- white cards on soft grey

### Round 2 (2026-10-20)

The designer's verdict on the concept: go with changes; on the build: ship once the Hallo-Mama mask was redrawn (done, with its SHOULDs and most COULDs).

**The cast and its grammar**
- One recurring villain, „der Trickser“: a lila blob with a bandit mask, cheeky, never scary. Each scam type gives him a costume: delivery cap and parcel, grey beanie and fishing rod with a reel, a paper-plate child's face on a stick, top hat and money sack, an orange bow tie behind a dating photo (orange, so red stays the danger signal).
- Your phone on the left is you, he stands on the right, and whatever moves to the right is lost. Every story ends with your coins at his feet: one ending, so the logic is learnt after the first story.
- Lila marks his things (his SMS, the fishing line, the crayon, the plate's stick, the hearts, the „€?“ bubble, his fingers on the photo), so the viewer sees the trick before the victim does. Hearts are lila, not red.
- The Lupe, a Beyond Blue magnifying glass with eyes, is O₂'s helper: it reads in the loader and catches him on the result. **Only the Lupe may be a round face on a diagonal handle.** The first Hallo-Mama mask (a ringed plate on a slanted stick) read as a second Lupe; now it's a plain white plate with a cap, a Dark Blue fringe and pigtails, on a vertical lila stick, held by his hand in front (ink with a white rim like his other hands, not lila: lila on lila would vanish).
- Sticker style: a white rim and a Dark Blue outline around the Trickser. Lila alone is 2.9:1 on the pink verdict tint and 1.8:1 on Beyond Blue; graphics need 3:1.
- No words in the drawings except € and ?, so one drawing serves both languages; the steps under it carry the words.
- Characters may squash and hop. UI motion stays on the 200 ms brand easing with no overshoot.

**Stories**
- 9 s in three beats of 3 s, in step with the three steps ① — ② — ③ under the scene. One thing moves per beat; in beat ③ the money goes first, then the reveal.
- The storyboards (steps and rules are in `strings.js`):
  - Paket: his SMS with a parcel and a coin → you tap, your card and a coin go into his pay page → the card flies to him, your coins follow, his parcel opens and a moth flutters out: empty.
  - Konto: a padlock with a lila "?" → his login page comes down into your screen on his fishing line (lila hook), you type → he reels in your key, your coins follow.
  - Hallo Mama: a "?" number with a heart → "?" with € and a clock, the plate face wobbles → your coins fly, the plate falls flat.
  - Goldesel: his crayon hops from his hand into your phone along a dotted arc and draws a chart that only goes up → you pay in, his sack grows, the crayon keeps drawing, then hops back → he runs off with the sack, the chart crashes.
  - Liebes‑Lügner: hearts between your phone and a photo (his lila fingertips on both edges, his bandana tail peeking out) → „€?“, you send coins → the photo tips over, it was him, the heart breaks.
- **Play once, pausable** (WCAG 2.2.2, binding through the BFSG). A story plays once when it is fully in view (95 %, or 80 % of a short screen), so nobody gets a half-seen start at the bottom edge, and rests on its last frame with all steps lit. Its 48 px button sits next to the heading, outside the drawing, and reads Pause / Abspielen / Nochmal ansehen. Leaving the screen mid-play resets it. Round 2's spotted scene (1.3 s) and Onlineschutz scene (3 s) are stills since round 3.
- **Reduced motion:** nothing plays and there is no button. Each scene shows its last frame, which tells the most (him with the loot; in Goldesel he has already left), and all steps are lit. The loader stays still.
- **Landing page:** round 2 stacked the five stories on phones and showed them one at a time on desktop. Round 3 replaced both with still tiles, round 4 with a carousel of still cards (below).
- The landing section hides while the slot shows anything and comes back with "Andere Nachricht prüfen": under a result it would dilute the Onlineschutz moment, and the result has its own story.

**Loader**
- Phases set by `main.js`: read (1.7 s) → link (1.8 s) → think (until the answer) → done (0.7 s). The Lupe's path takes the first 3.5 s, which is also the minimum on screen for a fresh check: a quick answer still shows the work (labour illusion). The refetch after a language switch keeps the old card and shows no loader.
- With no link in the text, phase 2 says „Wir suchen nach bekannten Maschen …“ and hides the link pill.
- Verdict-neutral: no red and no match signal before the answer. No progress bar: a bar that stalls reads as broken.
- The live region says „Wir prüfen …“ once; then the headline gets focus. The phase captions are `aria-hidden`.

**Result**
- „Durchschaut: Paket‑Trickser“, not „Erwischt“: "caught" suggests the danger is over while the SMS is still in the inbox.
- The spotted picture: his hands are up and his prop lies on the ground while the Lupe looks at him. Round 2 animated it; it's a still since round 3.
- Round 2's „Echt oder Fake?“ block (the scam domain with a red cross, the real site with a green tick) is folded into the reason since round 3. The real site stays plain text, not a link: step 1 says don't tap links, and typing the address yourself is the habit we teach.
- The reason gets a little grin: „Die 2,99 € sind nur der Köder …“.
- `verdict: scam` with `type: null`: the plain Trickser, no tag, no story, no share card.
- The verdict scene is at most 120 px tall on phones, so step 1 of „So bleibst du sicher“ stays on the first screen at 390×844.
- The share card names the type: „Der Paket‑Trickser ist gerade viel unterwegs.“

**Desktop**
- From 1024 px; 720–1023 px stays one wide column.
- **Full-width rows, not side-by-side tiles.** The first desktop build put the form left and everything else right: two tiles of unequal height, a long empty left column on the result, and the bubble half covered. The owner called it "meh". Each block is now one full-width card; where a card has two parts, it splits them into halves of the same height.
- **Onlineschutz straight after the verdict**, as a band, not a sticky box in a side rail: a rail reads like an ad, and next to a scam warning like a sales pitch. At 1440×900 it is one short scroll away.
- Round 2 top-aligned the verdict head, because the headline sat in it and fell below the fold at 1024×768 when centred. Since round 3 the headline heads the white half and the picture is centred in the pink half.
- On check, the page scrolls only as far as the loader needs (`nearest`); phones still move the slot to the top.
- The bubble is 190 px and sits between the language switch and the composer, behind no text.
- Ctrl/Cmd+Enter in the field checks the message.

**Copy and details**
- Lead: „Wir sagen dir in Sekunden, woran du bist.“ ("sofort" over-promised with a 5 s wait).
- Removed at the owner's request: „Kostenlos. Wir öffnen keine Links.“, the footer and "Opens a page in German". A footer comes back for Impressum and Datenschutz.
- "Beispiel einfügen" is a small chip (36 px visible, 14 px text, 48 px tap area); the camera button matches.

**More measured limits**
- Steps: three columns of about 92 px at 360 px; each label has two lines reserved, so nothing jumps while they light up.
- The longest name, „Hallo‑Mama‑Schwindler“ at 22 px, is about 250 px: it fits a 296 px card.
- The trick's story is 280 px tall on desktop, so the rule stays on a 900 px screen; 220 px on windows up to 860 px tall.

### Round 3 (2026-10-20)

The designer's verdict on the concept: go with changes (all four MUSTs taken); on the build: SHIP, with most SHOULDs and COULDs taken.

**Less motion**
- On the result only „So läuft der Trick“ moves, and the loader moves while checking. The owner asked for a fun wait in round 2 and didn't mention it now; ask before stilling it.
- The spotted scene and the Onlineschutz picture are stills; their keyframes are gone from `scenes.css`.
- The Onlineschutz picture is your phone behind the shield, without the Trickser. The result showed him three times, and the hero of an O₂ offer is the shield, not the villain.

**Verdict card**
- The pink half (top on phones, left on desktop) holds the still picture with the „Durchschaut: …“ caption under it, centred. Desktop screens up to 860 px tall top-align it, so the caption stays above the fold at 1024×768.
- The white half opens with the headline as its title: 26 px on phones, 34 px on desktop.
- The reason is the main message: 18 px on phones, 20 px on desktop, ink, line height 1.45.
- It replaces „Echt oder Fake?“ by naming both domains: the scam domain with the red mark, the real site with a green mark (`#DDF7EA`, ink text). Never use `#00DC7D` as a text colour: it's 1.9:1 on white. The words („nicht zum echten“) carry the meaning, so colour isn't the only signal (WCAG 1.4.1).
- The marks have 2 px of padding on each side. More looked like a double space before them, or like an indent at the start of a line.
- A mark and the comma or full stop right after it sit in a `nowrap` span (`.glued`). After an inline-block, Chrome wrapped the comma to the next line at 167–171 and 321–325 px.
- The steps are 18 px, as large as the reason, with 24 px above „So bleibst du sicher“, so the actions don't look secondary.

**Landing page tiles** (replaced by the carousel in round 4)
- Five still tiles replace the stories. Each is a `<details name="scam-types">`, so one opens at a time without JavaScript.
  - Closed: a picture slot, the name, one line and a blue „So läuft der Trick“ with O₂'s plus icon, which turns into a cross when open. O₂'s arrows are heavy block arrows that read as "download", and there is no chevron.
  - Open: the three steps as a numbered list and the rule, without a cartoon.
  - White cards with a picture look tappable, so they do something. "For expansion" in the owner's words.
- The picture is a placeholder until there are real images: the Trickser in the type's costume.
  - Phones: a 72 px square left of the text.
  - Desktop: 2:1 on top, so real images can drop in without moving anything, and the second row starts on a 900 px screen.
  - Real images must follow the brand image rules: no hooded-hacker stock photos.
- Phones and up to 1023 px: one tile per row.
- Desktop: 3 + 2, the second row centred on a 6-column grid. Five across would leave about 147 px for „Hallo‑Mama‑Schwindler“ at 1024 px.
  - `align-items: start`, so an open tile doesn't stretch its neighbours.
  - The line has two lines reserved, so closed tiles in a row end level.
- The tiles don't use `.card`: its padding from 720 px would sit around the summary. The line under the name is a `span`, because `<summary>` takes no `<p>`.
- Opening a tile closes the open one; if that one is above, the tapped tile would jump up. Chrome's scroll anchoring makes up for it, Safari has none, so `main.js` scrolls the difference back. Still to check on a real iPhone.
- Not taken: a sixth desktop tile linking back to the field („Andere Masche? Prüf sie oben.“) to fill 3 + 3.

**Copy**
- Lead (until round 4): „Füg die Nachricht ein. In Sekunden weißt du, ob du ihr trauen kannst.“ (a no-break space after „weißt“, so phones don't break before „du“) / "Paste the message. In seconds, you’ll know if you can trust it." It names the outcome in the user's words and fits all three verdicts.
- Placeholder, two lines of at most 31 characters: „Die ganze Nachricht einfügen,↵aus SMS, E‑Mail oder WhatsApp.“ / "Paste the whole message,↵from a text, email or WhatsApp."
  - „einfügen“ / "Paste" is the word in the phone's own paste menu.
  - It doesn't mention the link: „gern mit Link“ nudged people to copy the link itself, and a long press on a link can open a preview that loads the page on an iPhone.
  - Each line still reads as a sentence if a browser drops the line break.
- Tile lines are `scam.*.text` in `strings.js` (rewritten in round 4). Goldesel says „angeblich ohne Risiko“ / "supposedly risk-free", so it doesn't read as our own promise.

**Measured limits**
- Tile names on phones are 17 px: „Hallo‑Mama‑Schwindler“ (about 193 px) fits the about 214 px next to the 72 px picture at 360 px.
- Desktop tiles are about 304 px wide at 1024 px, so the name at 20 px fits.
- At 1024×768 the verdict picture is 200 px tall and fills the pink half's width. Don't make it taller.

### Round 4 (2026-10-20)

The designer's verdict on the concept: go with changes (all MUSTs taken, deviations below); on the build: SHIP, with all SHOULDs and COULDs taken (centred snap on phones, `role="list"`, the dark chart board, the no-break space in „7 Maschen“, the count checked).

**The carousel**
- The owner asked for it, so it reverses round 2's "no carousel, because most people never swipe one". What makes up for that:
  - on phones the next card peeks in (from 600 px whole cards instead, see below)
  - ← and → buttons under the row on every screen size
  - a bar between them that shows how far the row is scrolled
  - „7“ in the heading, so swiping feels worth it, with a no-break space so it never ends a line alone. `check.mjs` compares it with the number of cards.
- Native horizontal scroll with `scroll-snap`, no library. The `<ul>` is the scroller: `tabindex="0"` so arrow keys scroll it (Safari doesn't make scrollers focusable), labelled by the heading, read as "list, 7 items". It needs `role="list"`, because Safari drops the list role when `list-style` is none. The designer suggested a `role="region"` wrapper; the list itself keeps its semantics with one level less, and the CSS stays simple.
- **Phones (below 600 px):** the row runs to the screen edges (16 px past the column on each side). A card snaps to the centre: the cards before and after it peek in by about 33 px at 390, and the first and last stop at the page edge. With start snapping, 4 px of the previous card showed (edge 16 px, gap 12 px), which looked like a glitch. Card width `min(300px, 100% - 56px)` (272 px at 360, so „Hallo‑Mama‑Schwindler“ fits at 20 px).
- **From 600 px (since 2026-10-22):** whole cards only, inside the column, filling it exactly: 2 on tablets, 3 at 1024–1199, 4 from 1200 px, where the column stops growing (`--per-view` in `style.css`, read by `main.js` too). They snap to the start; the gap is 20 px. Before, the desktop row ran past the composer to the window edge, where a card was sliced at an arbitrary point. The owner found that weird.
  - This reverses round 4's "the next card peeks in on every width". The designer agreed: a peek inside the column would be a cut card again, just moved inwards, and a fade (`mask-image`) would also fade the list's focus ring. Enough says there's more: the bar's thumb covers 57 % of the track at 1440, 43 % at 1024 and 29 % at 768; → is blue while ← is grey; the heading says „7“.
  - 8 px of padding on each side keep the card shadows. The gap is wider than that, so no sliver of a scrolled-out card, or its shadow, shows. With a 12 px gap on tablets the two shadows added up to a grey band at the edge.
  - Cards jump from 365 px at 1199 to 269 px at 1200. Four in view need at least 1164 px for the names to fit. At 269 px „Hallo‑Mama‑Schwindler“ uses 220 of its 229 px: a longer name would break here (`check.mjs` checks the names at 1280).
- Cards stretch to the tallest; the picture sits at the bottom, so the pictures line up.
- The arrows:
  - move by the cards in view (one on phones): → brings in the cards after the last one in view, or as many as remain (1–3, 4–6, 5–7 at 1024). Back from the end retraces that way (5–7, 4–6, 1–3), so it shows no set you haven't seen.
  - aim at a card, not a distance, so a second press while the row still moves adds up (before, it could get lost)
  - are labelled „Vorherige Maschen“ / „Nächste Maschen“ ("Previous scams" / "Next scams")
  - are outline (white disc, 2 px ring), so „Jetzt prüfen“ stays the only filled button
  - at the ends they dim with `aria-disabled`, not `disabled`, so a focused → keeps its focus
  - jump instead of scrolling smoothly with reduced motion
- The bar is `aria-hidden`; it's a scrollbar to look at.
- **The cards don't open.** Minimum text, as asked: the three steps and the rule stay in the result's story. Nothing looks tappable: no pointer, no hover.
- Not taken: a tap on a peeking card scrolls it in (it would make cards interactive).

**Seven types, from O₂ CZ**
- Order: parcel, account, family, profit, romance, then bank and tech support. Scams that arrive as messages go first, because that's what people paste; the two new ones mostly start as calls and have no story yet. Hallo‑Mama is among the three cards visible at 1024 px.
- Each line follows CZ's pattern: what he does, and what he's after. At most 3 lines in a 232 px column.
- The two new types show their name, costume and spotted picture on a result, but no „So läuft der Trick“ until a story is drawn (`hasStory()` in `scenes.js`).

**The pictures** ("better graphics in the O₂ DE style")
- A Beyond Blue panel at the bottom of each white card, full width (the card clips the corners). Solid blue: the hero keeps the page's only gradient.
- The Trickser, 1.3× the story size, in his costume, standing on a flat Dark Blue floor (a nod to CZ's talent-show podium; a lit Light Blue podium outshone him). His bait sits on the left:
  - Paket: his SMS with the parcel, a coin and a link; he holds the parcel
  - Konto: a fake login page on his fishing line
  - Hallo‑Mama: his two texts (? + heart, coin + clock), and he hides behind the plate face
  - Goldesel: his crayon draws a chart that only goes up, on a Dark Blue board like a trading app (green on white was 1.8:1); he holds the sack
  - Liebes‑Lügner: hearts, and he holds the sweet photo beside him with his face visible (a covered face would twin the plate)
  - Schein‑Banker: shirt and tie, the handset at his ear, his bubble with a bank and a coin. No safe: it reads as "security", our own promise.
  - Support‑Spion: a headset; a lila alarm and his lila cursor on your laptop
- Everything except the floor gets a white rim from one SVG filter (`RIM`: feMorphology dilate, defined once in the page). On Beyond Blue the grey beanie is 2.8:1, lila 1.8:1, Dark Blue 2.6:1 and orange 3.0:1; white makes 5.9:1. Sticker style, like the Trickser's own rim.
- No bubbles (7 would break the limit of 5) and no red on the landing page.

**Less text** (the owner: "as minimum amount of text as possible")
- Lead: „In Sekunden weißt du Bescheid.“ / "You’ll know in seconds." The field and the chip already say „einfügen“.
- The reason: 2 sentences (see the contract above): „Der Link führt zu paket-zoll-de.info, nicht zum echten zoll.de. Die 2,99 € sind nur der Köder für deine Kartendaten.“
- Onlineschutz drops „automatisch“ / "automatically": "before it loads" already says it. „Die Seite steht auf unserer Sperrliste“ (the owner's must) and „Ohne Installation“ stay.
- Kept as they were: the placeholder, steps, 116 116, feedback, share card and the upload popup.

### Backend integration (2026-10-22)

No designer review yet: the new states are stand-ins until caution and legit get their design.

**Flow**
- **The example keeps its stand-in answer** (`demo.js`), also when the backend is on: the owner wants it "on the side, for now", and only the stand-in shows the full result (Onlineschutz, marks) until the backend sends `links`. Other text goes to the backend when `VITE_API_URL` is set, otherwise it gets the demo notice as before.
- `demo.js` answers in the backend's own shape, so the example and real messages run through the same `showResult()`.
- **Errors use the notice card** (one icon, one line, at most one outline button), after the loader:
  - no connection, timeout (15 s), token or server error: „Wir konnten die Nachricht gerade nicht prüfen. Tipp so lange auf keinen Link.“ / "We couldn’t check the message just now. Until then, don’t tap any links." with „Nochmal versuchen“ / "Try again". A safety tip, because the person is holding a suspicious message.
  - a rate limit (`RATE_LIMITED` or the proxy's plain-text 429): „Gerade prüfen sehr viele. Versuch es in einer Minute noch mal.“ with the retry.
  - the daily quota: „Du hast heute schon viele Nachrichten geprüft. Morgen geht’s weiter.“, without a button: a retry can't work today.
  - The text gets focus, like the headline after an answer. No „Fertig.“ phase before an error.
- **Over 4000 characters** (the backend's limit) gets the hint „Das ist zu lang. Füg nur die Nachricht selbst ein.“ before any call. No `maxlength`: it would cut a pasted e-mail without saying so.
- **Language switch:** still fetches the answer again. With the real backend that's a new check: it counts against the daily quota, gets a new `answer_id` and could, rarely, change the verdict. If it fails, the card stays as it was, in its own language.
- **Token:** the page sends the configured token, then the one from each `Wb-Token`. That one lasts 15 minutes, so after a 401 the page starts over once with the configured token.
- **Feedback** posts one after the other, so the reason after „Nein“ can't land before the bare „Nein“ (the backend keeps the last rating).

**Verdicts**
- **Only `scam` gets the Trickser** and the „Durchschaut“ tag. A `caution` with a known type would overclaim: it means "we're not sure".
- `caution` (also the fallback): an O₂ orange disk (`#FFA55A`, ink icon: white would be 1.9:1) on a `#FFF4EA` tint. `legit`: an O₂ green disk with a tick, ink on `#DDF7EA`. „So bleibst du sicher“ stays the steps' title for both, which reads oddly over „Genieße das Abendessen.“; that's for their design.
- Nothing is red unless the backend flagged the domain (`links`), and nothing red on `legit`.

### Screenshots (2026-10-27)

The backend takes one image per check (see "The backend"). The designer's verdict on the concept: go with changes (all MUSTs taken); on the build: SHIP once dev1 takes images, with COULDs 2, 4, 5 and 6 taken. Not taken: a grey tile while a picture is prepared (rare, and one more state) and a loader shot with the screenshot caption (the dev server only shows the loader when it's live; `check.mjs` checks the caption).

**Attaching**
- The camera button opens the system picker (`accept="image/*"`: the photo library, the camera or files on phones). An image pasted into the field attaches too (Ctrl+V after Win+Shift+S), but only when the clipboard has no text: Outlook, Word and others put a picture of the selection next to copied text, and pasting an e‑mail must paste the e‑mail. An empty text, which some apps add, doesn't count.
- No drag and drop: the picker and paste cover it, and a drop beside the field would open the image in the tab unless the whole window catches it.
- The label is „Screenshot hinzufügen“ / "Add a screenshot", not „hochladen“: nothing leaves the phone before „Jetzt prüfen“.
- A third placeholder line says it can be done: „Geht auch als Screenshot.“ / "A screenshot works too." An icon-only camera was fine for a fake door, not for a real feature. Desktop's 3 rows hold exactly the three lines.

**Prepared in the browser** (`image.js`): drawn anew as one JPEG (quality 0.85) of at most 4 megapixels, on white. So anything the browser can show works (HEIC on an iPhone, GIF), the declared type always matches the bytes, location data (EXIF) stays on the phone, and the request stays far below Netlify's 6 MB per function request (base64 adds a third). The cap is on pixels, not the long edge, so a tall scrolling screenshot keeps readable text. A file the browser can't show (or, in theory, still over 4 MB) gets the hint „Mit diesem Bild klappt es nicht. Versuch einen anderen Screenshot.“ and keeps any screenshot already attached.

**Attached**
- One at a time. The thumbnail takes the place of „Beispiel einfügen“ and the camera, at the bottom of the field: the text above it doesn't move, and the field gets 2 rows, so „Jetzt prüfen“ ends up a little higher, not lower. A camera beside a thumbnail would read as "add another", and „Beispiel einfügen“ beside it would throw the screenshot away with no undo. To replace it: × then the camera; a new paste replaces it.
- The thumbnail is 64 px tall and keeps the picture's shape between 48 and 112 px wide, showing its top (where the sender is). 48, not 36: a 32 px × hid most of a 36 px one.
- The × is a 32 px white disc with an ink ring (`--ink-3`) and O₂'s plain cross (`Cancel_outline`; O₂'s `Cross_outline` is the circled one), sticking out 8 px past the corner, with a 48 px tap area. White with a ring shows on light and dark screenshots alike.
- Focus: after a pick, focus moves to × (the camera is gone); after ×, back to the camera; a paste keeps it in the field. `#status` (now outside the slot, which is hidden on the landing page) says „Screenshot hinzugefügt.“, „Screenshot entfernt.“ or the image hint. It is emptied first and filled a frame later, so the same message twice in a row is read out again. × also clears the image hint.
- With a screenshot the text is optional, and the placeholder says so: „Noch etwas dazu? Geht auch ohne.“ / "Anything to add? It’s optional." With neither, the hint is „Füg zuerst eine Nachricht oder einen Screenshot ein.“

**Checking**
- Text, screenshot or both go to the backend. The example's stand-in answer is only for the example text without a screenshot; the notice's „Beispiel einfügen“ removes the screenshot. Without the backend, a screenshot gets the demo notice like any other text.
- The loader's first caption is „Wir lesen deinen Screenshot …“ / "Reading your screenshot…". Phase 2 looks up links only when the text has one: links inside the image aren't known before the answer.
- A „Jetzt prüfen“ while the image is still being prepared waits for it before the loader starts (usually under 300 ms; a 48 MP photo on a slow phone can take a second).
- The screenshot stays attached after the answer, like the text; „Andere Nachricht prüfen“ clears both, and a language switch checks both again.
- The result doesn't show the screenshot again.

## Open items

Before anyone outside the team gets the link:
- **Legal:** Impressum and Datenschutz links, plus one line on what happens to pasted text and screenshots (a screenshot shows more than the message: other chats, names, notifications). Check whether the AI Act needs "Die Antworten erstellt eine KI. Fehler sind möglich." / "AI writes the answers. It can get things wrong."
- **Real devices:** test the keyboard handling on an iPhone in Safari and an Android phone in Chrome, with the example pasted. So far it's only verified in automation. Also attach a screenshot by tapping the camera: the × that gets focus should show no focus ring after a tap (s05 shows it after programmatic focus in automation), and a big photo should be ready in about a second.
- **O₂ sign-off:** red as the scam signal, the Onlineschutz wording, and the Trickser with its lila grammar (a new kind of brand asset).
- **Footer:** Impressum and Datenschutz (removed in round 2 together with its old line).
- **Netlify:** check that the site is linked to this repo with `dev` as the production branch.

To go live with the backend (diagrams, test results and the order of the steps: https://claude.ai/artifact/DaYUz7hgcne8c39s2gY9kF):
- **A token per visitor.** Since 2026-10-22 (the owner's OK) `netlify/functions/api.mjs` passes `/api` on with one shared test token from the Netlify variable `SCAM_CHECK_TOKEN`: fine for the team, but everyone shares its user's 20 checks a day, every check is stored under that user, and it expires on 2026-11-04. Before anyone outside the team: the function mints a short token per request instead, with O₂'s `client_id` and a random `user_id` kept in an HttpOnly cookie, so the quota counts per browser. Not an IP hash: O₂ mobile customers share carrier NAT addresses, so one id would pool many people's quota. Needs the front door's secret and O₂'s `client_id` from the backend team. If O₂ hosts the page later, O₂'s backend does this.
- **Netlify:** set `VITE_API_URL=/api`, `SCAM_CHECK_URL` and `SCAM_CHECK_TOKEN` in the Netlify UI and redeploy. Then check on the live site that dev1 accepts calls from Netlify's servers and which client IP the front door sees (the function sends the visitor's in `X-Forwarded-For`).
- **Backend asks** 1–7 above, most of all `links` for Onlineschutz.
- **Screenshots go live with the backend's image support** on dev1, not before (see "The backend"). Before that push, check one scam screenshot and one harmless one end to end through the Netlify function, which stops after 9 s.
- **Legal:** the backend stores every message with its answer, with no deletion yet. The page needs its line on what happens to pasted text before real people use it.

Next iteration:
- **Real API:** designs for the `caution` (orange) and `legit` (green) verdicts; the error states have stand-in copy (round "Backend integration" above).
- **Tracking:** example vs. own text, each check, the verdict, feedback and its reason, Onlineschutz clicks and shares. These answer the PoC's questions. Since 2026-10-27: screenshots added (picked or pasted), removed and checked, and the verdicts by input (text, screenshot, both); the fake door's tap count is gone. Since round 2 also: stories watched to the end, pauses and replays; since round 4: the last card seen in the carousel and the arrow presses.
- **Share texts** for the six types other than `parcel_scam`.
- **Stories** for Schein‑Banker and Support‑Spion (9 s, three beats, steps `scam.*.s1–s3` and `scam.*.rule`), so their results get „So läuft der Trick“.
- **Animation smoothness** on a low-end Android phone.
- **Second example:** a scam without a link („Hallo Mama“).
- **Accessibility audit:** axe or Lighthouse, plus a VoiceOver run, including the carousel (the focusable list, the arrows at the ends).
- **Carousel at 500–599 px** (phones in landscape, split screen): the phone layout centres a 300 px card, so up to 271 px of the next one shows, cut at the window edge again.
- **Carousel at 1024×768:** the arrows and the bar sit below the fold, so only the „7“ says there are more than the three cards. The designer's option: the arrows in the heading row, on desktop only. Not taken yet; people scroll anyway, because the pictures are cut at the bottom.

## How to iterate

1. Keep the dev server running (`runapp.bat`): http://localhost:5180. Add `?lang=en` for English.
2. Where things live:
   - texts: `src/strings.js` (both languages)
   - styles: `src/style.css`
   - cartoons: `src/scenes.js`, their animations: `src/scenes.css`
   - markup: `index.html` (no texts)
   - behaviour: `src/main.js`
   - the demo answer: `src/demo.js`
3. `npm run check` runs the behaviour checks against the dev server. When you change behaviour on purpose, update `scripts/check.mjs` with it.
4. `npm run shots` writes every state to `shots/`:
   - `m…` phone 390 px German
   - `s…` small phones
   - `e…` English at 360 px
   - `t…` the scam cards on a 768 px tablet
   - `d…` desktop 1440 and 1024 px
5. To check an animation, pause every animation at fixed times and take a screenshot of each moment, as a filmstrip (see the Gotchas in `CLAUDE.md`).
6. For any visible UX change, run a design review (below).
7. `npm run og` re-renders `public/og.jpg` after the hero title or the logo changes.
8. `npm run build`, then commit and push to `dev`. That deploys.

**Design review:**
- Start a general-purpose agent as a senior product designer (mobile-first consumer apps, anti-fraud UX, German telco).
- Give it read-only access to:
  - this file
  - the o2-design skill (`SKILL.md`, `README.md`, `colors_and_type.css`, `assets/icons/`)
  - the `shots/` folder
  - the source files
- Ask for:
  - MUST / SHOULD / COULD fixes, each naming its screenshot
  - exact German and English copy for any new text
  - layout risks at 360–390 px
  - a SHIP / NOT YET verdict
- Keep the same agent across rounds with SendMessage, and report your deviations back to it.
- Its standing checks:
  - the keyboard never hides the button
  - one scroll to the result
  - one filled button per view
  - feedback inside the result card
  - 48 px targets and AA contrast
  - copy word for word
  - no bubble behind text on phones
  - no mixed languages during a refresh
  - since round 2: every story readable frame by frame, anything moving longer than 5 s pausable, still frames with reduced motion
