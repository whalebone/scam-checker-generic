// Small SVG cartoons. No words and no currency inside (only ?), so they work in every language and market.
// Only the stories and the loader move (CSS in scenes.css); the card pictures, the spotted scene and the
// protection picture are still.
// The grammar of every story: your phone on the left is you, the Trickser on the right is him,
// lila marks his things, and whatever moves to the right is lost. Each story ends with your coins at his feet.
// at() places a part with a transform attribute; the class on the <g> inside it is what scenes.css animates
// (a CSS transform would replace the attribute). Without animation every scene shows its first beat.
import { BRAND } from './brand.js'

// The order of the cards on the landing page: scams that come as messages first (that's what people paste),
// then the two that mostly start as calls. bank_impersonation and tech_support have no story yet.
export const SCAM_TYPES = [
  'parcel_scam',
  'account_phishing',
  'family_impersonation',
  'fake_profit',
  'romance_scam',
  'bank_impersonation',
  'tech_support',
]

const INK = '#0b1220'
// The brand's colours (brand.js), so the drawings change with the page.
const BLUE = BRAND.colors.brand
const DARK = BRAND.colors['brand-dark']
const LIGHT = BRAND.colors.accent
const SOFT = BRAND.colors['brand-soft']
const LILA = '#a078ff'
const LILA_SOFT = '#ece4ff'
const ORANGE = '#ffa94d'
const ORANGE_DARK = '#c9701c' // the rim on a coin
const GREEN = '#22d38a'
const RED = '#d1304d'
const GREY = '#c4c9d2'

const at = (x, y, cls, inner, attrs = '') => `<g transform="translate(${x} ${y})"><g class="${cls}" ${attrs}>${inner}</g></g>`
const svg = (name, viewBox, inner) =>
  `<svg class="sc sc-${name}" viewBox="${viewBox}" aria-hidden="true" focusable="false">${inner}</svg>`
const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="5" fill="${INK}" opacity=".08"/>`
const text = (x, y, size, fill, content) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${fill}">${content}</text>`

// ---------- Props, drawn around their own centre ----------

// A coin without a currency sign, so it is money in every market: a gold disc, its rim and a shine.
const COIN = `<circle r="9" fill="${ORANGE}"/><circle r="5.6" fill="none" stroke="${ORANGE_DARK}" stroke-width="1.8"/>
  <path d="M-6.4-2.6A6.9 6.9 0 0 1-2.6-6.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`
