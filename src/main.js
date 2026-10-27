// JavaScript entry point — Vite bundles everything imported from here.
import './style.css'
import './scenes.css'
import { STRINGS } from './strings.js'
import * as demo from './demo.js'
import * as api from './api.js'
import { readImage } from './image.js'
import { SCAM_TYPES, hasStory, story, portrait, RIM, spotted, CHECKING, BLOCKED } from './scenes.js'

const { EXAMPLES, isExample } = demo

const $ = (id) => document.getElementById(id)
const form = $('form')
const message = $('message')
const hint = $('hint')
const submit = $('submit')
const slot = $('slot')
const progress = $('progress')
const result = $('result')
const notice = $('notice')
const feedback = $('feedback')
const langButtons = document.querySelectorAll('[data-lang]')

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const desktop = matchMedia('(min-width: 1024px)') // the wide layout: a composer, then full-width rows
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let busy = false
let image = null // the attached screenshot, as the backend takes it: { mime_type, data }
let checked = null // what the shown answer is about: { text, image }
let backend = demo // where the shown answer came from: the example's stand-in (demo.js) or the real one (api.js)
let answerId = null
let shareText = ''

// ---------- Language ----------
// A ?lang= link wins for this visit, then the choice saved from the switch, then the browser.

const LANGS = Object.keys(STRINGS)
let lang = pickLanguage()
const t = (key) => STRINGS[lang][key] ?? key
const named = (key, type) => t(key).replace('{name}', t(`scam.${type}.name`))

function pickLanguage() {
  let saved = null
  try {
    saved = localStorage.getItem('lang')
  } catch {}
  const browser = navigator.languages.map((l) => l.slice(0, 2).toLowerCase())
  return [new URLSearchParams(location.search).get('lang'), saved, ...browser].find((l) => LANGS.includes(l)) ?? 'de'
}

const htmlLang = (l) => (l === 'en' ? 'en-GB' : 'de')

// Put the current language's texts into `root`; `except` keeps one part as it is for now.
function translate(root = document, except = null) {
  const all = (attr) => [...root.querySelectorAll(`[${attr}]`)].filter((el) => !except?.contains(el))
  for (const el of all('data-i18n')) el.textContent = t(el.dataset.i18n)
  for (const el of all('data-i18n-html')) el.innerHTML = t(el.dataset.i18nHtml) // our own static strings
  for (const el of all('data-i18n-placeholder')) el.placeholder = t(el.dataset.i18nPlaceholder)
  for (const el of all('data-i18n-label')) el.setAttribute('aria-label', t(el.dataset.i18nLabel))
  for (const el of all('data-i18n-alt')) el.alt = t(el.dataset.i18nAlt)
}

function applyLanguage(except = null) {
  document.documentElement.lang = htmlLang(lang)
  document.title = t('title')
  translate(document, except)
  for (const button of langButtons) button.setAttribute('aria-pressed', button.dataset.lang === lang)
}

function setLanguage(next) {
  if (busy || next === lang) return
  if (message.value === EXAMPLES[lang]) message.value = EXAMPLES[next] // only an untouched example
  const refresh = !result.hidden
  if (refresh) result.lang = htmlLang(lang) // the shown answer stays in its language until the new one is in
  lang = next
  try {
    localStorage.setItem('lang', lang)
  } catch {}
  const url = new URL(location.href)
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang') // the saved choice applies from now on
    history.replaceState(null, '', url)
  }
  applyLanguage(refresh ? result : null)
  autoGrow()
  if (refresh) refreshResult()
}

for (const button of langButtons) button.addEventListener('click', () => setLanguage(button.dataset.lang))

// ---------- The trick's story on the result (scenes.js): it plays once when it is fully in view ----------
// It gets a pause / play / watch-again button: anything that moves for longer than 5 s
// must be pausable (WCAG 2.2.2). With reduced motion nothing plays: it shows its last frame (scenes.css).

const TOGGLE = { playing: 'story.pause', paused: 'story.play', done: 'story.replay' }

