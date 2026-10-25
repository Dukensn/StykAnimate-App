const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + path.resolve(process.argv[2], 'thumbs.html'));
await p.evaluate(async () => { for (const f of ['400 40px "Lilita One"', '700 40px "Comic Neue"', '600 40px "Caveat"', '600 40px "Inter"']) await document.fonts.load(f); });
for (const name of process.argv.slice(4)) { await p.evaluate(n => T[n](), name); await p.locator('#c').screenshot({ path: path.join(process.argv[3], name + '.png') }); }
if (errs.length) console.log(errs.join('\n')); await b.close(); })();
