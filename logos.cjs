/* Checks that every logo fills its tile enough to read, at every size of the tile, in the light and the dark theme, on a laptop and on a phone.
   The tile draws its logo inside a border of 1 pixel. A logo that is wider than tall, such as a wordmark, must reach the width of the tile inside a padding of 3 of 96 parts of the image, and a logo that is about square must reach the height or the width inside a padding of 8 of 96, so the rounded corners never cut it. The check reads the drawn pixels of each tile, so it measures what a reader sees.
   It copies the tiles of the market list into a strip at each size class of the page, sm, the default, and lg, and screenshots the strips and each tile to shots/logos. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').split(path.sep).join('/');
const dir = path.join(__dirname, 'shots', 'logos');
fs.mkdirSync(dir, { recursive: true });
const problems = [];
/* The repository carries no logos, so the check measures the logos of the folder logos/ that build.mjs embeds, and it has nothing to measure without that folder. */
const logoFolder = path.join(__dirname, 'logos');
const logoCount = fs.existsSync(logoFolder) ? fs.readdirSync(logoFolder).filter((n) => n.endsWith('.png')).length : 0;
const SIZES = [['sm', 'logo sm'], ['md', 'logo'], ['lg', 'logo lg']];
const WIDE = 1.6;
const PAD_WIDE = 3 / 96;
const PAD_SQUARE = 8 / 96;

/* Runs in the page: the box of the ink of a screenshot of one tile, inside its border and its rounded corners, in pixels of the screen. The page shows through the corners, so they are left out in both themes. */
async function inkOf({ uri, border, radius, dpr }) {
  const img = new Image();
  img.src = uri;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const edge = Math.ceil(border * dpr) + 1;
  const r = Math.max(0, (radius - border) * dpr - 1);
  const inside = (px, py) => {
    const cx = Math.min(Math.max(px, edge + r), c.width - edge - r);
    const cy = Math.min(Math.max(py, edge + r), c.height - edge - r);
    return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
  };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = edge; y < c.height - edge; y++) {
    for (let x = edge; x < c.width - edge; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const i = (y * c.width + x) * 4;
      const away = Math.max(255 - d[i], 255 - d[i + 1], 255 - d[i + 2]);
      /* A thin tip of a logo, drawn small, covers only part of its last pixel, so a pixel counts as ink from a tenth of the way to black. */
      if (away > 24) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  if (x1 < 0) return null;
  return { w: (x1 - x0 + 1) / dpr, h: (y1 - y0 + 1) / dpr };
}

async function run(browser, vp, scheme) {
  const phone = vp === 'phone';
  const dpr = phone ? 3 : 1;
  const ctx = await browser.newContext(Object.assign({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, colorScheme: scheme, deviceScaleFactor: dpr }, phone ? { isMobile: true, hasTouch: true } : {}));
  const page = await ctx.newPage();
  const tag = vp + '/' + scheme;
  page.on('pageerror', (e) => problems.push(tag + ' pageerror ' + e.message));
  await page.goto(url + '#/pasar');
  await page.waitForSelector('.shell');
  await page.waitForTimeout(600);
  const codes = await page.evaluate((sizes) => {
    const seen = new Map();
    for (const row of document.querySelectorAll('.page a[href^="#/saham/"]')) {
      const img = row.querySelector('.logo img');
      const code = row.getAttribute('href').split('/')[2];
      if (img && !seen.has(code)) seen.set(code, img.getAttribute('src'));
    }
    const host = document.querySelector('.page');
    for (const [size, cls] of sizes) {
      const strip = document.createElement('div');
      strip.className = 'logo-strip';
      strip.dataset.size = size;
      strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;padding:12px;background:var(--panel);';
      for (const [code, src] of seen) {
        const tile = document.createElement('span');
        tile.className = cls;
        tile.dataset.code = code;
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        tile.appendChild(img);
        strip.appendChild(tile);
      }
      host.prepend(strip);
    }
    return Array.from(seen.keys());
  }, SIZES);
  if (codes.length < logoCount) problems.push(tag + ' found ' + codes.length + ' logos in the market list instead of ' + logoCount);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const [size] of SIZES) {
    const strip = page.locator('.logo-strip[data-size="' + size + '"]');
    await strip.screenshot({ path: path.join(dir, vp + '-' + scheme + '-' + size + '.png') });
    for (const code of codes) {
      const tile = strip.locator('[data-code="' + code + '"]');
      const box = await tile.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { w: r.width, border: parseFloat(cs.borderTopWidth), radius: parseFloat(cs.borderTopLeftRadius) };
      });
      const shot = await tile.screenshot();
      const ink = await page.evaluate(inkOf, { uri: 'data:image/png;base64,' + shot.toString('base64'), border: box.border, radius: box.radius, dpr });
      if (scheme === 'light' && size === 'md') await tile.screenshot({ path: path.join(dir, vp + '-tile-' + code + '.png') });
      const inner = box.w - 2 * box.border;
      if (!ink) {
        problems.push(tag + ' ' + size + ' ' + code + ' draws nothing in its tile');
        continue;
      }
      const wide = ink.w / ink.h >= WIDE;
      const need = inner * (1 - 2 * (wide ? PAD_WIDE : PAD_SQUARE)) - 1;
      const reach = wide ? ink.w : Math.max(ink.w, ink.h);
      if (reach < need) problems.push(tag + ' ' + size + ' ' + code + (wide ? ' is a wide logo that is ' + ink.w.toFixed(1) + 'px wide' : ' reaches ' + reach.toFixed(1) + 'px') + ' in a tile of ' + box.w + 'px, which needs at least ' + need.toFixed(1) + 'px');
    }
  }
  await ctx.close();
}

(async () => {
  if (logoCount === 0) {
    console.log('the folder logos/ holds no logos, so every stock shows the monogram tile of its code and this check has nothing to measure');
    return;
  }
  const browser = await chromium.launch();
  for (const vp of ['laptop', 'phone']) {
    for (const scheme of ['light', 'dark']) {
      try {
        await run(browser, vp, scheme);
      } catch (e) {
        problems.push(vp + '/' + scheme + ' FAILED: ' + e.message.split(String.fromCharCode(10))[0]);
      }
    }
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'every logo fills its tile at 26, 32, and 44 pixels in both themes on a laptop and a phone, and every wide logo reaches the width of its tile inside its padding');
})();