function setState(el, state) {
  if (state) el.dataset.state = state
  else delete el.dataset.state
  const toggle = el.querySelector('.scene-toggle')
  if (toggle) {
    toggle.dataset.i18nLabel = TOGGLE[state] ?? 'story.play'
    toggle.setAttribute('aria-label', t(toggle.dataset.i18nLabel))
  }
}

// It starts once the whole thing is on screen (or fills most of a short one), so nobody misses the start.
const inView = new IntersectionObserver(
  (entries) => {
    for (const { target, intersectionRatio, intersectionRect, rootBounds } of entries) {
      const seen = intersectionRatio >= 0.95 || intersectionRect.height >= 0.8 * rootBounds.height
      if (seen && !target.dataset.state) setState(target, 'playing')
      else if (!intersectionRatio && target.dataset.state === 'playing') setState(target, null) // starts over next time
    }
  },
  { threshold: [0, 0.25, 0.5, 0.75, 0.95, 1] },
)

// Watch a story from the start, also after its content changed.
function watch(el) {
  setState(el, reducedMotion.matches ? 'done' : null)
  inView.unobserve(el)
  if (!reducedMotion.matches) inView.observe(el)
}

document.addEventListener('animationend', (event) => {
  const el = event.target.closest('[data-state]')
  if (event.animationName === 'clock' && el?.dataset.state === 'playing') setState(el, 'done')
})

document.addEventListener('click', (event) => {
  const el = event.target.closest('.scene-toggle')?.closest('.story')
  if (!el) return
  if (el.dataset.state === 'playing') setState(el, 'paused')
  else if (el.dataset.state === 'paused') setState(el, 'playing')
  else {
    setState(el, null)
    void el.offsetWidth // so the animations start over
    setState(el, 'playing')
  }
})

// The story on the result: a heading with the play button, the cartoon, the three steps (in step with it)
// and the rule to remember.
const storyHTML = (type) => `
  <div class="story-head"><h2 data-i18n="result.trick"></h2><button type="button" class="scene-toggle"><span class="icon" aria-hidden="true"></span></button></div>
  <div class="scene">${story(type)}</div>
  <ol class="beats">${[1, 2, 3].map((n) => `<li data-i18n="scam.${type}.s${n}"></li>`).join('')}</ol>
  <p class="rule"><span class="icon i-tick" aria-hidden="true"></span><span data-i18n="scam.${type}.rule"></span></p>`

// ---------- The scam types on the landing page: a row of cards that scrolls sideways ----------
// Each card: the name, one line and a still picture. Nothing to open; the steps live in the result's story.

const tiles = $('tiles')
document.body.insertAdjacentHTML('beforeend', RIM) // the white rim of the pictures, defined once
for (const type of SCAM_TYPES) {
  tiles.insertAdjacentHTML(
    'beforeend',
    `<li class="tile">
      <h3 data-i18n="scam.${type}.name"></h3>
      <p data-i18n="scam.${type}.text"></p>
      <div class="tile-img">${portrait(type)}</div>
    </li>`,
  )
}

// The arrows move by the cards in view (one on phones) and do nothing at the ends (aria-disabled keeps their focus).
// They aim at a card, not a distance, so a second press while the row still moves adds up.
// The bar under the row is a scrollbar to look at: its thumb is the part on screen.
const prev = $('tiles-prev')
const next = $('tiles-next')
const cards = [...tiles.children]
let goal = null // the card the arrows move to, until the row stops

// Where the row stops for a card: at its snap point (centred on phones, the start from 600 px), within the scroll range.
function stopFor(card) {
  const max = tiles.scrollWidth - tiles.clientWidth
  const left = card.getBoundingClientRect().left - tiles.getBoundingClientRect().left + tiles.scrollLeft
  const offset = getComputedStyle(card).scrollSnapAlign.includes('center')
    ? (tiles.clientWidth - card.offsetWidth) / 2
    : parseFloat(getComputedStyle(tiles).scrollPaddingLeft)
  return Math.min(Math.max(left - offset, 0), max)
}

