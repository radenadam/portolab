/* Renders every screen and state at 768, 1024, 1280, 1320, 1440, 1920, and 2560 pixels, and at 390 and 360 on a phone. It fails when the content is wider than its maximum or not centered, when cards or columns that sit side by side end more than 2 pixels apart, when a cell overflows its column, when two tables with the same header texts start a column more than 1 pixel apart, when the rows of a list do not share one column template, or when the page scrolls sideways. Screenshots of every screen at 1920 and 2560 go to shots/layout. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').split(path.sep).join('/');
const dir = path.join(__dirname, 'shots', 'layout');
fs.mkdirSync(dir, { recursive: true });
const MAX = 1360;
const DESKTOP = [768, 1024, 1280, 1320, 1440, 1920, 2560];
const PHONES = [390, 360];
const SHOT_WIDTHS = [1920, 2560];
const STUDENT = ['beranda', 'pasar', 'pasar?tampilan=peta', 'saham/BBCA', 'saham/BBCA/beli', 'aktivitas', 'analisis', 'belajar', 'belajar/2', 'belajar/6', 'belajar/9', 'belajar/10', 'belajar/11', 'belajar/harga', 'kamus'];
const LECTURER = ['kelas', 'mahasiswa', 'mahasiswa?pilih=a-28', 'mahasiswa/a-2', 'mahasiswa/a-2/analisis', 'mahasiswa/a-2/jurnal', 'portofolio', 'portofolio/aktivitas', 'portofolio/analisis', 'saham/BBCA/beli'];
const only = (process.argv[2] || '').split(',').filter(Boolean).map(Number);
const problems = [];

/* Runs in the page. It returns every rule that the screen breaks. */
function inspect(max) {
  const out = [];
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 0) out.push('scrolls sideways by ' + overflow + 'px');
  const visible = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.position !== 'absolute' && cs.position !== 'fixed' && r.width > 0 && r.height > 0;
  };
  if (window.innerWidth >= 960) {
    const centered = (sel, box) => {
      const el = document.querySelector(sel);
      if (!el) return out.push(sel + ' is missing');
      const r = el.getBoundingClientRect();
      if (r.width > max + 0.5) out.push(sel + ' is ' + Math.round(r.width) + 'px wide, more than ' + max + 'px');
      const b = box.getBoundingClientRect();
      const cs = getComputedStyle(box);
      const left = b.left + parseFloat(cs.paddingLeft);
      const right = b.right - parseFloat(cs.paddingRight);
      if (right - left > max + 1 && Math.abs(r.left - left - (right - r.right)) > 2) out.push(sel + ' is not centered: ' + Math.round(r.left - left) + 'px on the left and ' + Math.round(right - r.right) + 'px on the right');
    };
    centered('.page', document.getElementById('main'));
    centered('.topbar-in', document.querySelector('.topbar'));
  }
  /* The visible foot of a column is the foot of its last card, so a column that stretches without its cards still counts as ending early. */
  const hasBox = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    return (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') || (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none');
  };
  const foot = (el, depth) => {
    const r = el.getBoundingClientRect();
    if (hasBox(el) || depth > 8) return r.bottom;
    const kids = Array.from(el.children).filter(visible);
    if (!kids.length) return r.bottom;
    return Math.max(...kids.map((k) => foot(k, depth + 1)));
  };
  const label = (el) => (el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').trim().split(/\s+/).join('.')).slice(0, 60);
  for (const box of document.querySelectorAll('.page .a-main, .page .grid, .page .lesson-grid, .page .stock-layout, .page .a-side.pair')) {
    if (!visible(box)) continue;
    const kids = Array.from(box.children).filter(visible);
    const rows = [];
    for (const k of kids) {
      const top = k.getBoundingClientRect().top;
      let row = rows.find((x) => Math.abs(x.top - top) <= 2);
      if (!row) rows.push((row = { top, items: [] }));
      row.items.push(k);
    }
    for (const row of rows) {
      if (row.items.length < 2) continue;
      const feet = row.items.map((k) => foot(k, 0));
      const spread = Math.max(...feet) - Math.min(...feet);
      if (spread > 2) out.push('in ' + label(box) + ', side-by-side ' + row.items.map(label).join(' and ') + ' end ' + Math.round(spread) + 'px apart');
    }
  }
  /* A cell of a table keeps its content inside, so a value never runs over its mark or the next column. */
  let spills = 0;
  let example = '';
  for (const cell of document.querySelectorAll('.page td, .page .cellbar')) {
    if (!visible(cell)) continue;
    if (cell.scrollWidth > cell.clientWidth + 1) {
      spills += 1;
      if (!example) example = (cell.textContent || '').trim().slice(0, 24);
    }
  }
  if (spills) out.push(spills + ' table cells overflow their column, such as "' + example + '"');

  /* Tables with the same header texts on one screen put each column at the same position. Stacked tables compare their columns on the screen, and tables side by side compare them from their own left edge. */
  const tables = Array.from(document.querySelectorAll('.page table')).filter(visible);
  const headsOf = (t) => Array.from(t.querySelectorAll('thead th'));
  const textOf = (th) => th.textContent.replace(/\s+/g, ' ').trim() || '(no text)';
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const ha = headsOf(tables[i]);
      const hb = headsOf(tables[j]);
      if (!ha.length || ha.map(textOf).join('|') !== hb.map(textOf).join('|')) continue;
      const a = tables[i].getBoundingClientRect();
      const b = tables[j].getBoundingClientRect();
      const stacked = a.left < b.right && b.left < a.right;
      for (let k = 0; k < ha.length; k++) {
        const xa = ha[k].getBoundingClientRect().left - (stacked ? 0 : a.left);
        const xb = hb[k].getBoundingClientRect().left - (stacked ? 0 : b.left);
        if (Math.abs(xa - xb) > 1) {
          out.push('two tables with the columns ' + ha.map(textOf).join(', ') + ' start the column "' + textOf(ha[k]) + '" ' + Math.round(Math.abs(xa - xb)) + 'px apart');
          break;
        }
      }
    }
  }

  /* Rows of one list, and of lists with the same rows on one screen, share one column template. A row is an element whose class names a row, and rows with the same class, left edge, and width belong together. In each row the check follows the items of every grid and flex container. A bar or a chart starts and ends at the same place in every row, and any other item starts or ends at the same place, so text can be aligned left or right. */
  const isBox = (el) => {
    const d = getComputedStyle(el).display;
    return d === 'grid' || d === 'flex' || d === 'inline-grid' || d === 'inline-flex';
  };
  /* An item without text is a bar, a chart, a logo, or an icon, and it must start and end at the same place. */
  const graphic = (el) => el.tagName.toLowerCase() === 'svg' || !(el.textContent || '').trim();
  /* A flex container that holds one phrase, such as a change with its arrow, a status with its icon, or a label with its "?", is one item, so the check does not look inside it. A grid always holds columns. */
  const worded = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
  const phrase = (el) => {
    if (getComputedStyle(el).display.includes('grid')) return false;
    if (worded(el)) return true;
    const kids = Array.from(el.children).filter((k) => !k.matches('.sr-only, .q'));
    return !kids.some(isBox) && kids.filter((k) => (k.textContent || '').trim()).length <= 1;
  };
  /* The items of a flex container that wraps flow like words, so they are not compared, but their own columns are. */
  const flows = (el) => getComputedStyle(el).display.includes('flex') && getComputedStyle(el).flexWrap !== 'nowrap';
  const rowEls = Array.from(document.querySelectorAll('.page [class*="-row"], .page .a-flag, .page .a-feed, .page .a-risk')).filter((el) => visible(el) && isBox(el) && !el.closest('table'));
  const groups = new Map();
  for (const el of rowEls) {
    const r = el.getBoundingClientRect();
    const key = String(el.className) + '@' + Math.round(r.left) + ':' + Math.round(r.width);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  }
  for (const [key, members] of groups) {
    if (members.length < 2) continue;
    const items = new Map();
    /* A "?" follows the word that it explains, so it is not a column. */
    const walk = (el, pathKey, depth) => {
      const kids = Array.from(el.children).filter((k) => {
        const cs = getComputedStyle(k);
        const r = k.getBoundingClientRect();
        return !k.matches('.q, .sr-only') && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.position !== 'absolute' && r.width > 0 && r.height > 0;
      });
      const flowing = flows(el);
      kids.forEach((k, i) => {
        const p = pathKey + '/' + i + k.tagName.toLowerCase();
        if (!flowing) {
          const r = k.getBoundingClientRect();
          if (!items.has(p)) items.set(p, { el: k, lefts: [], rights: [], graphic: graphic(k) });
          items.get(p).lefts.push(r.left);
          items.get(p).rights.push(r.right);
        }
        if (depth < 4 && isBox(k) && !graphic(k) && !phrase(k)) walk(k, p, depth + 1);
      });
    };
    for (const m of members) walk(m, '', 0);
    for (const [p, it] of items) {
      if (it.lefts.length < 2) continue;
      const spread = (xs) => Math.max(...xs) - Math.min(...xs);
      const l = spread(it.lefts);
      const r = spread(it.rights);
      const bad = it.graphic ? l > 1 || r > 1 : l > 1 && r > 1;
      if (bad) {
        const what = (it.graphic ? 'the item without text ' : 'the item "' + (it.el.textContent || '').trim().slice(0, 20) + '" ') + label(it.el);
        out.push('rows ' + key.split('@')[0].trim().split(/\s+/).join('.') + ' do not share a column template: ' + what + ' moves ' + Math.round(Math.max(l, r)) + 'px from row to row');
        break;
      }
    }
  }
  return out;
}

