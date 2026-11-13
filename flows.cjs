const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const shotDir = path.join(__dirname, 'shots', 'flows');
fs.mkdirSync(shotDir, { recursive: true });

const VIEWPORTS = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  laptop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};
const only = (process.argv[2] || '').split(',').filter(Boolean);
const vps = (process.argv[3] || 'phone,laptop').split(',');
const schemes = (process.argv[4] || 'light,dark').split(',');
const problems = [];
const wait = (page, ms = 380) => page.waitForTimeout(ms);

async function newPage(browser, vp, scheme) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: VIEWPORTS[vp].width, height: VIEWPORTS[vp].height }, colorScheme: scheme }, VIEWPORTS[vp]));
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(vp + '/' + scheme + ' console ' + m.type() + ': ' + m.text());
  });
  page.on('pageerror', (e) => problems.push(vp + '/' + scheme + ' pageerror: ' + e.message));
  await page.goto(url + '#/beranda');
  await page.waitForSelector('.shell');
  await wait(page, 700);
  return { ctx, page };
}
function shooter(page, flow, vp, scheme) {
  let n = 0;
  return async (slug, opts = {}) => {
    n += 1;
    if (!opts.keepPointer) await page.mouse.move(1, (page.viewportSize() || { height: 800 }).height - 2);
    await wait(page, opts.wait || 350);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) problems.push(`${flow} ${vp}/${scheme} step ${n} ${slug}: page scrolls sideways by ${overflow}px`);
    const file = `${flow}-${vp}-${scheme}-${String(n).padStart(2, '0')}-${slug}.png`;
    await page.screenshot({ path: path.join(shotDir, file), fullPage: !!opts.full });
  };
}
async function demo(page, name) {
  await page.getByRole('button', { name: 'Demo' }).click();
  await wait(page, 250);
  await page.getByRole('button', { name }).click();
  await wait(page, 450);
}
async function scrollTo(page, selector) {
  await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -70));
  await wait(page, 200);
}
async function tab(page, vp, name) {
  if (vp === 'phone') await page.locator('.tabbar').getByRole('link', { name }).click();
  else await page.locator('.rail').getByRole('link', { name }).click();
  await wait(page, 400);
}