function moveTiles(direction) {
  const stops = cards.map(stopFor)
  const last = stops.findIndex((stop) => stop >= stops.at(-1) - 1) // the first card that ends the row
  const distance = (i) => Math.abs(stops[i] - tiles.scrollLeft)
  const current = goal ?? Math.min(last, cards.reduce((best, _, i) => (distance(i) < distance(best) ? i : best), 0))
  const inView = Number(getComputedStyle(tiles).getPropertyValue('--per-view')) || 1 // set in style.css from 600 px
  // Back from the end retraces the way there (1–3, 4–6, 5–7 at 1024 px), so it shows no set you haven't seen.
  const target = direction < 0 && current === last && last % inView ? last - (last % inView) : current + direction * inView
  goal = Math.min(Math.max(target, 0), last)
  tiles.scrollTo({ left: stops[goal], behavior: scrollBehavior() })
}

function updateTilesNav() {
  const max = tiles.scrollWidth - tiles.clientWidth
  prev.setAttribute('aria-disabled', tiles.scrollLeft <= 1)
  next.setAttribute('aria-disabled', tiles.scrollLeft >= max - 1)
  $('tiles-thumb').style.width = `${(100 * tiles.clientWidth) / tiles.scrollWidth}%`
  $('tiles-thumb').style.left = `${(100 * tiles.scrollLeft) / tiles.scrollWidth}%`
}

for (const [button, direction] of [[prev, -1], [next, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') !== 'true') moveTiles(direction)
  })
}
let settle
tiles.addEventListener(
  'scroll',
  () => {
    updateTilesNav()
    clearTimeout(settle)
    settle = setTimeout(() => (goal = null), 150) // the row has stopped
  },
  { passive: true },
)
new ResizeObserver(updateTilesNav).observe(tiles) // also when the row comes back after a result

// ---------- Message field ----------

// Fit the field to its text; min-height and max-height in style.css set the range (4–8 rows, 3–8 on desktop).
function autoGrow() {
  message.style.height = '0'
  message.style.height = `${message.scrollHeight}px`
}

// While typing, keep the button 12 px above the on-screen keyboard (it only shrinks the visual viewport).
function keepSubmitVisible() {
  if (document.activeElement !== message || !window.visualViewport) return
  const overlap = submit.getBoundingClientRect().bottom - (visualViewport.offsetTop + visualViewport.height - 12)
  if (overlap > 0) window.scrollBy(0, overlap)
}

message.addEventListener('focus', keepSubmitVisible)
window.visualViewport?.addEventListener('resize', keepSubmitVisible)

// The hint (nothing to check, a message too long for the backend, or a picture that won't work) is only linked to the field
// while it shows, or screen readers would always read it.
function showHint(key = null) {
  hint.hidden = !key
  if (key) {
    hint.dataset.i18n = key
    hint.textContent = t(key)
    message.setAttribute('aria-describedby', 'hint')
  } else message.removeAttribute('aria-describedby')
}

function useExample() {
  setImage(null) // the example is a text, and only a text gets its stand-in answer
  message.value = EXAMPLES[lang] // no focus, so the keyboard stays closed
  showHint()
  autoGrow()
}

message.addEventListener('input', () => {
  showHint()
  autoGrow()
  keepSubmitVisible()
})
message.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) form.requestSubmit() // a desktop shortcut
})
$('example').addEventListener('click', useExample)

// ---------- Screenshot: picked with the camera button or pasted into the field, one at a time ----------
// While one is attached, its thumbnail takes the place of "Beispiel einfügen" and the camera: × removes it.

const upload = $('upload')
const picker = $('picker')
const shotRemove = $('shot-remove')
let reading = null // a screenshot being prepared (image.js), so a quick "Jetzt prüfen" waits for it

// Emptied first, so the same message twice in a row (two pictures that won't work) is read out again.
function announce(key) {
  $('status').textContent = ''
  requestAnimationFrame(() => ($('status').textContent = t(key)))
}

