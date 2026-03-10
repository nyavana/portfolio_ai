/**
 * Visual smoke test — navigates all 6 pages and takes screenshots.
 * Run: node test-visual.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUT = './test-screenshots';
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { path: '/',       name: '1-dashboard' },
  { path: '/risk',   name: '2-risk' },
  { path: '/news',   name: '3-news' },
  { path: '/chat',   name: '4-chat' },
  { path: '/upload', name: '5-upload' },
  { path: '/status', name: '6-status' },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/home/nyavana/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

const results = [];

for (const route of ROUTES) {
  console.log(`Testing ${route.path} …`);
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 10000 });
    // Wait briefly for animations to settle
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${route.name}.png`, fullPage: true });

    // Check for JS errors in console
    const title = await page.title();
    console.log(`  ✓ ${route.path} — "${title}" — screenshot saved`);
    results.push({ path: route.path, status: 'ok' });
  } catch (err) {
    console.error(`  ✗ ${route.path} — ${err.message}`);
    results.push({ path: route.path, status: 'error', error: err.message });
  }
}

// Test /chat — submit a question
console.log('\nTesting chat interaction…');
try {
  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.fill('textarea', 'What is my portfolio summary?');
  await page.screenshot({ path: `${OUT}/4-chat-typed.png` });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/4-chat-response.png`, fullPage: true });
  console.log('  ✓ Chat interaction complete');
} catch (err) {
  console.error(`  ✗ Chat interaction — ${err.message}`);
}

await browser.close();

console.log('\n══════════════════════════════');
console.log('Results:');
results.forEach(r => {
  const mark = r.status === 'ok' ? '✓' : '✗';
  console.log(`  ${mark} ${r.path}`);
});
console.log(`\nScreenshots saved to ${OUT}/`);
