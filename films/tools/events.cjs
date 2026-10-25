const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.resolve(process.argv[2], 'index.html'));
const ev = await p.evaluate(() => FILM.events()); require('fs').writeFileSync(process.argv[3], JSON.stringify(ev)); console.log(ev.taps.length, 'taps'); await b.close(); })();