function setImage(next) {
  image = next
  $('shot').hidden = !image
  $('example').hidden = upload.hidden = Boolean(image)
  if (image) $('shot-img').src = `data:${image.mime_type};base64,${image.data}`
  else $('shot-img').removeAttribute('src')
  message.dataset.i18nPlaceholder = image ? 'form.placeholder.shot' : 'form.placeholder'
  message.placeholder = t(message.dataset.i18nPlaceholder)
  autoGrow()
}

async function attach(file) {
  reading = readImage(file)
  try {
    setImage(await reading)
    showHint()
    announce('form.added')
    if (document.activeElement !== message) shotRemove.focus() // the camera is gone; a paste keeps typing
  } catch (error) {
    console.warn('The screenshot could not be read:', error.message)
    showHint('form.image')
    announce('form.image') // the hint is only linked to the field, and focus may be elsewhere
  }
  reading = null
}

upload.addEventListener('click', () => picker.click())
picker.addEventListener('change', () => {
  if (picker.files[0]) attach(picker.files[0])
  picker.value = '' // so the same picture can be picked again
})

// Only a picture without text: Outlook, Word and others put a picture of the selection next to copied text.
// Some apps add an empty text, so it's the content that counts.
message.addEventListener('paste', (event) => {
  const data = event.clipboardData
  const file = [...(data?.files ?? [])].find((f) => f.type.startsWith('image/'))
  if (!file || data.getData('text/plain').trim()) return
  event.preventDefault()
  attach(file)
})

shotRemove.addEventListener('click', () => {
  setImage(null)
  showHint() // also "that image won't work": there is no image now
  announce('form.removed')
  upload.focus()
})

// ---------- Check ----------

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  await reading?.catch(() => {}) // a big photo can take a second on a slow phone; attach() says if it failed
  if (busy) return
  const text = message.value.trim()
  if ((!text && !image) || text.length > api.MAX_LENGTH) {
    showHint(text ? 'form.long' : 'form.empty')
    message.focus()
    return
  }
  message.blur()
  // The example keeps its stand-in answer; anything else goes to the real backend once it is set up.
  if (!image && isExample(text)) check(text, null, demo)
  else if (api.live) check(text, image, api)
  else showNotice('notice.text', 'example')
})

// Show progress, result or notice in the slot; no view hides the slot.
function showInSlot(view = null) {
  for (const el of [progress, result, notice]) el.hidden = el !== view
  slot.hidden = !view
  // On phones, progress and result reserve a screen of height, so the slot can sit at the top and the result swaps in place.
  slot.classList.toggle('reserved', view === progress || view === result)
}

// Phones move the slot to the top of the screen. Desktop has it right below the form, so it only
// scrolls as far as the loader needs.
function bringIntoView() {
  if (desktop.matches) progress.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
  else slot.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}

// While busy, taps on the button and the language switch are ignored, and the switch looks it.
function setBusy(on) {
  busy = on
  for (const button of langButtons) button.setAttribute('aria-disabled', on) // aria- keeps focus on the switch
}

async function check(text, image, from) {
  setBusy(true)
  checked = { text, image }
  backend = from
  submit.disabled = true
  $('submit-label').textContent = t('form.busy')
  $('status').textContent = t('form.busy')
  delete progress.dataset.phase
  showInSlot(progress)
  bringIntoView()

  const pending = backend.checkMessage(text, lang, image).catch((error) => error)
  const answer = await showChecking(/https?:\/\/|www\./i.test(text), Boolean(image), pending)

  if (answer instanceof Error) showError(answer)
  else {
    showResult(answer)
    $('headline').focus({ preventScroll: true })
  }
  $('status').textContent = ''
  $('submit-label').textContent = t('form.submit')
  submit.disabled = false
  setBusy(false)
}

// The loader's phases. The Lupe's path in scenes.css takes their first 3.5 s, so it also plays
// out when the answer comes sooner. Without a link in the text there is nothing to look up in the blocklist.
async function showChecking(hasLink, hasImage, pending) {
  progress.dataset.link = hasLink ? 'yes' : 'no'
  setPhase('read', hasImage ? 'screenshot' : 'read')
  await wait(1700)
  setPhase(hasLink ? 'link' : 'tricks')
  await wait(1800)
  setPhase('think')
  const answer = await pending
  if (answer instanceof Error) return answer // no „Fertig.“ before an error
  setPhase('done')
  await wait(700)
  return answer
}

