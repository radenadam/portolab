/* Checks that information asked for while doing something opens in place and that closing it returns the reader exactly where they were.
   It types lots in the ticket, opens a "?" card and its lesson in a sheet, closes both, and finds the lots, the address, and the ticket unchanged. It also checks key terms, the lesson links of other screens, and the way of a practice task and back. Screenshots go to shots/inplace. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').split(path.sep).join('/');
const dir = path.join(__dirname, 'shots', 'inplace');
fs.mkdirSync(dir, { recursive: true });
const problems = [];
const wait = (p, ms = 400) => p.waitForTimeout(ms);
const sheets = (page) => page.locator('.sheet').count();
const hash = (page) => page.evaluate(() => location.hash);

async function run(browser, vp, scheme) {
  const phone = vp === 'phone';
  const ctx = await browser.newContext(Object.assign({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, colorScheme: scheme }, phone ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
  const page = await ctx.newPage();
  const tag = vp + '/' + scheme;
  page.on('pageerror', (e) => problems.push(tag + ' pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(tag + ' console ' + m.text()); });
  const shot = (name) => page.screenshot({ path: path.join(dir, vp + '-' + scheme + '-' + name + '.png') });
  await page.goto(url + '#/saham/BBCA/beli');
  await page.waitForSelector('.shell');
  await wait(page, 700);

  /* 1. An order in progress survives a "?" card and its lesson. */
  await page.locator('#ticket-lots').fill('37');
  await page.locator('#ticket-reason').fill('Alasan yang sedang ditulis.');
  const before = await hash(page);
  const base = await sheets(page);
  await page.getByRole('button', { name: 'Apa itu lot?' }).click();
  await wait(page);
  if ((await sheets(page)) !== base + 1) problems.push(tag + ' the "?" card did not open over the ticket');
  await page.getByRole('button', { name: /Pelajari lebih lanjut/ }).click();
  await wait(page, 600);
  if ((await sheets(page)) !== base + 2) problems.push(tag + ' the lesson did not open in a sheet over the card');
  if (!(await page.locator('.sheet .lesson.in-sheet').count())) problems.push(tag + ' the sheet does not hold the lesson');
  if (!(await page.getByRole('link', { name: /Buka di Belajar/ }).count())) problems.push(tag + ' the lesson sheet has no "Buka di Belajar"');
  if ((await hash(page)) !== before) problems.push(tag + ' opening the lesson changed the address to ' + (await hash(page)));
  await shot('lesson-sheet-over-ticket');
  await page.keyboard.press('Escape');
  await wait(page);
  if ((await sheets(page)) !== base + 1) problems.push(tag + ' closing the lesson did not return to the card');
  await page.keyboard.press('Escape');
  await wait(page);
  if ((await sheets(page)) !== base) problems.push(tag + ' closing the card did not return to the ticket');
  const lots = await page.locator('#ticket-lots').inputValue();
  const reason = await page.locator('#ticket-reason').inputValue();
  if (lots !== '37') problems.push(tag + ' the lots changed to "' + lots + '" after the card and the lesson closed');
  if (reason !== 'Alasan yang sedang ditulis.') problems.push(tag + ' the reason changed after the card and the lesson closed');
  if ((await hash(page)) !== before) problems.push(tag + ' the address changed to ' + (await hash(page)));
  await shot('ticket-after-closing');

  /* 1b. "Buka di Belajar" leaves the ticket for the lesson page, and back returns to the ticket with its draft. */
  await page.locator('#ticket-lots').fill('23');
  await wait(page, 200);
  await page.getByRole('button', { name: 'Apa itu lot?' }).click();
  await wait(page);
  await page.getByRole('button', { name: /Pelajari lebih lanjut/ }).click();
  await wait(page, 500);
  await page.getByRole('link', { name: /Buka di Belajar/ }).click();
  await wait(page, 600);
  if (!/#\/belajar\/6/.test(await hash(page))) problems.push(tag + ' "Buka di Belajar" led to ' + (await hash(page)));
  await page.goBack();
  await wait(page, 700);
  const kept = await page.locator('#ticket-lots').inputValue().catch(() => 'missing');
  if (kept !== '23') problems.push(tag + ' after "Buka di Belajar" and back, the lots are "' + kept + '" instead of "23"');
  await shot('ticket-after-lesson-page-and-back');

  /* 2. A key term expands in place. */
  await page.goto(url + '#/belajar/10');
  await wait(page, 600);
  const term = page.locator('.term-btn').first();
  await term.click();
  await wait(page, 200);
  if ((await term.getAttribute('aria-expanded')) !== 'true') problems.push(tag + ' a key term did not expand');
  if ((await hash(page)) !== '#/belajar/10') problems.push(tag + ' a key term left the lesson');
  await term.scrollIntoViewIfNeeded();
  await shot('key-term-open');

  /* 3. The lesson links of other screens open a sheet. */
  for (const [h, name] of [['#/beranda', 'Pelajari'], ['#/analisis', 'Pelajari'], ['#/kamus', /^Sesi \d+:/]]) {
    await page.goto(url + h);
    await wait(page, 600);
    const n = await sheets(page);
    await page.getByRole('button', { name }).first().click();
    await wait(page, 500);
    if ((await sheets(page)) !== n + 1 || (await hash(page)) !== h) problems.push(tag + ' "' + name + '" on ' + h + ' did not open its lesson in place');
    await page.keyboard.press('Escape');
    await wait(page, 300);
  }

  /* 4. A practice task opens the exact control with its task in one line, and leads back to the same place in the lesson. */
  await page.goto(url + '#/belajar/6');
  await wait(page, 600);
  await page.locator('.practice a.btn').first().click();
  await wait(page, 700);
  const banner = page.locator('.task-banner').first();
  if (!(await banner.count())) problems.push(tag + ' the practice task opened the ticket without its task line');
  const limitPressed = await page.locator('.ticket').first().getByRole('button', { name: 'Limit', exact: true }).getAttribute('aria-pressed');
  if (limitPressed !== 'true') problems.push(tag + ' the practice task did not open the ticket on Limit');
  await shot('practice-task-ticket');
  await page.locator(phone ? '.sheet .task-banner a' : '.task-banner a').first().click();
  await wait(page, 800);
  if (!/#\/belajar\/6\?ke=praktik/.test(await hash(page))) problems.push(tag + ' "Kembali ke pelajaran" led to ' + (await hash(page)));
  /* The practice is in view: at the top of the screen, or as high as the page can scroll it when it sits near the foot of the page. */
  const where = await page.locator('#praktik-6').evaluate((el) => {
    const r = el.getBoundingClientRect();
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    return { top: r.top, atEnd, h: window.innerHeight };
  });
  if (where.top < -2 || where.top > where.h - 150 || (where.top > 120 && !where.atEnd)) problems.push(tag + ' the way back did not return to the practice of the lesson, which is at ' + Math.round(where.top) + 'px');
  await shot('back-at-practice');

  /* 5. The lecturer's lesson link on Kelas opens a sheet too. */
  await page.goto(url + '#/beranda');
  await wait(page, 500);
  await page.getByRole('button', { name: 'Demo' }).click();
  await page.getByRole('button', { name: 'Dosen', exact: true }).click();
  await wait(page, 600);
  await page.getByRole('button', { name: /Buka materi sesi/ }).click();
  await wait(page, 500);
  if ((await sheets(page)) !== 1 || !/#\/kelas/.test(await hash(page))) problems.push(tag + ' "Buka materi sesi" on Kelas did not open its lesson in place');
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
  console.log(problems.length ? problems.join('\n') : 'every card, term, and lesson opened in place, closing them kept the order in progress, and the practice task led back to the practice');
})();
