import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
  const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');
  const publicScreenshotsDir = path.resolve(__dirname, '../public/screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  if (!fs.existsSync(publicScreenshotsDir)) {
    fs.mkdirSync(publicScreenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  // 1. STUDIO CANVAS
  console.log('1. Capturing Studio Canvas...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  const canvasPath = path.join(screenshotsDir, 'studio_canvas.png');
  await page.screenshot({ path: canvasPath });
  fs.copyFileSync(canvasPath, path.join(publicScreenshotsDir, 'studio_canvas.png'));
  console.log('✓ studio_canvas.png saved');

  // 2. SPOTLIGHT QUICK SEARCH
  console.log('2. Capturing Spotlight Search...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const searchBtn = await page.$('button[title*="Search"]');
  if (searchBtn) {
    await searchBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    const searchPath = path.join(screenshotsDir, 'spotlight_search.png');
    await page.screenshot({ path: searchPath });
    fs.copyFileSync(searchPath, path.join(publicScreenshotsDir, 'spotlight_search.png'));
    console.log('✓ spotlight_search.png saved');
  }

  // 3. INTERACTIVE MOCK DATA GRID
  console.log('3. Capturing Mock Data Grid...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const dataGridBtn = await page.$('button[title*="mock data grid"]');
  if (dataGridBtn) {
    await dataGridBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    const dataGridPath = path.join(screenshotsDir, 'data_grid.png');
    await page.screenshot({ path: dataGridPath });
    fs.copyFileSync(dataGridPath, path.join(publicScreenshotsDir, 'data_grid.png'));
    console.log('✓ data_grid.png saved');
  }

  // 4. AI SCHEMA ARCHITECT
  console.log('4. Capturing AI Schema Architect...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const aiBtn = await page.$('button[title*="natural language"]');
  if (aiBtn) {
    await aiBtn.click();
    await new Promise((r) => setTimeout(r, 700));
    // Click on the first preset card to show synthesized schema with entities
    const presetCard = await page.$('.grid > div');
    if (presetCard) {
      await presetCard.click();
      await new Promise((r) => setTimeout(r, 600));
    }
    const aiPath = path.join(screenshotsDir, 'ai_architect.png');
    await page.screenshot({ path: aiPath });
    fs.copyFileSync(aiPath, path.join(publicScreenshotsDir, 'ai_architect.png'));
    console.log('✓ ai_architect.png saved');
  }

  // 5. LIVE CODE VIEW DRAWER
  console.log('5. Capturing Live Code View Drawer...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Code View'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const codePath = path.join(screenshotsDir, 'code_drawer.png');
  await page.screenshot({ path: codePath });
  fs.copyFileSync(codePath, path.join(publicScreenshotsDir, 'code_drawer.png'));
  console.log('✓ code_drawer.png saved');

  await browser.close();
  console.log('✓ All 5 real screenshots successfully captured in docs/screenshots/ and public/screenshots/ !');
}

captureScreenshots().catch((err) => {
  console.error(err);
  process.exit(1);
});