function setPhase(phase, text = phase) {
  progress.dataset.phase = phase
  const caption = $('progress-text')
  caption.textContent = t(`progress.${text}`)
  caption.classList.remove('in')
  void caption.offsetWidth // so the caption fades in again
  caption.classList.add('in')
}

// The backend answers in one language: after a switch, fetch the visible answer again
// and swap the whole card at once.
// If that fails, the card stays as it is, in its own language.
async function refreshResult() {
  setBusy(true)
  result.setAttribute('aria-busy', 'true')
  try {
    const answer = await backend.checkMessage(checked.text, lang, checked.image)
    result.removeAttribute('lang')
    applyLanguage()
    showResult(answer)
  } catch (error) {
    console.warn('The answer was not fetched again:', error.message)
  }
  result.removeAttribute('aria-busy')
  setBusy(false)
}

// The backend's response (api.js; demo.js has the example's): answer_id, answer, fallback and links.
function showResult({ answer_id, answer, links = [] }) {
  answerId = answer_id
  const scam = answer.verdict === 'scam'
  // A known, common scam gets the Trickser in his costume. Only for a scam: "Durchschaut" would overclaim on a caution.
  const type = scam ? api.scamType(answer.threat_type) : null
  $('verdict').dataset.verdict = answer.verdict // scam · caution · legit; a fallback is a caution

  // A scam shows the Trickser, spotted by the Lupe; the other verdicts an icon.
  const art = $('verdict-art')
  art.hidden = !scam
  $('verdict-icon').hidden = scam
  $('verdict-icon').firstElementChild.className = `icon ${answer.verdict === 'legit' ? 'i-tick' : 'i-warning'}`
  if (scam) art.innerHTML = spotted(type)
  $('spotted').hidden = !type
  if (type) $('spotted').textContent = named('result.spotted', type)

  $('headline').replaceChildren(...sentences(answer.summary))
  // The explanation names the scam domain and the real site: marked red and green, as plain text,
  // so people type the real address themselves. A domain the backend didn't flag isn't red.
  const real = answer.official_domains
  const fake = answer.verdict === 'legit' ? [] : links.map((link) => link.domain).filter((domain) => !real.includes(domain))
  const mark = (part) => Object.assign(document.createElement('mark'), { className: fake.includes(part) ? 'fake' : 'real' })
  $('reason').replaceChildren(...wrap(answer.explanation, [...fake, ...real], mark))

  $('steps').replaceChildren(...answer.what_to_do.map((step) => Object.assign(document.createElement('li'), { textContent: step })))

  const help = $('help')
  const happened = answer.if_already_happened.join(' ')
  help.hidden = !happened
  if (happened) {
    // 116 116 is the German hotline for blocking bank cards: make it tappable.
    const call = () => Object.assign(document.createElement('a'), { href: 'tel:116116', ariaLabel: t('result.call') })
    help.replaceChildren(...wrap(happened, ['116 116'], call))
  }

  setFeedback('ask')

  $('trick').hidden = !hasStory(type)
  if (hasStory(type)) {
    $('trick-story').innerHTML = storyHTML(type)
    translate($('trick-story'))
    watch($('trick-story'))
  }

  $('protect').hidden = !links.some((link) => link.signal === 'strong') // on the blocklist Onlineschutz uses
  // A known, common scam is worth warning others about, once it has a warning text.
  const shareable = type && `share.message.${type}` in STRINGS[lang]
  $('share').hidden = !shareable
  if (shareable) prepareShare(type)

  showInSlot(result)
}

// One span per sentence, so a headline only breaks between sentences.
function sentences(text) {
  return text.split(/(?<=\.) /).flatMap((sentence, i) => {
    const span = Object.assign(document.createElement('span'), { textContent: sentence })
    return i ? [' ', span] : [span]
  })
}

