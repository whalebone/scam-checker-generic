// Behaviour checks for the page. Needs the dev server: npm run check [-- http://localhost:5190/]
// Texts come from src/strings.js and src/demo.js, so copy edits don't break the checks. Most flows run in German,
// the language with the most to check (the green official site, the 116 116 link); the others get their own checks.
// The real backend's part starts a second dev server (port 5191) with VITE_API_URL set and answers
// its calls in the browser, in the shapes of the backend's api/swagger.yml.
import { readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { createServer, loadEnv } from 'vite'
import { BRAND } from '../src/brand.js'
import { STRINGS } from '../src/strings.js'
import { EXAMPLES } from '../src/demo.js'

const base = process.argv[2] || 'http://localhost:5190/'
const root = fileURLToPath(new URL('..', import.meta.url))
const liveDev = Boolean(loadEnv('development', root).VITE_API_URL) // .env.development.local sends other text to the backend
const LANGS = Object.keys(STRINGS)
const DE = STRINGS.de
const EN = STRINGS.en
const DOMAIN = EXAMPLES.de.match(/https?:\/\/([^/\s]+)/)[1]

let failed = 0
function check(name, ok, detail = '') {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -> ${detail}` : ''}`)
}

// ---------- Texts ----------

for (const code of LANGS.filter((l) => l !== 'en')) {
  const missing = [...Object.keys(EN).filter((k) => !(k in STRINGS[code])), ...Object.keys(STRINGS[code]).filter((k) => !(k in EN))]
  check(`${code} has the same keys as en`, !missing.length, missing.join(', '))
}
check('every language has its example', LANGS.every((l) => EXAMPLES[l]?.includes(DOMAIN)))
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const unknown = [...html.matchAll(/data-i18n(?:-placeholder|-label|-alt)?="([^"]+)"/g)].map((m) => m[1]).filter((k) => !(k in EN))
check('every key in index.html exists', !unknown.length, unknown.join(', '))
const texts = LANGS.flatMap((l) => Object.entries(STRINGS[l]).map(([k, v]) => [`${l}:${k}`, v]))
const loud = texts.filter(([, v]) => v.includes('!')).map(([k]) => k)
check('no exclamation marks in any text, in any language', !loud.length, loud.join(', '))
// A white-label demo: no operator's name, product or domain anywhere a visitor could see it.
const OPERATOR = /O₂|\bO2\b|Onlineschutz|o2online|Telef[oó]nica/i
const branded = [...texts, ...Object.entries(EXAMPLES), ['index.html', html]].filter(([, v]) => OPERATOR.test(v)).map(([k]) => k)
check('no text names an operator (O₂, Onlineschutz …)', !branded.length, branded.join(', '))

// ---------- The Netlify function (netlify/functions/api.mjs), against a stand-in backend ----------

const seen = []
const backend = createHttpServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    seen.push({ path: req.url, auth: req.headers.authorization, ip: req.headers['x-forwarded-for'], body })
    res.writeHead(200, { 'Content-Type': 'application/json', 'Wb-Token': 'rotated' }).end('{"answer_id":"sc_1"}')
  })
})
await new Promise((resolve) => backend.listen(0, resolve))
process.env.SCAM_CHECK_URL = `http://localhost:${backend.address().port}`
process.env.SCAM_CHECK_TOKEN = 'secret-token'
const { default: proxy } = await import('../netlify/functions/api.mjs')
const call = (path, method = 'POST') => proxy(new Request(`https://site.example${path}`, { method, body: method === 'POST' ? '{"message":"x"}' : undefined }), { ip: '203.0.113.7' })
let reply = await call('/api/v1/scam-check')
check('function: passes /api/v1/scam-check on with the token, raw', reply.status === 200 && seen[0]?.path === '/v1/scam-check' && seen[0].auth === 'secret-token' && seen[0].body === '{"message":"x"}', JSON.stringify(seen[0]))
check('function: sends the visitor’s IP along', seen[0]?.ip === '203.0.113.7')
check('function: keeps the rotated token to itself', reply.headers.get('wb-token') === null && (await reply.text()) === '{"answer_id":"sc_1"}')
reply = await call('/api/v1/feedback')
check('function: passes /api/v1/feedback on', reply.status === 200 && seen[1]?.path === '/v1/feedback')
const screenshot = JSON.stringify({ language: 'de', image: { mime_type: 'image/jpeg', data: 'A'.repeat(3_000_000) } })
reply = await proxy(new Request('https://site.example/api/v1/scam-check', { method: 'POST', body: screenshot }), {})
check('function: passes a screenshot (3 MB of base64) on unchanged', reply.status === 200 && seen[2]?.body === screenshot)
const refused = [await call('/api/health/check', 'GET'), await call('/api/v2/anything')]
check('function: refuses any other path or method, without calling the backend', refused.every((r) => r.status === 404) && seen.length === 3)
backend.close()
process.env.SCAM_CHECK_URL = 'http://localhost:9' // nothing listens there
reply = await call('/api/v1/scam-check')
check('function: an unreachable backend is a 502', reply.status === 502)
delete process.env.SCAM_CHECK_TOKEN
reply = await call('/api/v1/scam-check')
check('function: without its variables it says so (503)', reply.status === 503)

// ---------- Page ----------

const browser = await chromium.launch({ channel: 'chrome' }) // the installed Google Chrome

