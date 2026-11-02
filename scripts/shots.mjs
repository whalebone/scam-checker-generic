// Screenshots of every page state, for design reviews. Needs the dev server.
// npm run shots [-- <outDir> <baseUrl>]  →  shots/ (git-ignored), 2x pixel density
// Names: m = phone 390×844 English (the default), s = small phones (375×667, 360×780), g = German 360,
// i = Indonesian 360, k = Khmer 360, t = tablet 768, d = desktop 1440 and 1024.
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { chromium } from 'playwright-core'

const out = process.argv[2] || 'shots'
const base = process.argv[3] || 'http://localhost:5190/'
mkdirSync(out, { recursive: true })
for (const file of readdirSync(out)) if (file.endsWith('.png')) rmSync(`${out}/${file}`) // no leftovers from removed states

const browser = await chromium.launch({ channel: 'chrome' }) // the installed Google Chrome
const errors = []

async function open(viewport, { mobile = true, locale = 'en-GB' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale })
  await ctx.route('**/v1/**', (route) => route.abort()) // never the real backend: a live dev server shows its error notice
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !m.location().url.includes('/v1/') && errors.push(m.text())) // not the blocked call
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  return page
}
const shot = (page, name, fullPage = false) => page.screenshot({ path: `${out}/${name}.png`, fullPage })
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// A phone screenshot of a scam SMS, drawn in the page: what people will attach.
const screenshot = async (page) => ({
  name: 'Screenshot.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    await page.evaluate(() => {
      const canvas = Object.assign(document.createElement('canvas'), { width: 1179, height: 2556 })
      const c = canvas.getContext('2d')
      c.fillStyle = '#fff'
      c.fillRect(0, 0, 1179, 2556)
      c.fillStyle = '#f2f2f7'
      c.fillRect(0, 0, 1179, 340)
      c.fillStyle = '#000'
      c.font = 'bold 52px sans-serif'
      c.textAlign = 'center'
      c.fillText('+44 7700 900461', 590, 280)
      c.fillStyle = '#e9e9eb'
      c.beginPath()
      c.roundRect(48, 420, 920, 380, 48)
      c.fill()
      c.fillStyle = '#000'
      c.font = '46px sans-serif'
      c.textAlign = 'left'
      const lines = ['Your parcel is being held', 'at customs. Please pay the', '$2.99 fee today:', 'parcel-fee.info/c/8K2P']
      lines.forEach((line, i) => c.fillText(line, 96, 510 + i * 74))
      return canvas.toDataURL('image/png').split(',')[1]
    }),
    'base64',
  ),
})
const attach = async (page, file) => {
  await page.setInputFiles('#picker', file ?? (await screenshot(page)))
  await wait(500)
}
const resultShown = async (page) => {
  await page.waitForSelector('#result:not([hidden])', { timeout: 15000 })
  await wait(1800) // let the entry animations finish
}

// Phone, English
const m = await open({ width: 390, height: 844 })
await shot(m, 'm01-start')
await shot(m, 'm02-start-full', true)
await m.locator('.tiles-nav').scrollIntoViewIfNeeded()
await shot(m, 'm03-types')
await m.click('#tiles-next')
await m.click('#tiles-next')
await wait(800)
await shot(m, 'm04-types-swiped')
await m.locator('#tiles').evaluate((el) => (el.scrollLeft = 0))
await m.evaluate(() => window.scrollTo(0, 0))
await m.click('#submit')
await wait(300)
await shot(m, 'm05-empty-hint')
await m.click('#example')
await wait(300)
await shot(m, 'm06-example-filled')
await m.click('#submit')
await wait(1000)
await shot(m, 'm07-checking-read')
await wait(1700)
await shot(m, 'm08-checking-link')
await wait(1500)
await shot(m, 'm09-checking-think')
await resultShown(m)
await shot(m, 'm10-result-viewport')
await shot(m, 'm11-result-full', true)
await m.click('[data-rating="down"]')
await wait(300)
await m.locator('#feedback').scrollIntoViewIfNeeded()
await shot(m, 'm12-feedback-no')
await m.click('[data-reason="unclear"]')
await m.locator('#trick').scrollIntoViewIfNeeded()
await wait(4000)
await shot(m, 'm13-trick-story')
await m.locator('#share').scrollIntoViewIfNeeded()
await wait(3200)
await shot(m, 'm14-protect-share')
await m.click('#reset')
await wait(900)
await shot(m, 'm15-after-reset')
await m.locator('#message').blur()
await attach(m)
await shot(m, 'm16-screenshot')
await attach(m, { name: 'note.png', mimeType: 'image/png', buffer: Buffer.from('not a picture') })
await shot(m, 'm17-image-error')
await m.click('#shot-remove')
await m.fill('#message', 'Hi, are you coming to dinner tonight? Love, Gran')
await m.click('#submit')
await m.waitForSelector('#notice:not([hidden])', { timeout: 15000 })
await wait(900)
await shot(m, 'm18-notice') // the demo's notice, or with .env.development.local the error notice