// Split text around the given parts and put each one into a node from make(part). Longer parts
// match first, so a real domain inside a fake one stays part of the fake one. A comma or full stop
// right after a part stays on its line (.glued): after an inline-block it could start the next one.
function wrap(text, parts, make) {
  const found = parts.filter(Boolean).sort((a, b) => b.length - a.length)
  if (!found.length) return [text]
  const escaped = found.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pieces = text.split(new RegExp(`(${escaped.join('|')})([.,:;]?)`)) // text, part, punctuation, text, …
  const nodes = [pieces[0]]
  for (let i = 1; i < pieces.length; i += 3) {
    const glued = Object.assign(document.createElement('span'), { className: 'glued' })
    glued.append(Object.assign(make(pieces[i]), { textContent: pieces[i] }), pieces[i + 1])
    nodes.push(glued, pieces[i + 2])
  }
  return nodes
}

// The notice card: the demo's limit, or a check that failed. At most one way on: the example or try again.
function showNotice(key, action = null) {
  const text = $('notice-text')
  text.dataset.i18n = key
  text.textContent = t(key)
  $('notice-example').hidden = action !== 'example'
  $('notice-retry').hidden = action !== 'retry'
  showInSlot(notice)
  notice.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
}

// A used-up daily quota can't be retried today; anything else can.
function showError(error) {
  console.warn('The check failed:', error.kind, error.message)
  const kind = error.kind ?? 'failed'
  showNotice(`error.${kind}`, kind === 'quota' ? null : 'retry')
  $('notice-text').focus({ preventScroll: true })
}

$('notice-example').addEventListener('click', () => {
  useExample()
  showInSlot()
  form.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
})

$('notice-retry').addEventListener('click', () => form.requestSubmit())

$('reset').addEventListener('click', () => {
  showInSlot()
  setImage(null)
  message.value = ''
  autoGrow()
  window.scrollTo({ top: 0, behavior: scrollBehavior() })
  message.focus({ preventScroll: true })
})

// ---------- Feedback: POST /v1/feedback with the answer's id ----------
// The backend keeps one rating per answer, so the reason after a "Nein" replaces the first post.
// It has no field for the reason yet: the page's code (wrong_verdict · unclear · not_helpful) goes into comment.

function setFeedback(step) {
  for (const el of feedback.querySelectorAll('[data-step]')) el.hidden = el.dataset.step !== step
}

feedback.addEventListener('click', (event) => {
  const { rating, reason } = event.target.closest('button')?.dataset ?? {}
  if (rating) {
    backend.sendFeedback({ answer_id: answerId, rating })
    setFeedback(rating === 'up' ? 'thanks' : 'why')
  } else if (reason) {
    backend.sendFeedback({ answer_id: answerId, rating: 'down', comment: reason })
    setFeedback('thanks')
  }
})

// ---------- Share: the native share sheet on phones, otherwise WhatsApp, e-mail or copy ----------

const pageUrl = location.origin + location.pathname // without ?lang, so each recipient gets their own language
const nativeShare = 'share' in navigator && matchMedia('(pointer: coarse)').matches
$('share-native').hidden = !nativeShare
$('share-links').hidden = nativeShare

function prepareShare(type) {
  $('share-text').textContent = named('share.text', type)
  shareText = t(`share.message.${type}`)
  $('share-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`
  $('share-email').href =
    `mailto:?subject=${encodeURIComponent(t(`share.subject.${type}`))}&body=${encodeURIComponent(`${shareText}\n\n${pageUrl}`)}`
}

$('share-native').addEventListener('click', () => {
  navigator.share({ text: shareText, url: pageUrl }).catch(() => {}) // closing the sheet rejects
})

$('share-copy').addEventListener('click', async (event) => {
  const button = event.currentTarget
  try {
    await navigator.clipboard.writeText(`${shareText} ${pageUrl}`)
  } catch {
    return
  }
  button.textContent = t('share.copied')
  setTimeout(() => (button.textContent = t('share.copy')), 2000)
})

// ---------- Start ----------

$('checking-scene').innerHTML = CHECKING
$('protect-art').innerHTML = BLOCKED
applyLanguage()
autoGrow()
