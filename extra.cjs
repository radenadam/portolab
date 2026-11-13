const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const dir = path.join(__dirname, 'shots', 'extra');
fs.mkdirSync(dir, { recursive: true });
const problems = [];
const wait = (p, ms = 400) => p.waitForTimeout(ms);

async function open(browser, vp, scheme) {
  const ctx = await browser.newContext(vp === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme } : { viewport: vp, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push('console ' + m.text()); });
  await page.goto(url + '#/beranda');
  await wait(page, 700);
  return { ctx, page };
}
const shot = async (page, name, full) => { await wait(page, 350); await page.screenshot({ path: path.join(dir, name + '.png'), fullPage: !!full }); };

(async () => {
  const browser = await chromium.launch();
  let { ctx, page } = await open(browser, 'phone', 'light');

  /* The explicit theme choice overrides the system setting. */
  await page.getByRole('button', { name: /Profil dan tema/ }).click();
  await shot(page, 'x01-phone-profile-menu');
  await page.getByRole('button', { name: 'Gelap', exact: true }).click();
  await page.keyboard.press('Escape');
  await shot(page, 'x02-phone-explicit-dark-on-light-system');
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (attr !== 'dark') problems.push('theme toggle did not set data-theme=dark');

  /* The class switcher. */
  await page.locator('.topbar .class-switch').click();
  await shot(page, 'x03-phone-class-switcher');
  await page.getByRole('button', { name: /Analisis Investasi/ }).click();
  await shot(page, 'x04-phone-second-class-empty');
  await page.locator('.topbar .class-switch').click();
  await page.getByRole('button', { name: /Manajemen Portofolio · Kelas A/ }).click();
  await page.getByRole('button', { name: /Profil dan tema/ }).click();
  await page.getByRole('button', { name: 'Sistem', exact: true }).click();
  await page.keyboard.press('Escape');
  await ctx.close();

  /* Ordering while the market is closed, then the next trading day. */
  ({ ctx, page } = await open(browser, 'phone', 'light'));
  await page.getByRole('button', { name: 'Demo' }).click();
  await page.getByRole('button', { name: /Lompat ke malam ini/ }).click();
  await shot(page, 'x05-phone-evening-home');
  await page.goto(url + '#/saham/PTBA/beli');
  await wait(page, 600);
  await page.locator('#ticket-lots').fill('50');
  await page.locator('#ticket-reason').fill('Menambah sektor energi untuk diversifikasi.');
  await page.locator('#ticket-lots').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, 'x06-phone-ticket-market-closed');
  await page.locator('.ticket-confirm button').click();
  await shot(page, 'x07-phone-order-queued');
  await page.goto(url + '#/aktivitas');
  await wait(page, 500);
  await shot(page, 'x08-phone-activity-queued');
  await page.getByRole('button', { name: 'Demo' }).click();
  await page.getByRole('button', { name: /Lompat ke hari bursa berikutnya/ }).click();
  await wait(page, 600);
  await shot(page, 'x09-phone-next-morning-since');
  await ctx.close();

  /* Keyboard alone on the laptop: skip link, tab to a "?" card, open it, close it, read a chart with the arrows. */
  ({ ctx, page } = await open(browser, { width: 1440, height: 900 }, 'light'));
  await page.keyboard.press('Tab');
  await shot(page, 'x10-laptop-keyboard-skip-link');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab');
  await shot(page, 'x11-laptop-keyboard-focus-q');
  await page.keyboard.press('Enter');
  await shot(page, 'x12-laptop-keyboard-card-open');
  await page.keyboard.press('Escape');
  await wait(page, 300);
  const focusedAfter = await page.evaluate(() => (document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent)) || '');
  if (!/Apa itu/.test(focusedAfter)) problems.push('focus did not return to the "?" after Escape, it is on: ' + focusedAfter.slice(0, 40));
  await page.locator('.chart').first().focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
  await shot(page, 'x13-laptop-keyboard-chart-crosshair');
  await page.goto(url + '#/belajar/6');
  await wait(page, 500);
  await shot(page, 'x14-laptop-lesson6', true);
  await page.goto(url + '#/belajar/10');
  await wait(page, 500);
  await page.locator('#l10-ANTM').focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  await shot(page, 'x15-laptop-lesson10', true);
  await page.goto(url + '#/belajar/11');
  await wait(page, 400);
  await shot(page, 'x16-laptop-lesson11-cannot');
  await page.goto(url + '#/belajar/harga');
  await wait(page, 400);
  await shot(page, 'x17-laptop-price-guide', true);
  await page.goto(url + '#/kamus/korelasi');
  await wait(page, 500);
  await shot(page, 'x18-laptop-glossary-focus');
  await ctx.close();

  /* Tablet width: the ticket opens as a side sheet. */
  ({ ctx, page } = await open(browser, { width: 1024, height: 768 }, 'dark'));
  await page.goto(url + '#/saham/BBCA');
  await wait(page, 500);
  await shot(page, 'x19-tablet-stock');
  await page.locator('.tradebar a[href="#/saham/BBCA/beli"]').click();
  await shot(page, 'x20-tablet-ticket-side-sheet');
  await ctx.close();

  /* Phone dark: onboarding and a concept card. */
  ({ ctx, page } = await open(browser, 'phone', 'dark'));
  await page.getByRole('button', { name: 'Demo' }).click();
  await shot(page, 'x21-phone-dark-demo-panel');
  await page.getByRole('button', { name: /Buka onboarding saja/ }).click();
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await shot(page, 'x22-phone-dark-onboarding-2');
  await page.getByRole('button', { name: 'Lewati' }).click();
  await page.getByRole('button', { name: /Simulasi, harga tertunda/ }).first().click();
  await shot(page, 'x23-phone-dark-sim-card');
  await ctx.close();

  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'extra checks passed');
})();