async function open(path = '', { site = base, locale = 'de-DE', saved = null, viewport = { width: 390, height: 844 }, mobile = true, reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, locale, reducedMotion })
  await ctx.route('**/v1/**', (route) => route.abort()) // never the real backend: no quota spent, no network needed
  if (saved) await ctx.addInitScript((lang) => localStorage.setItem('lang', lang), saved)
  const page = await ctx.newPage()
  page.logs = []
  page.requests = []
  page.on('console', (m) => page.logs.push(m.text()))
  page.on('pageerror', (e) => page.logs.push(`PAGEERROR ${e}`))
  page.on('request', (r) => page.requests.push(r.url()))
  await page.goto(site + path, { waitUntil: 'networkidle' })
  return page
}
const visible = (p, selector) => p.locator(selector).isVisible()
// The language menu, as a person uses it: focus it, pick a language.
const pick = async (p, code) => {
  await p.focus('#lang')
  await p.selectOption('#lang', code)
}
const focusedId = (p) => p.evaluate(() => document.activeElement?.id)
const showResult = async (p) => {
  await p.click('#example')
  await p.click('#submit')
  await p.waitForSelector('#result:not([hidden])', { timeout: 15000 })
}
// A picture to attach, drawn in the page as a PNG: a dark bubble in the middle, the rest transparent.
const png = async (p, width, height) =>
  Buffer.from(
    await p.evaluate(([width, height]) => {
      const canvas = Object.assign(document.createElement('canvas'), { width, height })
      const context = canvas.getContext('2d')
      context.fillStyle = '#00008c'
      context.fillRect(width / 4, height / 3, width / 2, height / 6)
      return canvas.toDataURL('image/png').split(',')[1]
    }, [width, height]),
    'base64',
  )
const picture = (buffer, name = 'chat.png') => ({ name, mimeType: 'image/png', buffer })
// A paste into the field, as the clipboard would bring it: a picture, maybe with text.
const paste = (p, buffer, text = null) =>
  p.evaluate(
    ([bytes, text]) => {
      const clipboard = new DataTransfer()
      clipboard.items.add(new File([new Uint8Array(bytes)], 'clip.png', { type: 'image/png' }))
      if (text) clipboard.setData('text/plain', text)
      document.getElementById('message').dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }))
    },
    [[...buffer], text],
  )
// What screen readers hear: #status is emptied first and filled a frame later.
const said = (p, text) => p.waitForFunction((text) => document.getElementById('status').textContent === text, text, { timeout: 1000 }).then(() => true, () => false)
const state = (p, selector) => p.locator(selector).evaluate((el) => el.dataset.state ?? 'idle')
const finishAnimations = (p, selector) => p.locator(selector).evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()))
const pageErrors = []

// Language
let p
for (const [locale, code] of [['en-GB', 'en'], ['de-DE', 'de'], ['id-ID', 'id'], ['km-KH', 'km']]) {
  p = await open('', { locale })
  check(`a ${locale} browser gets ${STRINGS[code]['lang.name']}, html lang ${code}`, (await p.textContent('h1')) === STRINGS[code]['hero.title'] && (await p.getAttribute('html', 'lang')) === code)
}
p = await open('', { locale: 'fr-FR' })
check(`other browser languages get the brand's default (${BRAND.language})`, (await p.textContent('h1')) === STRINGS[BRAND.language]['hero.title'])
check('the menu offers every language in its own name', (await p.locator('#lang option').allTextContents()).join('|') === LANGS.map((l) => STRINGS[l]['lang.name']).join('|'))
check('the menu has a name for screen readers', (await p.getAttribute('#lang', 'aria-label')) === STRINGS[BRAND.language]['lang.label'])
p = await open('?lang=en', { locale: 'de-DE' })
check('?lang=en opens English', (await p.textContent('h1')) === EN['hero.title'])
check('?lang=en is not saved', (await p.evaluate(() => localStorage.getItem('lang'))) === null)
await pick(p, 'de')
check('picking Deutsch switches to German', (await p.textContent('h1')) === DE['hero.title'])
check('picking Deutsch saves the choice', (await p.evaluate(() => localStorage.getItem('lang'))) === 'de')
check('picking Deutsch drops ?lang from the URL', !(await p.evaluate(() => location.search)).includes('lang'))
check('the pill shows the language’s code', (await p.textContent('#lang-code')) === DE['lang.code'] && (await p.inputValue('#lang')) === 'de')
p = await open('', { locale: 'de-DE', saved: 'km' })
check('the saved choice beats the browser', (await p.textContent('h1')) === STRINGS.km['hero.title'])

// Empty field
p = await open()
await p.click('#submit')
check('an empty check shows the hint', await visible(p, '#hint'))
check('the hint is linked to the field while it shows', (await p.getAttribute('#message', 'aria-describedby')) === 'hint')
check('an empty check focuses the field', (await focusedId(p)) === 'message')
await p.fill('#message', 'x')
check('typing hides and unlinks the hint', !(await visible(p, '#hint')) && (await p.getAttribute('#message', 'aria-describedby')) === null)
await p.fill('#message', 'x'.repeat(4001))
await p.click('#submit')
check('a message over 4000 characters (the backend limit) gets its own hint', (await visible(p, '#hint')) && (await p.textContent('#hint')) === DE['form.long'] && !(await visible(p, '#slot')))

