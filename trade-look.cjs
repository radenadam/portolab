/* Checks two looks of a trade. Beli is green and Jual is red wherever a trade starts or is confirmed, with text at a contrast of at least 4.5 to 1 in both themes. Each listed or headlined stock shows its tile, which is its logo as an <img> with a data: URI or the monogram of its code, and the maps and running text show the code alone. Screenshots go to shots/trade. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').split(path.sep).join('/');
const dir = path.join(__dirname, 'shots', 'trade');
fs.mkdirSync(dir, { recursive: true });
const problems = [];
const wait = (p, ms = 400) => p.waitForTimeout(ms);

/* Runs in the page: the colors of the text and the ground of an element, its contrast, and the hue of its ground. */
function colorsOf(sel) {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const v = m[1].split(',').map((x) => parseFloat(x));
    return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
  };
  const lum = (c) => {
    const f = (x) => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const hue = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (!d) return null;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const before = parse(getComputedStyle(el, '::before').backgroundColor);
    const own = parse(getComputedStyle(el).backgroundColor);
    const ground = before && before.a > 0 ? before : own;
    const ink = parse(getComputedStyle(el).color);
    if (!ground || !ink || ground.a === 0) {
      out.push({ text: el.textContent.trim().slice(0, 30), missing: true });
      continue;
    }
    const a = lum(ground), b = lum(ink);
    out.push({ text: el.textContent.trim().slice(0, 30), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), hue: hue(ground) });
  }
  return out;
}
const isGreen = (h) => h != null && h >= 90 && h <= 175;
const isRed = (h) => h != null && (h <= 20 || h >= 340);

async function judge(page, tag, sel, side) {
  const list = await page.evaluate(colorsOf, sel);
  if (!list.length) problems.push(tag + ' found nothing for ' + sel);
  for (const c of list) {
    if (c.missing) { problems.push(tag + ' ' + sel + ' "' + c.text + '" has no ground color'); continue; }
    if (c.ratio < 4.5) problems.push(tag + ' ' + sel + ' "' + c.text + '" has a contrast of ' + c.ratio.toFixed(2) + ' to 1');
    if (side === 'buy' && !isGreen(c.hue)) problems.push(tag + ' ' + sel + ' "' + c.text + '" is not green, its hue is ' + Math.round(c.hue));
    if (side === 'sell' && !isRed(c.hue)) problems.push(tag + ' ' + sel + ' "' + c.text + '" is not red, its hue is ' + Math.round(c.hue));
  }
}
/* A tile shows the logo of its company when build.mjs found one in the folder logos/, and otherwise the monogram of the first two letters of its code. */
async function logos(page, tag, sel, min) {
  const found = await page.evaluate((s) => Array.from(document.querySelectorAll(s)).filter((el) => el.getBoundingClientRect().width > 0).map((el) => (el.querySelector('img') ? el.querySelector('img').getAttribute('src').slice(0, 22) : el.classList.contains('mono') && /^[A-Z]{2}$/.test(el.textContent.trim()) ? 'monogram' : 'none')), sel);
  if (found.length < min) problems.push(tag + ' shows ' + found.length + ' tiles in ' + sel + ', expected at least ' + min);
  for (const f of found) if (f !== 'data:image/png;base64,' && f !== 'monogram') problems.push(tag + ' a tile in ' + sel + ' is neither a PNG data URI nor a monogram: ' + f);
}

async function run(browser, vp, scheme) {
  const phone = vp === 'phone';
  const ctx = await browser.newContext(Object.assign({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, colorScheme: scheme }, phone ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
  const page = await ctx.newPage();
  const tag = vp + '/' + scheme;
  page.on('pageerror', (e) => problems.push(tag + ' pageerror ' + e.message));
  const shot = (name) => page.screenshot({ path: path.join(dir, vp + '-' + scheme + '-' + name + '.png') });
  await page.goto(url + '#/pasar');
  await page.waitForSelector('.shell');
  await wait(page, 700);
  await page.mouse.move(1, 2);
  await logos(page, tag + ' Pasar', phone ? '.m-list .logo' : 'table.data .logo', 15);
  if (await page.evaluate(() => document.querySelectorAll('.map .logo, .map img, .chart img').length)) problems.push(tag + ' a map shows a tile');
  await shot('market-list');
  /* The whole page, so the watchlist and the list of all stocks show together with their columns. */
  await page.screenshot({ path: path.join(dir, vp + '-' + scheme + '-market-list-page.png'), fullPage: true });
  await page.locator('#market-search').fill('ban');
  await wait(page, 300);
  await logos(page, tag + ' search', phone ? '.m-list .logo' : 'table.data .logo', 4);
  await shot('market-search');
  await page.goto(url + '#/beranda');
  await wait(page, 600);
  await logos(page, tag + ' holdings', phone ? '.m-list a .logo' : '.a-ht .tk a .logo', 5);
  await page.goto(url + '#/saham/BBCA');
  await wait(page, 600);
  await logos(page, tag + ' stock header', '.logo.lg', 1);
  if (phone) {
    await judge(page, tag + ' stock page', '.tradebar .btn.buy', 'buy');
    await judge(page, tag + ' stock page', '.tradebar .btn.sell', 'sell');
    await shot('stock-buttons');
    await page.locator('.tradebar a[href="#/saham/BBCA/beli"]').click();
    await wait(page, 500);
  }
  await page.mouse.move(1, 2);
  await logos(page, tag + ' ticket', '.ticket .logo', 1);
  await judge(page, tag + ' ticket', '.seg.buy-sell button[aria-pressed="true"]', 'buy');
  await judge(page, tag + ' ticket', '.ticket-confirm .btn', 'buy');
  await shot('ticket-buy');
  await page.locator('.ticket').getByRole('button', { name: 'Jual', exact: true }).click();
  await page.locator('#ticket-lots').fill('2');
  await wait(page, 300);
  await page.mouse.move(1, 2);
  await judge(page, tag + ' ticket', '.seg.buy-sell button[aria-pressed="true"]', 'sell');
  await judge(page, tag + ' ticket', '.ticket-confirm .btn', 'sell');
  await shot('ticket-sell');
  await page.locator('.ticket-confirm .btn').click();
  await wait(page, 500);
  await judge(page, tag + ' success', '.success-mark', 'sell');
  await judge(page, tag + ' success', '[role="status"] .side-tag', 'sell');
  await shot('success-sell');
  await page.goto(url + '#/aktivitas');
  await wait(page, 600);
  await logos(page, tag + ' activity', '.list-row .logo', 5);
  await judge(page, tag + ' activity', '.side-tag.buy', 'buy');
  await judge(page, tag + ' activity', '.side-tag.sell', 'sell');
  await shot('activity');
  if (await page.evaluate(() => Array.from(document.querySelectorAll('p .logo, blockquote .logo')).length)) problems.push(tag + ' running text shows a tile');
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of ['phone', 'laptop']) {
    for (const scheme of ['light', 'dark']) {
      try {
        await run(browser, vp, scheme);
      } catch (e) {
        problems.push(vp + '/' + scheme + ' FAILED: ' + e.message.split(String.fromCharCode(10))[0]);
      }
    }
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'Beli is green and Jual is red wherever a trade starts or is confirmed, every text on them keeps a contrast of at least 4.5 to 1, and every listed or headlined stock shows its tile while the maps do not');
})();
