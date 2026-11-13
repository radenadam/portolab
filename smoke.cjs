const { chromium } = require('@playwright/test');
const path = require('path');
const url = 'file:///' + path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const out = (n) => path.join(__dirname, 'shots', n);

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const routes = (process.argv[2] || 'beranda,pasar,saham/BBCA,saham/BBCA/beli,aktivitas,analisis,belajar,belajar/9,kamus').split(',');
  for (const vp of [{ name: 'phone', width: 390, height: 844 }, { name: 'laptop', width: 1440, height: 900 }]) {
    for (const scheme of (process.argv[3] || 'light').split(',')) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.name === 'phone' ? 2 : 1, colorScheme: scheme, hasTouch: vp.name === 'phone', isMobile: vp.name === 'phone' });
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(vp.name + ' ' + m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push(vp.name + ' pageerror: ' + e.message));
      await page.goto(url + '#/beranda');
      await page.waitForTimeout(800);
      for (const r of routes) {
        await page.evaluate((h) => { location.hash = h; }, '#/' + r);
        await page.waitForTimeout(450);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) errors.push(vp.name + ' overflow ' + overflow + 'px on ' + r);
        await page.screenshot({ path: out('smoke-' + vp.name + '-' + scheme + '-' + r.replace(/\//g, '_') + '.png'), fullPage: process.argv[4] === 'full' });
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'no console errors');
})();
