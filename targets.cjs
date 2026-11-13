const { chromium } = require('@playwright/test');
const path = require('path');
const url = 'file:///' + path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const routes = ['beranda', 'pasar', 'saham/BBCA', 'saham/BBCA/beli', 'aktivitas', 'aktivitas/jurnal', 'analisis', 'belajar', 'belajar/2', 'belajar/6', 'belajar/9', 'belajar/10', 'belajar/11', 'belajar/harga', 'kamus', 'kamus/beta'];
const lecturer = ['kelas', 'mahasiswa', 'mahasiswa?pilih=a-28', 'mahasiswa?saring=belum-aktif', 'portofolio', 'portofolio/aktivitas', 'portofolio/analisis', 'saham/BBCA/beli', 'mahasiswa/a-2', 'mahasiswa/a-2/analisis', 'mahasiswa/a-2/jurnal', 'mahasiswa/nadia/jurnal'];

(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const width of [360, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: width < 500, isMobile: width < 500 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => out.push('pageerror ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') out.push('console ' + m.text()); });
    await page.goto(url + '#/beranda');
    await page.waitForTimeout(700);
    const visit = async (r) => {
      await page.evaluate((h) => { location.hash = h; }, '#/' + r);
      await page.waitForTimeout(450);
      const res = await page.evaluate(() => {
        const bad = [];
        const els = document.querySelectorAll('a[href], button, input, textarea, summary, [role="cell"], [tabindex="0"]');
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
          if (el.classList.contains('skip')) continue;
          if (el.tagName === 'INPUT' && el.type === 'checkbox') continue;
          if (r.height < 43.5) bad.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) + '" h=' + Math.round(r.height));
        }
        return { bad: Array.from(new Set(bad)), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      if (res.overflow > 0) out.push(width + ' ' + r + ' sideways ' + res.overflow + 'px');
      for (const b of res.bad) out.push(width + ' ' + r + ' small target: ' + b);
    };
    for (const r of routes) await visit(r);
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: 'Dosen' }).click();
    await page.waitForTimeout(400);
    for (const r of lecturer.concat(['pasar', 'saham/ANTM', 'belajar/9'])) await visit(r);
    await ctx.close();
  }
  await browser.close();
  console.log(out.length ? Array.from(new Set(out)).join('\n') : 'all targets at least 44px and no sideways scroll');
})();
