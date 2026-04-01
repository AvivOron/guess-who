import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, 'client/public/og-image.svg');
const outPath = resolve(__dirname, 'client/public/og-image.png');

const svg = readFileSync(svgPath, 'utf8');
const html = `<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; }
body { width: 1200px; height: 630px; overflow: hidden; }
</style>
</head>
<body>${svg}</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
  protocolTimeout: 60000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('Done:', outPath);