async function visit(page, width, role, route, shoot) {
  await page.evaluate((h) => { location.hash = h; }, '#/' + route);
  await page.waitForTimeout(550);
  await page.mouse.move(1, 2);
  const found = await page.evaluate(inspect, MAX);
  for (const f of found) problems.push(width + 'px ' + role + ' ' + route + ': ' + f);
  if (shoot) await page.screenshot({ path: path.join(dir, width + '-' + role + '-' + route.replace(/[/?=]/g, '_') + '.png'), fullPage: true });
}

/* The check proves itself first: a layout broken on purpose must fail it. */
async function selfTest(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(url + '#/beranda');
  await page.waitForSelector('.shell');
  await page.waitForTimeout(500);
  const clean = await page.evaluate(inspect, MAX);
  await page.addStyleTag({ content: '.page { max-width: none !important; } .a-h { align-items: start !important; } .a-h .a-h-left > :last-child { flex: none !important; } .a-h .a-h-map { margin-right: -40px; } .a-ht .wide { width: 1% !important; }' });
  await page.waitForTimeout(400);
  const broken = await page.evaluate(inspect, MAX);
  await ctx.close();
  const caught = ['more than', 'apart', 'scrolls sideways', 'overflow their column'].map((k) => broken.some((b) => b.includes(k)));
  if (clean.length) problems.push('self-test: the clean Beranda already fails: ' + clean.join('; '));
  if (caught.includes(false)) problems.push('self-test: a broken layout passed the check. It found only: ' + broken.join('; '));
  /* Columns that move: the tables of Pasar sized by their content, and the rows of stocks on a phone with a price column sized by its content. */
  const cases = [
    { width: 1920, phone: false, css: 'table.data.fit { table-layout: auto !important; } table.data.fit th { width: auto !important; }', expect: 'start the column' },
    { width: 390, phone: true, css: '.list-row.stock-row { grid-template-columns: minmax(0, 1fr) 64px auto !important; }', expect: 'do not share a column template' },
  ];
  for (const c of cases) {
    const cx = await browser.newContext(Object.assign({ viewport: { width: c.width, height: 1000 } }, c.phone ? { isMobile: true, hasTouch: true } : {}));
    const pg = await cx.newPage();
    await pg.goto(url + '#/pasar');
    await pg.waitForSelector('.shell');
    await pg.waitForTimeout(500);
    const before = await pg.evaluate(inspect, MAX);
    await pg.addStyleTag({ content: c.css });
    await pg.waitForTimeout(300);
    const after = await pg.evaluate(inspect, MAX);
    await cx.close();
    if (before.length) problems.push('self-test: the clean Pasar at ' + c.width + 'px already fails: ' + before.join('; '));
    if (!after.some((b) => b.includes(c.expect))) problems.push('self-test: Pasar at ' + c.width + 'px with ' + c.css + ' passed the check. It found only: ' + after.join('; '));
  }
}

