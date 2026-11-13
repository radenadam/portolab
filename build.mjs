import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const css = src('styles.css');
/* The logo tiles are PNGs of at most 96 pixels, embedded as data: URIs and shown only through <img>. The logos belong to their companies, so the repository carries none, and a stock without a logo shows the monogram tile of its code. A folder logos/ beside this file, which git ignores, adds a logo for each code that names a PNG in it. */
const logoFolder = join(here, 'logos');
const logos = {};
for (const f of existsSync(logoFolder) ? readdirSync(logoFolder).filter((n) => n.endsWith('.png')).sort() : []) {
  const buf = readFileSync(join(here, 'logos', f));
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const w = isPng ? buf.readUInt32BE(16) : 0;
  const h = isPng ? buf.readUInt32BE(20) : 0;
  if (!isPng || w > 96 || h > 96) throw new Error('The logo ' + f + ' must be a PNG of at most 96 pixels, but it is ' + (isPng ? w + ' by ' + h : 'not a PNG'));
  logos[f.replace('.png', '')] = 'data:image/png;base64,' + buf.toString('base64');
}
const js = ['const LOGOS = ' + JSON.stringify(logos) + ';'].concat(['core.js', 'engine.js', 'ui.js', 'peta.js', 'concepts.js', 'screens.js', 'learn.js', 'lecturer.js', 'app.js'].map(src)).join('\n');

const page = `<title>Portolab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Mock Portolab: simulator portofolio saham LQ45 untuk kelas manajemen portofolio.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400..700&display=swap">
<style>
${css}
</style>
<div id="root"></div>
<noscript><p style="padding:24px">Mock Portolab membutuhkan JavaScript.</p></noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>
<script>
${js}
</script>
`;
writeFileSync(join(here, 'portolab-mock.html'), page);

/* The preview wraps the page in the skeleton that publishing adds, so local screenshots match the artifact. */
const preview = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${page}</body></html>`;
writeFileSync(join(here, 'preview.html'), preview);
console.log('built', (Buffer.byteLength(page) / 1024).toFixed(1) + ' KB');