// The scam types on the landing page: a row of cards that scrolls sideways
p = await open('', { viewport: { width: 360, height: 780 } })
const cards = await p.locator('.tile').count()
check('the landing page shows all 7 scam types as cards', cards === 7 && (await visible(p, '#types')))
check('the heading counts the cards, in every language', LANGS.every((l) => STRINGS[l]['types.title'].includes(String(cards))))
await p.locator('#types').scrollIntoViewIfNeeded()
await p.waitForTimeout(400)
check('nothing moves on the landing page', (await p.evaluate(() => document.getAnimations().length)) === 0)
const nameFits = (page) => page.evaluate(() => [...document.querySelectorAll('.tile h3')].every((h) => h.scrollWidth <= h.clientWidth))
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
const misfits = []
for (const code of LANGS) {
  await pick(p, code)
  if (!(await nameFits(p)) || (await sideways(p))) misfits.push(code)
}
check('in every language, every name fits its card at 360 px and nothing scrolls sideways', !misfits.length, misfits.join(', '))
await pick(p, 'de')
check('phones: the next card peeks in', await p.evaluate(() => {
  const next = document.querySelector('.tile:nth-child(2)').getBoundingClientRect()
  return next.left < innerWidth - 40 && next.right > innerWidth
}))
check('phones: the page does not scroll sideways', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
check('at the start only "next" works', (await p.getAttribute('#tiles-prev', 'aria-disabled')) === 'true' && (await p.getAttribute('#tiles-next', 'aria-disabled')) === 'false')
await p.click('#tiles-next')
await p.waitForTimeout(700)
check('phones: "next" centres the next card, its neighbours peek in', await p.evaluate(() => {
  const [a, b, c] = [1, 2, 3].map((n) => document.querySelector(`.tile:nth-child(${n})`).getBoundingClientRect())
  return Math.abs((b.left + b.right) / 2 - innerWidth / 2) < 2 && a.right > 24 && c.left < innerWidth - 24
}))
check('then "back" works', (await p.getAttribute('#tiles-prev', 'aria-disabled')) === 'false')
await p.click('#tiles-next')
await p.click('#tiles-next')
await p.waitForTimeout(900)
check('two quick presses move two cards', await p.evaluate(() => {
  const card = document.querySelector('.tile:nth-child(4)').getBoundingClientRect()
  return Math.abs((card.left + card.right) / 2 - innerWidth / 2) < 2
}))
for (let i = 0; i < 7 && (await p.getAttribute('#tiles-next', 'aria-disabled')) === 'false'; i++) {
  await p.click('#tiles-next')
  await p.waitForTimeout(500)
}
check('at the end "next" is off and keeps its focus', (await p.getAttribute('#tiles-next', 'aria-disabled')) === 'true' && (await focusedId(p)) === 'tiles-next')
check('the last card is fully on screen at the end', await p.locator('.tile:last-child').evaluate((el) => el.getBoundingClientRect().right <= innerWidth))

// Example, checking and result
p = await open()
await p.click('#example')
check('"use example" fills the field', (await p.inputValue('#message')) === EXAMPLES.de)
check('"use example" does not focus the field (no keyboard)', (await focusedId(p)) !== 'message')
await p.click('#submit')
await p.waitForTimeout(300)
check('checking starts by reading the message', (await p.getAttribute('#progress', 'data-phase')) === 'read' && (await p.textContent('#progress-text')) === DE['progress.read'])
check('the scam types hide while checking', !(await visible(p, '#types')))
await p.waitForTimeout(1700)
check('a message with a link goes to the blocklist', (await p.getAttribute('#progress', 'data-phase')) === 'link')
await p.waitForSelector('#result:not([hidden])', { timeout: 15000 })
check('the result headline gets focus', (await focusedId(p)) === 'headline')
check('the headline only breaks between sentences', await p.evaluate(() => {
  const h = document.getElementById('headline')
  return h.querySelectorAll('span').length === h.textContent.split(/(?<=\.) /).length
}))
check('the result names the scam type', (await p.textContent('#spotted')) === DE['result.spotted'].replace('{name}', DE['scam.parcel_scam.name']))
check('the spotted picture shows for a scam', await visible(p, '#verdict-art svg'))
check('the headline heads the white half of the verdict card', await p.evaluate(() => document.querySelector('.verdict-body').firstElementChild.id === 'headline'))
check('the reason marks the scam domain', (await p.textContent('#reason mark.fake')) === DOMAIN)
check('the reason marks the real site, as plain text', (await p.textContent('#reason mark.real')) === 'zoll.de' && !(await p.locator('#reason a').count()))
await p.waitForTimeout(400)
check('the verdict and protection cards do not move', await p.evaluate(() => ['verdict', 'protect'].every((id) => !document.getElementById(id).getAnimations({ subtree: true }).length)))
check('the result explains the trick with its story', (await visible(p, '#trick')) && (await p.locator('#trick .sc-parcel_scam').count()) === 1)
check('the story does not play out of view', (await state(p, '#trick-story')) === 'idle')
await p.locator('#trick-story').scrollIntoViewIfNeeded()
await p.waitForTimeout(400)
check('the story plays once it is in view', (await state(p, '#trick-story')) === 'playing')
check('the toggle says "Pause" while it plays', (await p.getAttribute('#trick .scene-toggle', 'aria-label')) === DE['story.pause'])
await p.click('#trick .scene-toggle')
check('the toggle pauses the story', (await state(p, '#trick-story')) === 'paused')
await p.click('#trick .scene-toggle')
await finishAnimations(p, '#trick-story')
await p.waitForTimeout(100)
check('the story stops after one run', (await state(p, '#trick-story')) === 'done')
check('then the toggle offers "Nochmal ansehen"', (await p.getAttribute('#trick .scene-toggle', 'aria-label')) === DE['story.replay'])
await p.click('#trick .scene-toggle')
check('"Nochmal ansehen" plays it again', (await state(p, '#trick-story')) === 'playing')
check('116 116 is a tel: link, named for screen readers', (await p.getAttribute('#help a', 'href')) === 'tel:116116' && (await p.getAttribute('#help a', 'aria-label')) === DE['result.call'].replace('{number}', '116 116'))
check('the protection card shows for a domain in the database', await visible(p, '#protect'))
check(`it names the brand’s protection (${BRAND.protection.name}), never split across lines`, (await p.textContent('#protect h2')).includes(BRAND.protection.name.replaceAll(' ', ' ')))
check('its link goes to the brand’s page, in a new tab', (await p.getAttribute('#protect a', 'href')) === BRAND.protection.url && (await p.getAttribute('#protect a', 'target')) === '_blank')
check('the share card shows for a known scam type', await visible(p, '#share'))
check('touch devices get the native share button', (await visible(p, '#share-native')) && !(await visible(p, '#share-links')))
check('the button is back to normal after the check', (await p.textContent('#submit-label')) === DE['form.submit'] && !(await p.isDisabled('#submit')))

// Feedback
await p.click('[data-rating="down"]')
await p.click('[data-reason="wrong_verdict"]')
const posts = p.logs.filter((l) => l.startsWith('POST /v1/feedback'))
const ids = posts.map((l) => l.match(/sc_[\w-]+/)?.[0])
check('feedback posts twice with the same answer_id', posts.length === 2 && ids[0] && ids[0] === ids[1], posts.join(' | '))
check('the second post carries the reason as its comment', /comment: '?wrong_verdict/.test(posts[1]), posts[1])
check('feedback says thanks', await visible(p, '[data-step="thanks"]'))

// Language switch while a result shows: the whole card swaps at once
await pick(p, 'en')
check('during the refresh the card stays fully German', (await p.textContent('#result [data-i18n="result.steps"]')) === DE['result.steps'] && (await p.getAttribute('#result', 'lang')) === 'de')
check('during the refresh the rest of the page is English', (await p.textContent('h1')) === EN['hero.title'])
check('during the refresh the menu looks disabled', (await p.getAttribute('#lang', 'aria-disabled')) === 'true')
// A pick, as the browser reports it (Playwright's selectOption waits for aria-disabled to end, even with force)
await p.evaluate(() => Object.assign(document.getElementById('lang'), { value: 'km' }).dispatchEvent(new Event('change')))
check('during the refresh the menu changes nothing', (await p.inputValue('#lang')) === 'en' && (await p.textContent('h1')) === EN['hero.title'])
check('during the refresh the form button is not dimmed', !(await p.isDisabled('#submit')))
await p.waitForSelector('#result:not([lang])', { timeout: 15000 })
check('after the refresh the card is English', (await p.textContent('#result [data-i18n="result.steps"]')) === EN['result.steps'])
check('after the refresh the menu works again', (await p.getAttribute('#lang', 'aria-disabled')) === 'false')
check('the refresh resets the feedback', await visible(p, '[data-step="ask"]'))
check('the scam type is named in English', (await p.textContent('#spotted')) === EN['result.spotted'].replace('{name}', EN['scam.parcel_scam.name']))
check('an untouched example follows the language', (await p.inputValue('#message')) === EXAMPLES.en)
check('focus stays on the language menu', (await focusedId(p)) === 'lang')
check('English names no official site, so nothing is green, and its help line has no number to call', !(await p.locator('#reason mark.real').count()) && !(await p.locator('#help a').count()))

// Reset
await p.click('#reset')
check('reset hides the result', !(await visible(p, '#slot')))
check('reset clears and focuses the field', (await p.inputValue('#message')) === '' && (await focusedId(p)) === 'message')
check('after reset the scam types are back', await visible(p, '#types'))
await pick(p, 'de')
await p.waitForTimeout(5500)
check('after reset, a language switch does not bring the result back', !(await visible(p, '#slot')))

// Demo notice (with .env.development.local the dev server sends other text to the backend: the live part below covers that)
if (liveDev) console.log('SKIP  the demo notice: the dev server is live (.env.development.local)')
else {
  await p.fill('#message', 'Hallo, kommst du heute Abend zum Essen?')
  await p.click('#submit')
  check('other text shows the demo notice at once', await visible(p, '#notice'))
  await p.click('#notice-example')
  check('the notice button fills the example and hides the notice', (await p.inputValue('#message')) === EXAMPLES.de && !(await visible(p, '#slot')))
  await p.setInputFiles('#picker', picture(await png(p, 600, 1300)))
  await p.waitForSelector('#shot:not([hidden])')
  await p.click('#submit')
  check('a screenshot, even with the example, shows the demo notice', await visible(p, '#notice'))
  await p.click('#notice-example')
  check('the notice’s example removes the screenshot (only text gets the stand-in answer)', !(await visible(p, '#shot')) && (await visible(p, '#example')))
}

pageErrors.push(...p.logs.filter((l) => l.startsWith('PAGEERROR')))

// Indonesian and Khmer: the example is their own market's scam, and the whole answer is in their language
for (const code of ['id', 'km']) {
  const S = STRINGS[code]
  const q = await open('', { locale: `${code}-${code === 'id' ? 'ID' : 'KH'}`, viewport: { width: 360, height: 780 } })
  await showResult(q)
  check(`${code}: the example and the type are in ${S['lang.name']}`, (await q.inputValue('#message')) === EXAMPLES[code] && (await q.textContent('#spotted')) === S['result.spotted'].replace('{name}', S['scam.parcel_scam.name']))
  check(`${code}: the reason marks the scam domain red and the country’s real site green`, (await q.textContent('#reason mark.fake')) === DOMAIN && (await q.locator('#reason mark.real').count()) === 1)
  check(`${code}: the headline breaks between its two sentences only`, (await q.locator('#headline span').count()) === 2)
  check(`${code}: the story’s steps and the share card are in ${S['lang.name']}`, (await q.textContent('#trick .beats li')) === S['scam.parcel_scam.s1'] && (await q.textContent('#share h2')) === S['share.title'])
  check(`${code}: nothing scrolls sideways on the result at 360 px`, !(await sideways(q)))
  if (code === 'km') {
    check('km: the Khmer font loads for Khmer text', q.requests.some((u) => u.includes('NotoSansKhmer')))
    check('km: the share fallback offers Telegram, Cambodia’s messenger', (await q.textContent('#share-app')) === 'Telegram' && (await q.getAttribute('#share-app', 'href')).startsWith('https://t.me/share/url?'))
  }
  pageErrors.push(...q.logs.filter((l) => l.startsWith('PAGEERROR')))
}

// Screenshot: picked or pasted, one at a time, in the tools' place
const sh = await open()
const CHAT = await png(sh, 600, 1300)
const buttonBottom = () => sh.evaluate(() => document.getElementById('submit').getBoundingClientRect().bottom)
const bottomBefore = await buttonBottom()
const [chooser] = await Promise.all([sh.waitForEvent('filechooser'), sh.click('#upload')])
check('the camera button opens the picker, for any picture', (await sh.getAttribute('#picker', 'accept')) === 'image/*')
await chooser.setFiles(picture(CHAT))
await sh.waitForSelector('#shot:not([hidden])')
check('a picked screenshot shows as a thumbnail, in place of the example and the camera', (await sh.locator('#shot-img').evaluate((img) => img.naturalWidth > 0)) && !(await visible(sh, '#example')) && !(await visible(sh, '#upload')))
check('focus moves to its ×, screen readers hear it was added', (await focusedId(sh)) === 'shot-remove' && (await said(sh, DE['form.added'])))
check('with a screenshot the text is optional, and the placeholder says so', (await sh.getAttribute('#message', 'placeholder')) === DE['form.placeholder.shot'])
check('with a screenshot the field gets shorter, nothing moves down', (await buttonBottom()) <= bottomBefore, `${bottomBefore} -> ${await buttonBottom()}`)
await pick(sh, 'en')
check('the thumbnail and the placeholder follow the language', (await sh.getAttribute('#shot-img', 'alt')) === EN['form.shot'] && (await sh.getAttribute('#message', 'placeholder')) === EN['form.placeholder.shot'])
await pick(sh, 'de')
await sh.click('#shot-remove')
check('× removes it, the tools come back, focus goes to the camera', !(await visible(sh, '#shot')) && (await visible(sh, '#example')) && (await focusedId(sh)) === 'upload' && (await said(sh, DE['form.removed'])))
check('without a screenshot the placeholder asks for the message again', (await sh.getAttribute('#message', 'placeholder')) === DE['form.placeholder'])
await paste(sh, CHAT, 'Ihr Paket wartet')
await sh.waitForTimeout(300)
check('pasting text that comes with a picture (Outlook, Word) attaches nothing', !(await visible(sh, '#shot')))
await sh.focus('#message')
await paste(sh, CHAT, ' ')
await sh.waitForSelector('#shot:not([hidden])')
check('pasting a picture into the field attaches it (an empty text beside it doesn’t count), the field keeps focus', (await focusedId(sh)) === 'message')
await sh.setInputFiles('#picker', picture(Buffer.from('not a picture'), 'note.png'))
await sh.waitForSelector('#hint:not([hidden])')
check('a file the browser can’t show gets its hint, also for screen readers, and keeps the screenshot', (await sh.textContent('#hint')) === DE['form.image'] && (await said(sh, DE['form.image'])) && (await visible(sh, '#shot')))
await sh.click('#shot-remove')
check('× also clears that hint: there is no picture now', !(await visible(sh, '#hint')))
pageErrors.push(...sh.logs.filter((l) => l.startsWith('PAGEERROR')))

// Phone with the keyboard open (about 400 px visible)
const k = await open('', { viewport: { width: 390, height: 400 } })
check('a page in a Latin script never downloads the Khmer font', !k.requests.some((u) => u.includes('NotoSansKhmer')))
check('the field border has 3:1 contrast or more (#6b7280)', (await k.evaluate(() => getComputedStyle(document.querySelector('.field')).borderTopColor)) === 'rgb(107, 114, 128)')
const before = await k.evaluate(() => document.getElementById('submit').getBoundingClientRect().bottom)
await k.focus('#message')
await k.waitForTimeout(300)
const after = await k.evaluate(() => document.getElementById('submit').getBoundingClientRect().bottom)
check(`the button moves above the keyboard (bottom ${Math.round(before)} -> ${Math.round(after)} of 400)`, before > 400 && after <= 389)

// Reduced motion: nothing plays, the story shows its last frame with all steps
const r = await open('', { reducedMotion: 'reduce' })
await showResult(r)
await r.locator('#trick-story').scrollIntoViewIfNeeded()
await r.waitForTimeout(400)
check('with reduced motion, the story shows its last frame', (await state(r, '#trick-story')) === 'done')
check('with reduced motion, there is no play button', !(await visible(r, '#trick .scene-toggle')))

// Desktop
const d = await open('', { viewport: { width: 1280, height: 800 }, mobile: false })
check('desktop: one wide composer, the scam cards below it, lined up with it', await d.evaluate(() => {
  const box = (el) => (typeof el === 'string' ? document.getElementById(el) : el).getBoundingClientRect()
  const field = box(document.querySelector('.field'))
  return box('types').top > box('form').bottom && Math.abs(box(document.querySelector('.tile')).left - box('form').left) < 2 && box('submit').left > field.right
}))
check('desktop: the page does not scroll sideways', await d.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
check('desktop: more cards than fit, so "next" works', (await d.getAttribute('#tiles-next', 'aria-disabled')) === 'false')
// Which cards are whole inside the composer's width, and whether any is cut off
const inColumn = () =>
  d.evaluate(() => {
    const column = document.getElementById('form').getBoundingClientRect()
    const cards = [...document.querySelectorAll('.tile')].map((el) => el.getBoundingClientRect())
    const whole = cards.flatMap((r, i) => (r.left >= column.left - 1 && r.right <= column.right + 1 ? [i + 1] : []))
    const cut = cards.some((r) => r.right > column.left - 8 && r.left < column.right + 8 && !(r.left >= column.left - 1 && r.right <= column.right + 1))
    return { whole: whole.join(','), cut, fills: Math.abs(cards[whole.at(-1) - 1].right - column.right) < 2 }
  })
let row = await inColumn()
check('desktop: 4 whole cards fill the composer\'s width, none cut off', row.whole === '1,2,3,4' && row.fills && !row.cut, JSON.stringify(row))
check('desktop: every name fits its card', await d.evaluate(() => [...document.querySelectorAll('.tile h3')].every((h) => h.scrollWidth <= h.clientWidth)))
await d.click('#tiles-next')
await d.waitForTimeout(900)
row = await inColumn()
check('desktop: "next" brings in the next cards, here the last 4', row.whole === '4,5,6,7' && !row.cut && (await d.getAttribute('#tiles-next', 'aria-disabled')) === 'true', JSON.stringify(row))
await d.click('#tiles-prev')
await d.waitForTimeout(900)
check('desktop: "back" returns to the start', (await inColumn()).whole === '1,2,3,4' && (await d.getAttribute('#tiles-prev', 'aria-disabled')) === 'true')
await d.click('#example')
await d.focus('#message')
await d.keyboard.press('Control+Enter')
check('desktop: Ctrl+Enter checks the message', await visible(d, '#progress'))
await d.waitForSelector('#result:not([hidden])', { timeout: 15000 })
check('desktop: the result is full-width rows, verdict then protection', await d.evaluate(() => {
  const box = (id) => document.getElementById(id).getBoundingClientRect()
  return box('protect').top > box('verdict').bottom && Math.abs(box('protect').width - box('verdict').width) < 2
}))
check('desktop: the verdict card is split in two halves', await d.evaluate(() => {
  const head = document.querySelector('.verdict-head').getBoundingClientRect()
  const body = document.querySelector('.verdict-body').getBoundingClientRect()
  return body.left >= head.right && Math.abs(body.height - head.height) < 2
}))
check('desktop shows WhatsApp, e-mail and copy', (await visible(d, '#share-links')) && !(await visible(d, '#share-native')))
const shared = decodeURIComponent(await d.getAttribute('#share-app', 'href'))
const warnings = Object.keys(DE).filter((key) => key.startsWith('share.message.')).map((key) => DE[key])
check('the WhatsApp text is a warning plus the page URL', warnings.some((w) => shared.includes(w)) && shared.endsWith(base))
check('the shared URL has no ?lang', !shared.includes('lang='))
check('the shared text never contains the scam domain', !shared.includes(DOMAIN))
pageErrors.push(...d.logs.filter((l) => l.startsWith('PAGEERROR')))

// ---------- The real backend (api.js), answered in the browser: nothing reaches dev1 ----------

process.env.VITE_API_URL = '/api' // beats .env.development.local
process.env.VITE_API_TOKEN = 'token-1'
const server = await createServer({ root, server: { port: 5191 }, logLevel: 'silent' })
await server.listen()
const L = await open('', { site: 'http://localhost:5191/' })
const calls = []
const replies = []
await L.route('**/v1/**', async (route) => {
  const req = route.request()
  calls.push({ path: new URL(req.url()).pathname, body: req.postDataJSON(), auth: req.headers().authorization })
  const reply = replies.shift()
  if (reply) await route.fulfill(reply)
  else await route.abort() // no connection, or blocked by CORS
})
const last = () => calls.at(-1) ?? {}
const answerOf = (fields) => ({
  verdict: 'scam',
  threat_type: 'credential_phishing',
  impersonated_entity: 'DHL',
  summary: 'Das ist nicht DHL.',
  explanation: 'Der Link führt zu dhl-hilfe.info, nicht zur echten dhl.de.',
  official_domains: ['dhl.de'],
  what_to_do: ['Tipp nicht auf den Link.', 'Lösch die Nachricht.', 'Gib nichts ein.'],
  if_already_happened: ['Schon eingeloggt? Ändere dein Passwort.', 'Karte sperren: 116 116'],
  language: 'de',
  ...fields,
})
const json = (status, body, token) => ({ status, contentType: 'application/json', headers: token ? { 'Wb-Token': token } : {}, body: JSON.stringify(body) })
const ok = (answer, more = {}) => json(200, { answer_id: 'sc_live', answer, fallback: false, timing: { total_ms: 2400 }, versions: { prompt: 'verdict-v1' }, ...more }, 'token-2')
const stored = (token) => json(200, { status: 'success', message: 'feedback stored' }, token)
const error = (status, code) => json(status, { status: 'error', error_code: code, errors: [code] })
const plain = (status, text) => ({ status, contentType: 'text/plain', body: text })
const answered = () => L.waitForSelector('#result:not([hidden]), #notice:not([hidden])', { timeout: 15000 })
async function ask(text, ...answers) {
  replies.push(...answers)
  if (text) await L.fill('#message', text)
  await L.click('#submit')
  await answered()
}
async function retry(...answers) {
  replies.push(...answers)
  await L.click('#notice-retry')
  await answered()
}
const PHISH = 'Ihr DHL-Konto wird gesperrt: https://dhl-hilfe.info/login'

await L.click('#example')
await L.click('#submit')
await L.waitForSelector('#result:not([hidden])', { timeout: 15000 })
check('live: the example keeps its stand-in answer, without a call', !calls.length && (await visible(L, '#protect')))
await L.click('#reset')

await ask(PHISH, ok(answerOf(), { links: [{ domain: 'dhl-hilfe.info', signal: 'strong' }] }))
check('live: other text goes to POST /v1/scam-check with message and language', last().path === '/api/v1/scam-check' && last().body?.message === PHISH && last().body?.language === 'de', JSON.stringify(last()))
check('live: the token goes raw into Authorization', last().auth === 'token-1')
check('live: summary is the headline, explanation the reason', (await L.textContent('#headline')) === 'Das ist nicht DHL.' && (await L.textContent('#reason')).startsWith('Der Link führt'))
check('live: a known threat type gets its Trickser and story', (await L.textContent('#spotted')) === DE['result.spotted'].replace('{name}', DE['scam.account_phishing.name']) && (await visible(L, '#trick .sc-account_phishing')))
check('live: the flagged domain is red, the official one green', (await L.textContent('#reason mark.fake')) === 'dhl-hilfe.info' && (await L.textContent('#reason mark.real')) === 'dhl.de')
check('live: what_to_do are the steps, if_already_happened the help line', (await L.locator('#steps li').count()) === 3 && (await L.textContent('#help')).includes('Passwort. Karte sperren') && (await L.getAttribute('#help a', 'href')) === 'tel:116116')
check('live: a strong threat-intelligence signal shows the protection card', await visible(L, '#protect'))
check('live: the share card warns with the type’s own text', (await visible(L, '#share')) && decodeURIComponent(await L.getAttribute('#share-app', 'href')).includes(DE['share.message.account_phishing']))

replies.push(stored('token-3'), stored('token-4'))
await L.click('[data-rating="down"]')
await L.click('[data-reason="unclear"]')
await L.waitForTimeout(500)
const [rated, why] = calls.slice(-2)
check('live: feedback posts the rating, then the reason as its comment, in that order', rated?.path === '/api/v1/feedback' && rated.body.answer_id === 'sc_live' && rated.body.rating === 'down' && !('comment' in rated.body) && why?.body.comment === 'unclear', JSON.stringify(calls.slice(-2)))
check('live: each call carries the token from the last Wb-Token', rated?.auth === 'token-2' && why?.auth === 'token-3')

await L.click('#reset')
await ask(PHISH, ok(answerOf({ verdict: 'caution', threat_type: 'parcel_delivery', official_domains: [] }), { fallback: true }))
check('live: a caution (also the fallback) gets the warning icon, no Trickser, no protection card, story or share', (await L.getAttribute('#verdict', 'data-verdict')) === 'caution' && (await visible(L, '#verdict-icon .i-warning')) && !(await visible(L, '#verdict-art')) && !(await visible(L, '#spotted')) && !(await visible(L, '#protect')) && !(await visible(L, '#trick')) && !(await visible(L, '#share')))

await L.click('#reset')
await ask('Dein Paket kommt heute: https://www.dhl.de/sendung', ok(answerOf({ verdict: 'legit', threat_type: 'none', explanation: 'Der Link führt zur echten dhl.de.', what_to_do: ['Alles in Ordnung.'], if_already_happened: [] }), { links: [{ domain: 'www.dhl.de', signal: 'trusted' }] }))
check('live: legit gets the tick, no help line, nothing red', (await L.getAttribute('#verdict', 'data-verdict')) === 'legit' && (await visible(L, '#verdict-icon .i-tick')) && !(await visible(L, '#help')) && !(await L.locator('#reason mark.fake').count()) && (await L.textContent('#reason mark.real')) === 'dhl.de')

await L.click('#reset')
await ask(PHISH, ok(answerOf()))
check('live: without links (today’s backend) no protection card and no red mark', !(await visible(L, '#protect')) && !(await L.locator('#reason mark.fake').count()) && (await L.textContent('#reason mark.real')) === 'dhl.de')

await L.click('#reset')
await ask(PHISH, error(429, 'QUOTA_EXCEEDED'))
check('live: a used-up daily quota says so, without a retry', (await L.textContent('#notice-text')) === DE['error.quota'] && !(await visible(L, '#notice-retry')) && !(await visible(L, '#notice-example')))
check('live: the error text gets focus, the button is back to normal', (await focusedId(L)) === 'notice-text' && (await L.textContent('#submit-label')) === DE['form.submit'] && !(await L.isDisabled('#submit')))
await ask(null, plain(429, 'Limit exceeded'))
check('live: the front door’s plain-text 429 means busy, with a retry', (await L.textContent('#notice-text')) === DE['error.busy'] && (await visible(L, '#notice-retry')))
await retry(error(500, 'GENERIC_ERROR'))
check('live: a server error asks to try again', (await L.textContent('#notice-text')) === DE['error.failed'] && (await visible(L, '#notice-retry')))
await retry()
check('live: no connection (or CORS) asks to try again', (await L.textContent('#notice-text')) === DE['error.failed'])
await retry(ok(answerOf()))
check('live: "Nochmal versuchen" checks the message again', (await visible(L, '#result')) && last().body?.message === PHISH)
await L.click('#reset')
await ask(PHISH, plain(401, 'Token is expired'), ok(answerOf()))
check('live: an expired refreshed token starts over once with the configured one', calls.at(-2)?.auth === 'token-2' && last().auth === 'token-1' && (await visible(L, '#result')))

// Screenshots: { mime_type, data } as image, message only with text
await L.click('#reset')
await L.setInputFiles('#picker', picture(await png(L, 3000, 3000))) // 9 megapixels, transparent around the bubble
await L.waitForSelector('#shot:not([hidden])')
replies.push(ok(answerOf()))
await L.click('#submit')
await L.waitForTimeout(300)
check('live: a screenshot alone is enough, the loader reads the screenshot', (await L.textContent('#progress-text')) === DE['progress.screenshot'] && !(await visible(L, '#hint')))
await answered()
const sent = last().body ?? {}
check('live: a screenshot alone goes as image with the language, without message', sent.language === 'de' && !('message' in sent) && sent.image?.mime_type === 'image/jpeg', JSON.stringify({ ...sent, image: sent.image && { ...sent.image, data: `${sent.image.data?.length} chars` } }))
check('live: the image is plain base64 of a JPEG, no data: prefix', /^\/9j\/[A-Za-z0-9+/]+=*$/.test(sent.image?.data ?? ''))
const drawn = await L.evaluate(async (data) => {
  const img = new Image()
  img.src = `data:image/jpeg;base64,${data}`
  await img.decode()
  const canvas = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight })
  const context = canvas.getContext('2d')
  context.drawImage(img, 0, 0)
  return { width: canvas.width, height: canvas.height, corner: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3) }
}, sent.image?.data ?? '')
check('live: a big picture is scaled to 4 megapixels at most, keeps its shape, on white', drawn.width * drawn.height <= 4_000_000 && drawn.width === drawn.height && drawn.width > 1900 && drawn.corner.every((v) => v > 245), JSON.stringify(drawn))
check('live: the screenshot stays attached after the answer, like the text', await visible(L, '#shot'))
await ask(PHISH, ok(answerOf()))
check('live: text and screenshot go together', last().body?.message === PHISH && last().body?.image?.data === sent.image?.data)