(async () => {
  const browser = await chromium.launch();
  await selfTest(browser);
  const widths = (only.length ? only : DESKTOP.concat(PHONES));
  for (const width of widths) {
    const phone = PHONES.includes(width);
    const ctx = await browser.newContext(Object.assign({ viewport: { width, height: phone ? 800 : 1000 } }, phone ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(width + 'px pageerror ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(width + 'px console ' + m.text()); });
    await page.goto(url + '#/beranda');
    await page.waitForSelector('.shell');
    await page.evaluate(() => document.fonts.ready);
    const shoot = SHOT_WIDTHS.includes(width);
    for (const r of STUDENT) await visit(page, width, 'mahasiswa', r, shoot);
    /* The empty Beranda of a new student. */
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: /Mulai sebagai mahasiswa baru/ }).click();
    await page.getByRole('button', { name: 'Lewati' }).click();
    await page.waitForTimeout(400);
    await visit(page, width, 'mahasiswa', 'beranda?kosong=1', shoot);
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: /Pulihkan data contoh/ }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: 'Dosen', exact: true }).click();
    /* The toast of the restored data would cover the screenshots of the lecturer, so the check waits until it leaves. */
    await page.waitForSelector('.toast', { state: 'detached', timeout: 10000 });
    for (const r of LECTURER) await visit(page, width, 'dosen', r, shoot);
    await ctx.close();
  }
  await browser.close();
  console.log(problems.length ? problems.length + ' layout problems:\n' + problems.join('\n') : 'layout holds at ' + widths.join(', ') + ' pixels on every screen: centered, no sideways scroll, side-by-side cards and columns end on one line, tables with the same columns put each column at the same place, and the rows of every list share one column template');
})();
