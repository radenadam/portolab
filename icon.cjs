/* Checks the app icon at the size of the rail and at the largest size it is shown, which is the onboarding, in the light and the dark theme, through the system setting and through the toggle. The icon has no background, its flask takes the ink of the theme, and its line takes the green of gains of the theme. Screenshots go to shots/icon. */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const url = 'file:///' + path.join(__dirname, 'preview.html').split(path.sep).join('/');
const dir = path.join(__dirname, 'shots', 'icon');
fs.mkdirSync(dir, { recursive: true });
const problems = [];
const seen = {};

/* Runs in the page: the drawn size and the colors of each icon that matches the selector. */
function paintOf(sel) {
  return Array.from(document.querySelectorAll(sel)).map((svg) => {
    const r = svg.getBoundingClientRect();
    const part = (c) => getComputedStyle(svg.querySelector(c));
    const root = getComputedStyle(document.documentElement);
    const token = (name) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(' + name + ')';
      svg.parentElement.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    return { width: r.width, height: r.height, shapes: svg.querySelectorAll('rect, circle').length, flask: part('.ai-flask').stroke, line: part('.ai-line').stroke, ink: token('--ink'), gain: token('--gain') };
  });
}

async function look(page, tag, sel, size, dark) {
  const found = (await page.evaluate(paintOf, sel)).filter((f) => f.width > 0);
  if (found.length !== 1) return problems.push(tag + ' shows ' + found.length + ' icons in ' + sel + ' instead of 1');
  const f = found[0];
  if (Math.abs(f.width - size) > 0.5 || Math.abs(f.height - size) > 0.5) problems.push(tag + ' draws the icon at ' + f.width + ' by ' + f.height + ' instead of ' + size);
  if (f.shapes !== 0) problems.push(tag + ' draws ' + f.shapes + ' background shapes behind the icon');
  if (f.flask !== f.ink) problems.push(tag + ' draws the flask in ' + f.flask + ' instead of the ink ' + f.ink);
  if (f.line !== f.gain) problems.push(tag + ' draws the line in ' + f.line + ' instead of the green of gains ' + f.gain);
  const key = dark ? 'dark' : 'light';
  if (seen[key] && seen[key] !== f.flask + ' ' + f.line) problems.push(tag + ' colors the icon ' + f.flask + ' ' + f.line + ', but the same theme elsewhere colors it ' + seen[key]);
  seen[key] = seen[key] || f.flask + ' ' + f.line;
}

async function run(browser, scheme, toggle) {
  const dark = (toggle || scheme) === 'dark';
  const name = toggle ? 'toggle-' + toggle : scheme;
  /* The desktop rail, drawn at 4 times its pixels so the edge and the strokes can be judged. */
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, deviceScaleFactor: 4 });
  const page = await desk.newPage();
  page.on('pageerror', (e) => problems.push(name + ' pageerror ' + e.message));
  await page.goto(url + '#/beranda');
  await page.waitForSelector('.shell');
  if (toggle) await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), toggle);
  await page.waitForTimeout(500);
  await page.mouse.move(700, 600);
  await look(page, name + ' rail', '.rail-logo .app-icon', 36, dark);
  await page.screenshot({ path: path.join(dir, 'rail-' + name + '.png'), clip: { x: 0, y: 0, width: 200, height: 150 } });
  await desk.close();
  /* The onboarding on a phone, which shows the icon at its largest. */
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await phone.newPage();
  p.on('pageerror', (e) => problems.push(name + ' pageerror ' + e.message));
  await p.goto(url + '#/beranda');
  await p.waitForSelector('.shell');
  await p.getByRole('button', { name: 'Demo' }).click();
  await p.getByRole('button', { name: /Mulai sebagai mahasiswa baru/ }).click();
  if (toggle) await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), toggle);
  await p.waitForTimeout(600);
  await look(p, name + ' onboarding', '.onboard .app-icon', 44, dark);
  await p.screenshot({ path: path.join(dir, 'onboarding-' + name + '.png') });
  await p.locator('.onboard .brand').screenshot({ path: path.join(dir, 'onboarding-brand-' + name + '.png') });
  await phone.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const [scheme, toggle] of [['light'], ['dark'], ['light', 'dark'], ['dark', 'light']]) {
    try {
      await run(browser, scheme, toggle);
    } catch (e) {
      problems.push(scheme + (toggle ? ' with the toggle on ' + toggle : '') + ' FAILED: ' + e.message.split(String.fromCharCode(10))[0]);
    }
  }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'the app icon is 36 pixels in the rail and 44 in the onboarding, has no background, and takes the ink and the green of gains of each theme');
})();