const CARD = `<rect x="-17" y="-11" width="34" height="22" rx="4" fill="${BLUE}"/><rect x="-17" y="-6" width="34" height="4" fill="${DARK}"/><rect x="-12" y="2" width="8" height="5" rx="1.5" fill="${ORANGE}"/>`
const KEY = `<circle cx="-9" r="6" fill="none" stroke="${ORANGE}" stroke-width="4"/><path d="M-3 0H13M9 0V5M13 0V6" fill="none" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round"/>`
const HEART_D = 'M0 10C-6 5-11 1-11-4C-11-8-8-10.5-5.5-10.5C-3-10.5-1-9 0-7C1-9 3-10.5 5.5-10.5C8-10.5 11-8 11-4C11 1 6 5 0 10Z'
const HEART = `<path d="${HEART_D}" fill="${LILA}"/>`
// The same heart in two halves, so it can break.
const HEART_L = `<path d="M0 10C-6 5-11 1-11-4C-11-8-8-10.5-5.5-10.5C-3-10.5-1-9 0-7L-2-2L1 2L-1 6Z" fill="${LILA}"/>`
const HEART_R = `<path d="M0 10C6 5 11 1 11-4C11-8 8-10.5 5.5-10.5C3-10.5 1-9 0-7L-2-2L1 2L-1 6Z" fill="${LILA}"/>`
const SPARK = `<path d="M0-8L2-2L8 0L2 2L0 8L-2 2L-8 0L-2-2Z" fill="${ORANGE}"/>`
const BOX = `<rect x="-16" y="-10" width="32" height="26" rx="3" fill="${ORANGE}"/><rect x="-3" y="-10" width="6" height="26" fill="${INK}" opacity=".15"/><rect x="5" y="3" width="8" height="6" rx="1" fill="#fff"/>`
const LID = `<rect x="-18" y="-16" width="36" height="7" rx="2" fill="${ORANGE}"/><rect x="-3" y="-16" width="6" height="7" fill="${INK}" opacity=".15"/>`
// The moth that flutters out of an empty box.
const MOTH = `<path d="M0-1C-4-9-12-9-11-2C-10 4-3 3 0 1C3 3 10 4 11-2C12-9 4-9 0-1Z" fill="#fff" stroke="${GREY}" stroke-width="1.5"/><path d="M0-5V5" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`
const SACK = `<path d="M-8-14C-12-20-4-24 0-20C4-24 12-20 8-14C18-8 20 14 10 18C4 20-4 20-10 18C-20 14-18-8-8-14Z" fill="${ORANGE}"/><path d="M-8-14H8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><g transform="translate(0 5) scale(.95)">${COIN}</g>`
const CLOCK = `<circle r="7" fill="#fff" stroke="${LILA}" stroke-width="2"/><path d="M0-4V0L3 2" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`
// The "Hallo Mama" disguise: a paper plate with a child's face (cap, fringe, pigtails) on his lila stick, held from below.
// No ring and no slanted handle: only the Lupe is a round face on a diagonal handle. The stick ends at (0, 42).
const PLATE = `<path d="M0 18V42" stroke="${DARK}" stroke-width="6.5" stroke-linecap="round"/><path d="M0 18V42" stroke="${LILA}" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="-20" cy="3" r="5.5" fill="${DARK}"/><circle cx="20" cy="3" r="5.5" fill="${DARK}"/>
  <circle r="20" fill="#fff"/>
  <path d="M-16-7C-12-1-7-3-5-7C-3-2 3-2 5-7C7-3 12-1 16-7C15-14 9-17 0-17C-9-17-15-14-16-7Z" fill="${DARK}"/>
  <path d="M-15-11C-14-26 14-26 15-11Z" fill="${LIGHT}"/><path d="M-12-12C-18-11-26-10-30-12C-26-15-18-15-12-15Z" fill="${LIGHT}"/>
  <circle cx="-6" cy="2" r="2.4" fill="${INK}"/><circle cx="6" cy="2" r="2.4" fill="${INK}"/>
  <path d="M-7 9Q0 15 7 9" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
// His hand in front of the stick.
const HAND = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="${INK}" stroke="#fff" stroke-width="3"/>`
const HELD_PLATE = at(-2, -8, 'f-mask', PLATE) + HAND(-2, 30)
// His lila crayon, tip at (0, 0).
const CRAYON = `<g transform="rotate(35)"><rect x="-4" y="-30" width="8" height="22" rx="2" fill="${LILA}" stroke="${DARK}" stroke-width="1.5"/><path d="M-4-8L0 0L4-8Z" fill="${LILA}" stroke="${DARK}" stroke-width="1.5" stroke-linejoin="round"/></g>`
// A dating profile: a smiling photo, a name and a heart.
const PROFILE = `<rect x="-42" y="-46" width="84" height="92" rx="12" fill="#fff"/>
  <rect x="-34" y="-38" width="68" height="58" rx="8" fill="${LIGHT}"/>
  <path d="M-22 20C-22 6-12 1 0 1C12 1 22 6 22 20Z" fill="#fff"/>
  <circle cy="-14" r="12" fill="#fff"/>
  <path d="M-13-12C-16-30 16-30 13-12C12-20 6-24 0-24C-6-24-12-20-13-12Z" fill="${ORANGE}"/>
  <circle cx="-4.5" cy="-14" r="1.8" fill="${INK}"/><circle cx="4.5" cy="-14" r="1.8" fill="${INK}"/>
  <path d="M-4-8Q0-4 4-8" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <rect x="-30" y="28" width="34" height="6" rx="3" fill="${GREY}"/>
  <g transform="translate(24 31) scale(.7)">${HEART}</g>`
