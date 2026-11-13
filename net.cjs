const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const hosts = new Set();
  p.on('request', (r) => { const u = new URL(r.url()); if (u.protocol !== 'file:' && u.protocol !== 'data:') hosts.add(u.host); });
  await p.goto('file:///' + path.join(__dirname, 'portolab-mock.html').split(path.sep).join('/') + '#/beranda');
  await p.waitForTimeout(1500);
  for (const h of ['#/pasar', '#/saham/BBCA', '#/analisis', '#/belajar/9']) { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(300); }
  const fonts = await p.evaluate(async () => { await document.fonts.ready; return [document.fonts.check('500 16px "DM Mono"'), document.fonts.check('400 16px "Instrument Sans"'), document.fonts.check('600 16px "Instrument Sans"')]; });
  console.log('hosts', [...hosts].join(', '), '| fonts loaded', fonts);
  await b.close();
})();