// Small phones
const se = await open({ width: 375, height: 667 })
await shot(se, 's01-se-start')
await attach(se)
await shot(se, 's05-se-screenshot')
const narrow = await open({ width: 360, height: 780 })
await narrow.locator('.tiles-nav').scrollIntoViewIfNeeded()
await shot(narrow, 's04-360-types')
const small = await open({ width: 360, height: 780 })
await small.click('#example')
await small.click('#submit')
await resultShown(small)
await shot(small, 's02-360-result-viewport')
await shot(small, 's03-360-result-full', true)

// Tablet: whole cards inside the column
const tablet = await open({ width: 768, height: 1024 })
await tablet.locator('.tiles-nav').scrollIntoViewIfNeeded()
await shot(tablet, 't01-768-types')

// The other languages (from the browser language), 360 px: German, Indonesian and Khmer
for (const [prefix, locale] of [['g', 'de-DE'], ['i', 'id-ID'], ['k', 'km-KH']]) {
  const page = await open({ width: 360, height: 780 }, { locale })
  await shot(page, `${prefix}01-start`)
  await shot(page, `${prefix}02-start-full`, true)
  await page.click('#example')
  await page.click('#submit')
  await wait(2600)
  await shot(page, `${prefix}03-checking`)
  await resultShown(page)
  await shot(page, `${prefix}04-result-viewport`)
  await shot(page, `${prefix}05-result-full`, true)
  await page.click('#reset')
  await page.locator('#message').blur()
  await attach(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, `${prefix}06-screenshot`)
}

// Desktop
const d = await open({ width: 1440, height: 900 }, { mobile: false })
await shot(d, 'd01-start')
await d.locator('.tiles-nav').scrollIntoViewIfNeeded()
await wait(300)
await shot(d, 'd02-types')
await d.click('#tiles-next')
await wait(800)
await shot(d, 'd10-types-next')
await d.evaluate(() => window.scrollTo(0, 0))
await d.click('#example')
await d.click('#submit')
await wait(2600)
await shot(d, 'd03-checking')
await resultShown(d)
await shot(d, 'd04-result')
await shot(d, 'd05-result-full', true)
await d.click('#reset')
await d.locator('#message').blur()
await attach(d)
await d.evaluate(() => window.scrollTo(0, 0))
await shot(d, 'd06-screenshot')
const laptop = await open({ width: 1024, height: 768 }, { mobile: false })
await shot(laptop, 'd07-1024-start')
await attach(laptop)
await shot(laptop, 'd11-1024-screenshot')
await laptop.click('#shot-remove')
await laptop.locator('.tiles-nav').scrollIntoViewIfNeeded()
await shot(laptop, 'd09-1024-types')
await laptop.click('#example')
await laptop.click('#submit')
await resultShown(laptop)
await shot(laptop, 'd08-1024-result')

await browser.close()
console.log(`Screenshots in ${out}/`)
console.log(errors.length ? `Console errors:\n${errors.join('\n')}` : 'No console errors')
process.exit(errors.length ? 1 : 0)