replies.push(ok(answerOf({ summary: 'This isn’t DHL.', language: 'en' })))
await pick(L, 'en')
await L.waitForSelector('#result:not([lang])', { timeout: 15000 })
check('live: a language switch asks the backend again, in English', last().body?.language === 'en' && (await L.textContent('#headline')) === 'This isn’t DHL.')
check('live: … with the same text and screenshot', last().body?.message === PHISH && last().body?.image?.data === sent.image?.data)
replies.push(error(500, 'GENERIC_ERROR'))
await pick(L, 'de')
await L.waitForFunction(() => document.getElementById('lang').getAttribute('aria-disabled') === 'false')
check('live: if that fails, the card stays as it was', (await visible(L, '#result')) && (await L.textContent('#headline')) === 'This isn’t DHL.')

// Indonesian and Khmer aren't backend languages yet: there a real message gets the demo's notice, without a call
const callsBefore = calls.length
const KM = STRINGS.km
await pick(L, 'km')
check('live: switching to Khmer with a real answer showing gives the demo notice, in Khmer, without a call', (await visible(L, '#notice')) && !(await visible(L, '#result')) && (await L.textContent('#notice-text')) === KM['notice.text'] && calls.length === callsBefore)
await L.fill('#message', PHISH)
await L.click('#submit')
check('live: in Khmer other text gets the demo notice too, without a call', (await visible(L, '#notice')) && calls.length === callsBefore)
await L.click('#notice-example')
await L.click('#submit')
await L.waitForSelector('#result:not([hidden])', { timeout: 15000 })
check('live: in Khmer the example still gets its whole answer', calls.length === callsBefore && (await L.textContent('#spotted')) === KM['result.spotted'].replace('{name}', KM['scam.parcel_scam.name']))
pageErrors.push(...L.logs.filter((l) => l.startsWith('PAGEERROR')))
await server.close()

check('no page errors', !pageErrors.length, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