// A telephone handset, upright: earpiece on top, mouthpiece at the bottom.
const HANDSET = `<path d="M3-13C-5-6-5 6 3 13" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <rect x="-1" y="-20" width="11" height="10" rx="4" fill="${INK}"/><rect x="-1" y="10" width="11" height="10" rx="4" fill="${INK}"/>`
const SHIELD = `<path d="M0-40L32-28V-2C32 20 17 33 0 41C-17 33-32 20-32-2V-28Z" fill="#fff"/>
  <path d="M-12 0L-3 9L13-8" fill="none" stroke="${BLUE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`

// ---------- The Trickser: about 64 units tall, facing left towards your phone ----------
// Sticker style (white rim, brand-dark outline), so he keeps 3:1 contrast on white, the red tint and the brand colour.

const BODY = 'M2-33C21-32 32-17 31 2C30 21 17 32-1 32C-19 32-31 19-31 0C-31-19-17-34 2-33Z'
const HATS = {
  cap: `<path d="M-21-23C-21-42 21-42 21-23Z" fill="${ORANGE}"/><path d="M-12-22C-19-21-28-20-37-21C-34-26-26-28-14-25Z" fill="${ORANGE}"/>`,
  beanie: `<path d="M-22-21C-22-44 22-44 22-21Z" fill="${GREY}"/><rect x="-24" y="-26" width="48" height="8" rx="4" fill="${GREY}"/><circle cy="-43" r="6" fill="${GREY}"/>`,
  tophat: `<rect x="-15" y="-60" width="30" height="28" rx="3" fill="${INK}"/><rect x="-15" y="-40" width="30" height="5" fill="${ORANGE}"/><rect x="-24" y="-34" width="48" height="6" rx="3" fill="${INK}"/>`,
  bowtie: `<path d="M0 24L-11 17V31Z M0 24L11 17V31Z" fill="${ORANGE}"/><circle cy="24" r="3" fill="${ORANGE}"/>`,
  // Shirt and tie: the bank clerk.
  tie: `<path d="M-11 17L0 23L11 17L7 30C3 32-3 32-7 30Z" fill="#fff"/><path d="M-3 20H3L2 24H-2Z M-2 24H2L4 30L0 33L-4 30Z" fill="${DARK}"/>`,
  // A headset with a microphone at his mouth: the support hotline.
  headset: `<path d="M-28-8C-30-46 30-46 28-8" fill="none" stroke="${INK}" stroke-width="4"/>
    <rect x="-34" y="-17" width="10" height="17" rx="4" fill="${INK}"/><rect x="24" y="-17" width="10" height="17" rx="4" fill="${INK}"/>
    <path d="M-30 0C-30 12-21 16-12 15" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="-10" cy="15" r="4" fill="${INK}"/>`,
}
const ARMS = {
  down: [[-27, 10, -37, 23], [27, 10, 37, 23]],
  up: [[-25, -6, -38, -26], [25, -6, 38, -26]],
  hold: [[-27, 6, -41, 14], [27, 10, 37, 23]],
  rod: [[-27, 4, -38, 2], [27, 10, 37, 23]],
  phone: [[-27, 2, -36, -8], [27, 10, 37, 23]], // the handset at his ear
  stick: [[27, 10, 37, 23]], // the other hand holds the plate's stick in front of him (HAND)
}
const MOUTHS = {
  grin: `<path d="M-10 9Q0 19 10 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  oh: `<ellipse cy="13" rx="4.5" ry="5.5" fill="${INK}"/>`,
}

function trickster({ arms = 'down', mouth = MOUTHS.grin, hat = '', front = '' } = {}) {
  const lines = ARMS[arms].map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join('')
  const hands = ARMS[arms].map(([, , x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')
  return `<g fill="#fff" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="${lines}"/>${hands}<path d="${BODY}"/></g>
    <path d="${lines}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><g fill="${INK}">${hands}</g>
    <path d="${BODY}" fill="${LILA}" stroke="${DARK}" stroke-width="2.5"/>
    <path d="M-29-16C-14-22 14-22 29-16L28-4C16 0 7-3 0-7C-7-3-16 0-28-4Z M27-13L38-19L36-7Z M27-9L39-3L31 1Z" fill="${INK}"/>
    <circle cx="-11" cy="-10" r="4.6" fill="#fff"/><circle cx="11" cy="-10" r="4.6" fill="#fff"/>
    <g class="pupils"><circle cx="-12.5" cy="-10" r="2.3" fill="${INK}"/><circle cx="9.5" cy="-10" r="2.3" fill="${INK}"/></g>
    ${mouth}${HATS[hat] ?? ''}${front}`
}

// ---------- Your phone: 64 × 112, its screen runs from (5, 9) to (59, 103) ----------

const phone = (screen) => `<rect width="64" height="112" rx="13" fill="${DARK}"/>
  <rect x="5" y="9" width="54" height="94" rx="8" fill="#fff"/>
  <rect x="25" y="3.5" width="14" height="2.5" rx="1.25" fill="${BLUE}"/>${screen}`

// A lila message from him: from an unknown number ("?"), with one picture.
const hisSms = (y, picture) => `<rect x="9" y="${y}" width="46" height="30" rx="8" fill="${LILA_SOFT}"/>
  <circle cx="20" cy="${y + 15}" r="7" fill="${LILA}"/>${text(20, y + 19, 11, '#fff', '?')}
  <g transform="translate(40 ${y + 15}) scale(.72)">${picture}</g>`

// ---------- The Lupe: handle to the bottom right ----------

const LUPE = `<path d="M17 17L31 31" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/>
  <circle r="24" fill="#fff" stroke="${BLUE}" stroke-width="7"/>
  <ellipse cx="-8" cy="-3" rx="4" ry="5.5" fill="${INK}"/><ellipse cx="8" cy="-3" rx="4" ry="5.5" fill="${INK}"/>
  <circle cx="-6.5" cy="-5" r="1.6" fill="#fff"/><circle cx="9.5" cy="-5" r="1.6" fill="#fff"/>
  <path d="M-5 8Q0 12 5 8" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`

// ---------- Five stories: 9 s, three beats of 3 s, in step with the list under the scene ----------
// Your phone at (36, 44), the Trickser at (250, 112). Coins start apart, so they land as a pile.

const coins = (x, y) => [[-6, 0], [6, 0], [0, -8]].map(([dx, dy], i) => at(x + dx, y + dy, `coin c${i + 1}`, COIN, 'opacity="0"')).join('')
const yourPhone = (cls, screen) => at(36, 44, cls, phone(screen))
const floor = shadow(68, 163, 36) + shadow(250, 152, 30)

const STORIES = {
  // ① his parcel text ② you pay a tiny fee: your card and a coin go in ③ the card flies to him, your coins follow, his parcel was empty
  parcel_scam: `${floor}
    ${at(250, 112, 'jump', `<g class="bob">${trickster({
      arms: 'hold',
      hat: 'cap',
      front: at(-46, 20, '', `${BOX}<g class="p-lid">${LID}</g>${at(2, -20, 'moth', MOTH, 'opacity="0"')}`),
    })}</g>`)}
    ${yourPhone('buzz', `
      <g class="p-sms"><rect x="9" y="20" width="46" height="40" rx="8" fill="${LILA_SOFT}"/>
        <rect x="15" y="27" width="14" height="11" rx="2" fill="${ORANGE}"/>
        <g transform="translate(42 32.5) scale(.65)">${COIN}</g>
        <rect x="14" y="47" width="36" height="5" rx="2.5" fill="${LILA}"/></g>
      <g class="p-form" opacity="0">
        <rect x="15" y="20" width="14" height="11" rx="2" fill="${ORANGE}"/>
        <g transform="translate(42 25.5) scale(.65)">${COIN}</g>
        <rect x="13" y="41" width="38" height="26" rx="5" fill="none" stroke="${LILA}" stroke-width="2" stroke-dasharray="4 3"/>
        <rect x="13" y="76" width="38" height="12" rx="6" fill="${LILA}"/></g>
      <circle class="tap" cx="32" cy="49.5" r="9" fill="none" stroke="${BLUE}" stroke-width="3" opacity="0"/>`)}
    ${at(68, 98, 'p-card', `${CARD}<g transform="translate(16 9) scale(.7)">${COIN}</g>`, 'opacity="0"')}
    ${coins(68, 96)}`,

  // ① "account locked?" ② his login page dangles into your screen on a lila line, you type ③ he reels in your key, coins follow
  account_phishing: `${floor}
    <path d="M212 114L70 22" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="199" cy="105" r="6" fill="${GREY}" stroke="${INK}" stroke-width="2"/><path d="M199 105L203 99" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path class="a-line" d="M70 22V63" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${LILA}" stroke-width="2"/>
    ${at(250, 112, '', trickster({ arms: 'rod', hat: 'beanie' }))}
    ${yourPhone('buzz', `
      <g class="a-lock"><path d="M24 48V41A8 8 0 0 1 40 41V48" fill="none" stroke="${DARK}" stroke-width="4"/>
        <rect x="19" y="47" width="26" height="22" rx="4" fill="${DARK}"/>${text(32, 64, 15, LILA, '?')}</g>`)}
    <g class="a-form" opacity="0">
      <rect x="48" y="66" width="44" height="54" rx="6" fill="#fff" stroke="${LILA}" stroke-width="2.5"/>
      <path d="M70 61V71A4 4 0 0 1 62 71V68" fill="none" stroke="${LILA}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="70" cy="77" r="5" fill="${LILA}"/>
      <rect x="53" y="86" width="34" height="9" rx="2" fill="none" stroke="${GREY}" stroke-width="1.5"/>
      <rect x="53" y="98" width="34" height="9" rx="2" fill="none" stroke="${GREY}" stroke-width="1.5"/>
      ${[59, 65, 71, 77].map((x, i) => `<circle class="dot d${i + 1}" cx="${x}" cy="102.5" r="1.8" fill="${INK}"/>`).join('')}
      <rect x="53" y="110" width="34" height="6" rx="3" fill="${LILA}"/></g>
    ${at(70, 102, 'a-key', KEY, 'opacity="0"')}
    ${coins(68, 134)}`,

  // ① "hi, new number" with a heart ② "quick, send money", the plate face wobbles ③ coins fly, the plate drops
  family_impersonation: `${floor}
    ${at(250, 112, 'jump', `<g class="bob">${trickster({ arms: 'stick', front: HELD_PLATE })}</g>`)}
    ${yourPhone('buzz', `<g class="f-sms">${hisSms(20, HEART)}</g>
      <g class="f-ask" opacity="0"><rect x="9" y="58" width="46" height="30" rx="8" fill="${LILA_SOFT}"/>
        <g transform="translate(22 73) scale(.8)">${COIN}</g><g transform="translate(42 73)">${CLOCK}</g></g>`)}
    ${coins(68, 117)}`,

  // ① his crayon draws a chart that only goes up ② you pay in, the chart climbs, his sack grows ③ he runs off with it, the chart crashes
  fake_profit: `${shadow(68, 163, 36)}
    ${at(250, 112, 'g-run', `${shadow(0, 40, 30)}<g class="bob">${trickster({ arms: 'hold', hat: 'tophat', front: at(-44, 14, 'g-sack', SACK) })}</g>`)}
    <g class="g-dust" opacity="0" fill="${GREY}"><circle cx="236" cy="146" r="6"/><circle cx="224" cy="142" r="4"/><circle cx="248" cy="144" r="5"/></g>
    ${yourPhone('g-phone', `
      <path d="M10 92H54" stroke="${GREY}" stroke-width="2"/>
      <g class="g-chart">
        <path class="g-up1" d="M12 84L22 72L30 76L40 56" pathLength="1" stroke-dasharray="1" fill="none" stroke="${GREEN}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="g-up2" d="M40 56L50 28" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${GREEN}" stroke-width="4.5" stroke-linecap="round"/></g>
      <path class="g-crash" d="M50 28L55 88" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${RED}" stroke-width="4.5" stroke-linecap="round"/>`)}
    <path class="g-arc" d="M287 135Q168 40 48 128" fill="none" stroke="${LILA}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 8" opacity="0"/>
    ${at(48, 128, 'g-crayon', CRAYON)}
    ${at(112, 50, 'spark', SPARK)}${at(24, 70, 'spark', SPARK)}${at(110, 98, 'spark', SPARK)}
    ${coins(68, 100)}`,

  // ① hearts go back and forth (his lila fingers hold the photo) ② "coin?", you send coins ③ the photo tips over: it was him, the heart breaks
  romance_scam: `${floor}
    ${at(250, 112, 'jump', trickster({ hat: 'bowtie' }))}
    ${at(250, 106, 'r-frame', PROFILE)}
    <g class="r-fingers"><g fill="${LILA}" stroke="${DARK}" stroke-width="1.5"><rect x="202" y="92" width="11" height="7" rx="3.5"/><rect x="202" y="101" width="11" height="7" rx="3.5"/><rect x="287" y="92" width="11" height="7" rx="3.5"/><rect x="287" y="101" width="11" height="7" rx="3.5"/></g>
      <path d="M291 80L304 73L302 86Z" fill="${INK}"/></g>
    ${at(196, 50, 'r-ask', `<rect x="-22" y="-15" width="44" height="30" rx="10" fill="${LILA_SOFT}"/><path d="M8 13L20 24L0 14Z" fill="${LILA_SOFT}"/><g transform="translate(-7 0) scale(.85)">${COIN}</g>${text(9, 6, 16, DARK, '?')}`, 'opacity="0"')}
    ${yourPhone('', `<g transform="translate(32 54) scale(1.7)"><g class="r-beat"><g class="r-whole">${HEART}</g><g class="r-left">${HEART_L}</g><g class="r-right">${HEART_R}</g></g></g>`)}
    ${at(204, 84, 'heart h1', HEART, 'opacity="0"')}${at(104, 78, 'heart h2', HEART, 'opacity="0"')}${at(204, 84, 'heart h3', HEART, 'opacity="0"')}
    ${coins(68, 98)}`,
}

// One scam type's story, for the result. Not every type has one yet.
export const hasStory = (type) => type in STORIES
export const story = (type) => svg(type, '12 18 296 156', `<g class="story-sc">${STORIES[type]}</g>`)

const COSTUME = {
  parcel_scam: 'cap',
  account_phishing: 'beanie',
  bank_impersonation: 'tie',
  tech_support: 'headset',
  fake_profit: 'tophat',
  romance_scam: 'bowtie',
}

// ---------- Landing page: one still picture per scam type, on its card's panel in the brand colour ----------
// The Trickser in his costume on a brand-dark floor, his bait on the left. Everything but the floor gets a white
// rim (the filter RIM, sticker style): on the brand colour, lila, grey and orange alone stay under 3:1.

const FLOOR = `<ellipse cx="176" cy="150" rx="72" ry="12" fill="${DARK}"/>`
const pose = (props) => `<g transform="translate(176 104) scale(1.3)">${trickster(props)}</g>`
// His message: a lila bubble with its tail towards him.
const bubble = (x, y, w, h, inner) => `<g transform="translate(${x} ${y})">
  <path d="M${w - 22} ${h - 4}L${w + 8} ${h + 10}L${w - 6} ${h - 14}Z" fill="${LILA_SOFT}"/><rect width="${w}" height="${h}" rx="12" fill="${LILA_SOFT}"/>${inner}</g>`
const coin = (x, y) => `<g transform="translate(${x} ${y})">${COIN}</g>`
// A bank: a roof, three columns and a step.
const BANK = `<path d="M0-15L18-6H-18Z" fill="${DARK}"/><path d="M-13-3V9M0-3V9M13-3V9" stroke="${DARK}" stroke-width="4.5"/><rect x="-19" y="10" width="38" height="5" rx="1.5" fill="${DARK}"/>`

const PORTRAITS = {
  // His parcel text with a fee and a link; he holds the parcel.
  parcel_scam: `${bubble(16, 28, 96, 66, `<g transform="translate(28 30) scale(.8)">${BOX}${LID}</g>${coin(70, 28)}
      <rect x="14" y="50" width="68" height="7" rx="3.5" fill="${LILA}"/>`)}
    ${pose({ arms: 'hold', hat: 'cap', front: at(-46, 20, '', BOX + LID) })}`,

  // He fishes with a fake login page on his line.
  account_phishing: `${pose({ arms: 'rod', hat: 'beanie' })}
    <path d="M128 108L66 28" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="116" cy="92" r="6" fill="${GREY}" stroke="${INK}" stroke-width="2"/>
    <path d="M66 28V58" stroke="${LILA}" stroke-width="2"/>
    <g transform="translate(40 58)"><rect width="52" height="64" rx="7" fill="#fff" stroke="${LILA}" stroke-width="3"/>
      <path d="M21 17V13A5 5 0 0 1 31 13V17" fill="none" stroke="${LILA}" stroke-width="3"/><rect x="17" y="16" width="18" height="13" rx="3" fill="${LILA}"/>
      <rect x="9" y="35" width="34" height="8" rx="2" fill="none" stroke="${GREY}" stroke-width="1.5"/>
      <rect x="9" y="47" width="34" height="8" rx="2" fill="none" stroke="${GREY}" stroke-width="1.5"/></g>`,

  // He calls as your bank and wants your money.
  bank_impersonation: `${bubble(16, 30, 96, 56, `<g transform="translate(32 28)">${BANK}</g>${coin(72, 28)}`)}
    ${pose({ arms: 'phone', hat: 'tie', front: `<g transform="translate(-41 -9)">${HANDSET}</g>` })}`,

  // His texts from an unknown number: love, then money in a hurry. He hides behind the plate face.
  family_impersonation: `${bubble(16, 26, 92, 40, `<circle cx="22" cy="20" r="11" fill="${LILA}"/>${text(22, 25, 15, '#fff', '?')}<g transform="translate(64 21)">${HEART}</g>`)}
    ${bubble(16, 78, 92, 40, `${coin(30, 20)}<g transform="translate(64 20) scale(1.3)">${CLOCK}</g>`)}
    ${pose({ arms: 'stick', front: HELD_PLATE })}`,

  // A fake alarm on your laptop, and his cursor on your screen.
  tech_support: `<g transform="translate(14 42)"><rect width="100" height="68" rx="7" fill="${INK}"/><rect x="6" y="6" width="88" height="56" rx="3" fill="#fff"/>
      <path d="M-8 70H108L102 80H-2Z" fill="${INK}"/>
      <path d="M44 14L66 50H22Z" fill="${LILA}" stroke="${DARK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M44 26V37" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="44" r="2.4" fill="#fff"/>
      <path d="M70 34V54L75 49L79 57L84 55L80 47H87Z" fill="${LILA}" stroke="${DARK}" stroke-width="2" stroke-linejoin="round"/></g>
    ${pose({ arms: 'rod', hat: 'headset' })}`,

  // His crayon draws a chart that only goes up, on a dark board like a trading app; he holds the money sack.
  fake_profit: `<g transform="translate(16 30)"><rect width="92" height="76" rx="10" fill="${DARK}"/><path d="M10 64H82" stroke="${LIGHT}" stroke-width="2"/>
      <path d="M12 58L28 46L40 52L58 30L74 14" fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${at(74, 14, '', CRAYON)}</g>
    ${at(122, 34, '', SPARK)}${at(12, 116, '', SPARK)}
    ${pose({ arms: 'hold', hat: 'tophat', front: at(-44, 14, '', SACK) })}`,

  // He holds up the sweet dating photo; hearts float up.
  romance_scam: `<g transform="translate(32 44) scale(1.1)">${HEART}</g><g transform="translate(110 36) scale(.9)">${HEART}</g>
    ${pose({ arms: 'hold', hat: 'bowtie' })}
    <g transform="translate(86 86) scale(.82)">${PROFILE}</g>`,
}

export const portrait = (type) => svg('portrait', '0 14 280 154', `${FLOOR}<g filter="url(#rim)">${PORTRAITS[type]}</g>`)

// The white rim: the figure's shape, grown by 3 units and filled white, behind it. Defined once for the page.
export const RIM = `<svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
  <filter id="rim" x="-5%" y="-5%" width="110%" height="110%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="grown"/><feFlood flood-color="#fff"/>
    <feComposite in2="grown" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></svg>`

// ---------- Result: the Lupe has spotted the Trickser. A still picture ----------
// His hands are up and his prop lies on the ground.

const PROP = {
  parcel_scam: BOX + LID,
  account_phishing: KEY,
  bank_impersonation: `<g transform="rotate(90)">${HANDSET}</g>`,
  fake_profit: SACK,
  romance_scam: `<g transform="scale(1.3)">${HEART}</g>`,
}
const DROPPED = {
  ...Object.fromEntries(Object.entries(PROP).map(([type, prop]) => [type, at(140, type === 'account_phishing' ? 128 : 116, '', prop)])),
  family_impersonation: `<g transform="translate(140 126) scale(1 .3)">${PLATE}</g>`, // flat on the ground
}

// type null: a scam of no known type, so a plain Trickser with nothing dropped.
export const spotted = (type) =>
  svg('spotted', '54 22 202 118', `${shadow(196, 133, 30)}${DROPPED[type] ?? ''}
    <g transform="translate(196 92)">${trickster({ arms: 'up', mouth: MOUTHS.oh, hat: COSTUME[type] })}</g>
    <path d="M232 48L240 40M236 60H247M226 38L229 28" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M245 69C248 73 250 76 250 79A5 5 0 0 1 240 79C240 76 242 73 245 69Z" fill="${LIGHT}" stroke="${DARK}" stroke-width="1.5"/>
    <g transform="translate(100 64) scale(-1 1)">${LUPE}</g>`)

// ---------- Loader: the Lupe reads the message, takes the link to the blocklist, then thinks ----------
// main.js sets the phases (data-phase); the path below takes 3.5 s.

export const CHECKING = svg('check', '20 24 290 152', `
  <rect x="30" y="34" width="180" height="120" rx="18" fill="#fff"/><path d="M54 152L44 172L80 152Z" fill="#fff"/>
  <rect class="ln ln1" x="50" y="56" width="140" height="9" rx="4.5" fill="${GREY}"/>
  <rect class="ln ln2" x="50" y="76" width="120" height="9" rx="4.5" fill="${GREY}"/>
  <rect class="ln ln3" x="50" y="96" width="96" height="9" rx="4.5" fill="${GREY}"/>
  <g class="ck-link"><rect x="50" y="116" width="92" height="20" rx="10" fill="${SOFT}" stroke="${BLUE}" stroke-width="2"/><rect x="62" y="124" width="56" height="4" rx="2" fill="${BLUE}"/></g>
  ${at(264, 108, 'ck-book', `<rect x="-34" y="-30" width="68" height="62" rx="6" fill="${DARK}"/>
    <rect x="-30" y="-26" width="29" height="52" rx="2" fill="#fff"/><rect x="1" y="-26" width="29" height="52" rx="2" fill="#fff"/>
    <path d="M-25-16H-6M-25-8H-6M-25 0H-10M6-16H25M6-8H25M6 0H20" stroke="${GREY}" stroke-width="3" stroke-linecap="round"/>
    <g class="ck-page"><rect x="1" y="-26" width="29" height="52" rx="2" fill="#fff" stroke="${SOFT}" stroke-width="1.5"/></g>
    <g class="ck-tick" opacity="0"><circle r="19" fill="${BLUE}"/><path d="M-8 0L-2 6L9-6" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>`, 'opacity="0"')}
  <g class="ck-dots" opacity="0" fill="${BLUE}"><circle cx="252" cy="40" r="4"/><circle cx="266" cy="40" r="4"/><circle cx="280" cy="40" r="4"/></g>
  ${at(110, 74, 'ck-lupe', `<g class="ck-bob"><g class="ck-hop">${LUPE}</g></g>`)}`)

// ---------- The protection (brand.js): the shield in front of your phone. A still picture ----------
// No Trickser here: the offer's hero is the shield, and the result already shows him twice.

export const BLOCKED = svg('blocked', '20 10 150 100', `
  <g transform="translate(30 20) scale(.72)">${phone(`
    <circle cx="24" cy="50" r="3.5" fill="${BLUE}"/><circle cx="40" cy="50" r="3.5" fill="${BLUE}"/>
    <path d="M21 61Q32 72 43 61" fill="none" stroke="${BLUE}" stroke-width="4" stroke-linecap="round"/>`)}</g>
  <g transform="translate(128 60)">${SHIELD}</g>`)
