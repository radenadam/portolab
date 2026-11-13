/* Renders the three screens of the reference and of the mock at 1320px in both themes, and puts each pair side by side in shots/compare. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const dir = path.join(__dirname, 'shots', 'compare');
fs.mkdirSync(dir, { recursive: true });
const fileUrl = (f) => 'file:///' + path.join(__dirname, f).replace(/\\/g, '/');
const problems = [];
const SCREENS = [
  { name: 'kelas', frame: 0, role: 'Dosen', hash: '#/kelas' },
  { name: 'mahasiswa', frame: 1, role: 'Dosen', hash: '#/mahasiswa?pilih=a-28' },
  { name: 'beranda', frame: 2, role: null, hash: '#/beranda' },
];

(async () => {
  const browser = await chromium.launch();
  for (const scheme of (process.argv[2] || 'light,dark').split(',')) {
    /* The reference scales each 1320px frame to its column, so a viewport of 1354px gives a zoom of exactly 1. */
    const refCtx = await browser.newContext({ viewport: { width: 1354, height: 1000 }, colorScheme: scheme });
    const ref = await refCtx.newPage();
    await ref.goto(fileUrl('reference/portolab-peta-reference.html'));
    await ref.click(scheme === 'dark' ? '#mode-dark' : '#mode-light');
    await ref.evaluate(() => { document.querySelector('.bar').style.display = 'none'; return document.fonts.ready; });
    await ref.waitForTimeout(600);
    const refShots = {};
    for (const s of SCREENS) {
      const file = path.join(dir, 'ref-' + s.name + '-' + scheme + '.png');
      await ref.locator('.m').nth(s.frame).screenshot({ path: file });
      refShots[s.name] = file;
    }
    await refCtx.close();

    const ctx = await browser.newContext({ viewport: { width: 1320, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(scheme + ' pageerror ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(scheme + ' console ' + m.text()); });
    for (const s of SCREENS) {
      await page.goto(fileUrl('preview.html') + '#/beranda');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForSelector('.shell');
      await page.evaluate(() => document.fonts.ready);
      if (s.role) {
        await page.getByRole('button', { name: 'Demo' }).click();
        await page.getByRole('button', { name: s.role, exact: true }).click();
        await page.waitForTimeout(300);
      }
      await page.evaluate((h) => { location.hash = h; }, s.hash);
      await page.mouse.move(2, 896);
      await page.waitForTimeout(700);
      const mockFile = path.join(dir, 'mock-' + s.name + '-' + scheme + '.png');
      await page.screenshot({ path: mockFile, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) problems.push(s.name + ' ' + scheme + ' scrolls sideways by ' + overflow + 'px');
      const pair = await browser.newPage({ viewport: { width: 2680, height: 400 } });
      const img = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      await pair.setContent(`<body style="margin:0;background:#888;font:600 18px system-ui;color:#fff"><div style="display:flex;gap:40px;align-items:flex-start;padding:10px">
        <figure style="margin:0;width:1320px"><figcaption style="padding:4px 0 8px">Referensi · ${s.name} · ${scheme}</figcaption><img src="${img(refShots[s.name])}" style="display:block;width:1320px"></figure>
        <figure style="margin:0;width:1320px"><figcaption style="padding:4px 0 8px">Mock · ${s.name} · ${scheme}</figcaption><img src="${img(mockFile)}" style="display:block;width:1320px"></figure>
      </div></body>`);
      await pair.waitForTimeout(200);
      await pair.screenshot({ path: path.join(dir, 'side-by-side-' + s.name + '-' + scheme + '.png'), fullPage: true });
      await pair.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'compare screenshots written with no console errors');
})();
