const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + path.resolve(process.argv[2], 'thumb.html'));
await p.evaluate(async () => { await document.fonts.load('700 40px "Comic Neue"'); await document.fonts.load('600 40px "Caveat"'); drawThumb(); });
await p.locator('#c').screenshot({ path: process.argv[3] }); await b.close(); })();