const FLOWS = {
  /* A new student's first visit and first purchase from the market. */
  async f1(page, vp, shot) {
    await demo(page, /Mulai sebagai mahasiswa baru/);
    await shot('onboarding-1');
    await page.getByRole('button', { name: 'Lanjut' }).click();
    await shot('onboarding-2');
    await page.getByRole('button', { name: 'Lanjut' }).click();
    await shot('onboarding-3');
    await page.getByRole('button', { name: 'Mulai', exact: true }).click();
    await shot('empty-home', { full: vp === 'laptop' });
    await page.getByRole('link', { name: /Cari saham pertama Anda/ }).click();
    await shot('market');
    await page.locator('a[href="#/saham/BBRI"]').first().click();
    await shot('stock');
    if (vp === 'phone') {
      await page.locator('.tradebar a[href="#/saham/BBRI/beli"]').click();
      await wait(page, 400);
    }
    await page.locator('#ticket-lots').fill('200');
    await page.locator('#ticket-reason').fill('Bank dengan nasabah UMKM terbesar. Saya mulai dari saham yang saya pahami.');
    await shot('ticket-filled');
    if (vp === 'phone') {
      await page.locator('.sheet-body').evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await shot('ticket-impact');
    }
    await page.locator('.ticket-confirm button').click();
    await shot('ticket-success');
    await page.goto(url + '#/beranda');
    await wait(page, 600);
    await shot('home-after-first-buy', { full: true });
  },
  /* Checking the portfolio the next day. */
  async f2(page, vp, shot) {
    await shot('home-today');
    await page.getByRole('button', { name: 'Grafik waktu', exact: true }).click();
    await shot('home-time-chart');
    await page.getByRole('button', { name: 'Peta', exact: true }).click();
    await page.locator('.a-h-map .map').focus();
    await page.keyboard.press('ArrowRight');
    await shot('home-map-tip', { keepPointer: true });
    await demo(page, /Lompat ke hari bursa berikutnya/);
    await shot('home-next-day');
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot('home-next-day-full', { full: true });
    await tab(page, vp, 'Aktivitas');
    await shot('activity-next-day');
  },
  /* Researching a stock and seeing its impact before buying. */
  async f3(page, vp, shot) {
    await tab(page, vp, 'Pasar');
    await page.getByRole('button', { name: /Perubahan hari ini/ }).click();
    await wait(page, 200);
    await page.getByRole('button', { name: 'Beta', exact: true }).click();
    await scrollTo(page, '#all-h');
    await shot('market-by-beta');
    await page.getByRole('button', { name: 'Peta', exact: true }).click();
    await shot('market-map');
    await page.getByRole('button', { name: 'Simpangan baku', exact: true }).click();
    await shot('market-map-sd');
    await page.getByRole('button', { name: 'Beta', exact: true }).first().click();
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();
    await page.locator('a[href="#/saham/PTBA"]').first().click();
    await shot('stock-top');
    await scrollTo(page, '#stats');
    await shot('stock-stats');
    await scrollTo(page, '#impact');
    await page.locator('#impact').getByRole('button', { name: '20%' }).click();
    await shot('stock-impact-20');
    await page.locator('#impact a.btn').click();
    await wait(page, 450);
    await shot('ticket-from-impact');
  },
  /* A rejected order fixed with one tap. */
  async f4(page, vp, shot) {
    await page.goto(url + '#/saham/BBCA/beli');
    await wait(page, 700);
    await page.getByRole('button', { name: 'Limit', exact: true }).click();
    await page.locator('#ticket-price').fill('12.600');
    await page.locator('#ticket-price').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('price-above-ara');
    await page.locator('.issue .btn').first().click();
    await page.locator('#ticket-price').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('fixed-to-ara');
    await page.locator('#ticket-price').fill('9.290');
    await page.locator('#ticket-price').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('price-off-tick');
    await page.locator('.issue .btn').first().click();
    await page.locator('#ticket-lots').fill('40');
    await page.locator('#ticket-lots').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('not-enough-cash');
    await page.locator('.issue .btn').first().click();
    await page.locator('#ticket-lots').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('fixed-lots');
    await page.locator('.ticket-confirm button').click();
    await shot('limit-order-waiting');
  },
  /* Selling part of a holding with a reason. */
  async f5(page, vp, shot) {
    await page.locator('a[href="#/saham/ANTM"]').first().click();
    await wait(page, 500);
    await shot('holding-stock');
    if (vp === 'phone') {
      await page.locator('.tradebar a[href="#/saham/ANTM/jual"]').click();
      await wait(page, 400);
    } else {
      await page.locator('.ticket-dock').getByRole('button', { name: 'Jual', exact: true }).click();
    }
    await page.locator('#ticket-lots').fill('50');
    await page.locator('#ticket-lots').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('sell-too-many');
    await page.locator('.issue .btn').first().click();
    await page.locator('#ticket-lots').fill('15');
    await page.locator('#ticket-reason').fill('ANTM menyumbang sepertiga risiko portofolio. Saya kurangi bobotnya supaya risiko lebih seimbang.');
    await page.locator('#ticket-lots').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot('sell-filled-in');
    await page.locator('#ticket-reason').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await shot('sell-reason-impact');
    await page.locator('.ticket-confirm button').click();
    await shot('sell-success');
    await page.goto(url + (vp === 'phone' ? '#/aktivitas/jurnal' : '#/aktivitas'));
    await wait(page, 600);
    await shot('journal');
  },
  /* Reading the analysis and opening a "?" card and a calculation. */
  async f6(page, vp, shot) {
    await tab(page, vp, 'Analisis');
    await shot('analysis-top');
    await shot('analysis-full', { full: true });
    await page.getByRole('button', { name: 'Simpangan baku', exact: true }).click();
    await shot('analysis-map-sd');
    await page.getByRole('button', { name: 'Beta', exact: true }).first().click();
    await page.getByRole('button', { name: 'Apa itu Beta?' }).first().click();
    await shot('beta-card');
    await page.locator('.sheet details.calc summary').first().click();
    await shot('beta-calc');
    await page.keyboard.press('Escape');
    await wait(page, 300);
    await page.locator('button.link-btn', { hasText: 'Lihat perhitungan' }).nth(1).click();
    await shot('risk-calc');
    await page.locator('.sheet-body').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.locator('.sheet details.calc').last().locator('summary').click();
    await page.locator('.sheet-body').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await shot('risk-calc-data');
    await page.keyboard.press('Escape');
    await wait(page, 300);
    await scrollTo(page, '#corr');
    await shot('analysis-corr-contrib');
    await page.locator('#corr button[role="cell"]:not([disabled])').nth(3).click();
    await shot('corr-card');
  },
  /* Opening the lesson of session 9 and using its interactive. */
  async f7(page, vp, shot) {
    await tab(page, vp, 'Belajar');
    await shot('learn');
    await page.locator('a[href="#/belajar/9"]').click();
    await shot('lesson9-top');
    await page.locator('#l9-b').focus();
    for (let i = 0; i < 11; i++) await page.keyboard.press('ArrowRight');
    await scrollTo(page, '#l9-h');
    await shot('lesson9-interactive');
    await shot('lesson9-full', { full: true });
    await page.goto(url + '#/belajar/2');
    await wait(page, 500);
    await page.locator('#l2-r').focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowLeft');
    await scrollTo(page, '#l2-h');
    await shot('lesson2-interactive');
    await page.goto(url + '#/kamus');
    await wait(page, 500);
    await page.locator('#kamus-q').fill('risiko');
    await shot('glossary-search');
  },
  /* The lecturer ranking students and opening one. */
  async f8(page, vp, shot) {
    await demo(page, 'Dosen');
    await shot('class');
    await shot('class-full', { full: true });
    await page.getByRole('button', { name: 'Simpangan baku', exact: true }).click();
    await shot('class-map-sd', { full: true });
    await page.getByRole('button', { name: 'Beta', exact: true }).first().click();
    await page.getByRole('button', { name: /Kode gabung/ }).click();
    await shot('join-code');
    await page.keyboard.press('Escape');
    await page.locator('.a-k .map').first().focus();
    await page.keyboard.press('ArrowRight');
    await shot('class-map-tip', { keepPointer: true });
    await page.keyboard.press('Enter');
    await wait(page, 600);
    await shot('students-from-map');
    await page.goto(url + '#/mahasiswa');
    await wait(page, 600);
    await shot('students-alpha');
    await page.getByRole('button', { name: 'Sharpe', exact: true }).click();
    await shot('students-sharpe');
    if (vp === 'phone') await page.locator('.m-row').nth(3).click();
    else await page.locator('.a-tbl .a-who').nth(3).click();
    await shot('student-panel');
    await page.getByRole('link', { name: 'Buka portofolio' }).click();
    await wait(page, 600);
    await shot('student-summary');
    await page.getByRole('button', { name: 'Analisis', exact: true }).click();
    await shot('student-analysis');
    await page.getByRole('button', { name: 'Jurnal dan order', exact: true }).click();
    await shot('student-journal');
    /* The lecturer's own demonstration portfolio: its tabs, a trade into it, and the class untouched by it. */
    const classBefore = await page.evaluate(async () => {
      location.hash = '#/kelas';
      await new Promise((r) => setTimeout(r, 600));
      return Array.from(document.querySelectorAll('.a-strip b')).map((b) => b.textContent).join('|') + '|' + document.querySelector('.a-head h1').textContent;
    });
    await tab(page, vp, 'Portofolio');
    await shot('lecturer-portfolio', { full: true });
    await page.getByRole('button', { name: 'Aktivitas', exact: true }).click();
    await shot('lecturer-portfolio-activity');
    await page.getByRole('button', { name: 'Analisis', exact: true }).click();
    await shot('lecturer-portfolio-analysis');
    await page.goto(url + '#/saham/BBCA/beli');
    await wait(page, 700);
    await page.locator('#ticket-lots').fill('5');
    await page.locator('#ticket-reason').fill('Menambah bank berbeta rendah untuk peragaan di kelas.');
    await shot('lecturer-ticket');
    await page.locator('.ticket-confirm button').click();
    await shot('lecturer-trade-filled');
    await page.goto(url + '#/portofolio/aktivitas');
    await wait(page, 600);
    await shot('lecturer-portfolio-after-trade');
    const classAfter = await page.evaluate(async () => {
      location.hash = '#/kelas';
      await new Promise((r) => setTimeout(r, 600));
      return Array.from(document.querySelectorAll('.a-strip b')).map((b) => b.textContent).join('|') + '|' + document.querySelector('.a-head h1').textContent;
    });
    if (classBefore !== classAfter) problems.push('f8 ' + vp + ': a trade of the lecturer changed the class from "' + classBefore + '" to "' + classAfter + '"');
    await demo(page, /^Mahasiswa$/);
    await page.goto(url + '#/portofolio');
    await wait(page, 500);
    if (!(await page.evaluate(() => !!document.querySelector('.a-hero')))) problems.push('f8 ' + vp + ': a student who opens #/portofolio does not land on Beranda');
    if (await page.evaluate(() => document.querySelector('.shell').innerText.includes('Portofolio demonstrasi') || !!document.querySelector('a[href="#/portofolio"]'))) problems.push('f8 ' + vp + ': a student can see the portfolio of the lecturer');
  },
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, fn] of Object.entries(FLOWS)) {
    if (only.length && !only.includes(name)) continue;
    for (const vp of vps) {
      for (const scheme of schemes) {
        const { ctx, page } = await newPage(browser, vp, scheme);
        try {
          await fn(page, vp, shooter(page, name, vp, scheme));
        } catch (e) {
          problems.push(`${name} ${vp}/${scheme} FAILED: ${e.message.split('\n')[0]}`);
          await page.screenshot({ path: path.join(shotDir, `${name}-${vp}-${scheme}-FAILED.png`) });
        }
        await ctx.close();
      }
    }
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'all flows ran with no console errors and no sideways scroll');
})();
