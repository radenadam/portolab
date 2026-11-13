/* Phone screenshots at 390px and 360px of Beranda, Kelas, Mahasiswa with its sheet, the stock, and the ticket, and desktop screenshots of the tooltips of the maps and the line chart. Fails on console errors and on sideways scrolling. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const dir = path.join(__dirname, 'shots', 'phone');
fs.mkdirSync(dir, { recursive: true });
const problems = [];

async function open(browser, viewport, scheme, phone) {
  const ctx = await browser.newContext(Object.assign({ viewport, colorScheme: scheme }, phone ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(viewport.width + ' pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(viewport.width + ' console ' + m.text()); });
  await page.goto(url + '#/beranda');
  await page.waitForSelector('.shell');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return { ctx, page };
}
async function check(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) problems.push(label + ' scrolls sideways by ' + overflow + 'px');
}
async function go(page, hash) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch();
  for (const width of [390, 360]) {
    for (const scheme of ['light', 'dark']) {
      const { ctx, page } = await open(browser, { width, height: 800 }, scheme, true);
      const shot = async (name, full) => {
        await check(page, width + ' ' + scheme + ' ' + name);
        await page.screenshot({ path: path.join(dir, width + '-' + scheme + '-' + name + '.png'), fullPage: !!full });
      };
      await shot('beranda', true);
      const mapShot = async (selector, name) => {
        const el = page.locator(selector).first();
        await el.evaluate((node) => node.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(150);
        await el.screenshot({ path: path.join(dir, width + '-' + scheme + '-' + name + '-map.png') });
      };
      await mapShot('.a-h-map .map', 'beranda');
      await go(page, '#/saham/BBRI');
      await shot('saham', true);
      await go(page, '#/saham/BBRI/beli');
      await page.locator('#ticket-lots').fill('30');
      await page.waitForTimeout(300);
      await shot('tiket');
      await page.locator('.sheet-body').evaluate((el) => el.scrollTo(0, 820));
      await page.waitForTimeout(200);
      await shot('tiket-dampak');
      await mapShot('.sheet .map', 'tiket');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Demo' }).click();
      await page.getByRole('button', { name: 'Dosen', exact: true }).click();
      await page.waitForTimeout(500);
      await shot('kelas', true);
      await mapShot('.a-k .map', 'kelas');
      await go(page, '#/mahasiswa');
      await shot('mahasiswa', true);
      await page.locator('.m-row').first().click();
      await page.waitForTimeout(500);
      await shot('mahasiswa-panel');
      await ctx.close();
    }
  }
  /* Tooltips on a desktop: a point and a bar of the class map, and the line chart of Beranda. */
  for (const scheme of ['light', 'dark']) {
    const { ctx, page } = await open(browser, { width: 1440, height: 900 }, scheme, false);
    const box = await page.locator('.o-vs .chart').boundingBox();
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height / 2);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, 'desktop-' + scheme + '-tip-line-chart.png'), clip: { x: box.x - 20, y: box.y - 120, width: box.width + 40, height: box.height + 140 } });
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: 'Dosen', exact: true }).click();
    await page.waitForTimeout(500);
    const map = page.locator('.a-k .map').first();
    const mb = await map.boundingBox();
    const target = await map.evaluate((el) => {
      const svg = el.querySelector('svg');
      const dots = Array.from(svg.querySelectorAll('circle.p-on'));
      const d = dots[3].getBoundingClientRect();
      const bar = svg.querySelector('rect.m-bar').getBoundingClientRect();
      return { dot: [d.x + d.width / 2, d.y + d.height / 2], bar: [bar.x + bar.width / 2, bar.y + bar.height / 2] };
    });
    await page.mouse.move(target.dot[0], target.dot[1]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, 'desktop-' + scheme + '-tip-class-point.png'), clip: { x: mb.x, y: mb.y, width: mb.width, height: mb.height } });
    await page.mouse.move(target.bar[0], target.bar[1]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, 'desktop-' + scheme + '-tip-class-bar.png'), clip: { x: mb.x, y: mb.y - 10, width: mb.width, height: mb.height + 10 } });
    await page.mouse.click(target.dot[0], target.dot[1]);
    await page.waitForTimeout(600);
    const hash = await page.evaluate(() => location.hash);
    if (!/#\/mahasiswa\?pilih=/.test(hash)) problems.push('a point on the class map did not open the student, the address is ' + hash);
    await page.screenshot({ path: path.join(dir, 'desktop-' + scheme + '-point-opens-student.png') });
    /* The whole class shows by default, and the count names the narrowing only when a filter or the search narrows the list. */
    for (const [hash, name, expect] of [['#/mahasiswa', 'count-all', /^32 mahasiswa/], ['#/mahasiswa?saring=belum-aktif', 'count-filtered', /^14 dari 32 mahasiswa tampil/]]) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(500);
      await page.mouse.move(2, 896);
      const rows = await page.locator('.a-tbl tbody tr').count();
      const note = page.locator('.a-tnote').first();
      const text = (await note.locator('span').nth(1).textContent()).trim();
      if (!expect.test(text)) problems.push(hash + ' count line says "' + text + '"');
      if (name === 'count-all' && rows !== 32) problems.push('the table shows ' + rows + ' rows instead of the whole class');
      await note.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      const nb = await note.boundingBox();
      await page.screenshot({ path: path.join(dir, 'desktop-' + scheme + '-mahasiswa-' + name + '.png'), clip: { x: nb.x, y: nb.y - 160, width: nb.width, height: nb.height + 160 } });
    }
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'phone and tooltip screenshots written with no console errors and no sideways scroll');
})();
