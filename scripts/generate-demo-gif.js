import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateDemoGif() {
  const rootDir = path.resolve(__dirname, '..');
  const tempFramesDir = path.join(rootDir, 'temp_gif_frames');
  const outputGifPath = path.join(rootDir, 'docs/images/schemaforge_demo.gif');
  const publicGifPath = path.join(rootDir, 'public/schemaforge_demo.gif');

  if (fs.existsSync(tempFramesDir)) {
    fs.rmSync(tempFramesDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempFramesDir, { recursive: true });

  const imagesDir = path.join(rootDir, 'docs/images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('🚀 Launching Puppeteer for Demo GIF capture...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  let frameIndex = 0;
  const captureFrame = async (repeat = 1) => {
    for (let r = 0; r < repeat; r++) {
      const filename = path.join(tempFramesDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);
      await page.screenshot({ path: filename });
      frameIndex++;
    }
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('1. Loading SchemaForge Studio...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // Initial state: Canvas with default tables
  console.log('2. Recording initial canvas overview...');
  await captureFrame(6); // ~0.75s pause on initial state

  // Hover over a table node to highlight relationships
  const node = await page.$('.react-flow__node');
  if (node) {
    const box = await node.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await captureFrame(4);
    }
  }

  // 3. Open AI Schema Architect Modal
  console.log('3. Opening AI Architect Modal...');
  const aiBtn = await page.$('button[title*="natural language"]');
  if (aiBtn) {
    const box = await aiBtn.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await captureFrame(2);
      await aiBtn.click();
      await sleep(500);
      await captureFrame(5); // Show modal open
    }
  }

  // Select a preset architecture in AI Modal
  console.log('4. Selecting AI architecture blueprint...');
  const presetCard = await page.$('.grid > div:nth-child(1)');
  if (presetCard) {
    const pBox = await presetCard.boundingBox();
    if (pBox) {
      await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
      await captureFrame(2);
      await presetCard.click();
      await sleep(500);
      await captureFrame(6); // Show synthesized preview
    }
  }

  // Click "Replace Entire Canvas" to apply the synthesized schema
  console.log('5. Committing synthesized AI schema to canvas...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes('Replace Entire Canvas'));
    if (btn) btn.click();
  });
  await sleep(600);
  await captureFrame(6); // Show newly populated canvas

  // 6. Spotlight Search (Ctrl+K)
  console.log('6. Demonstrating Spotlight Search...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(400);
  await captureFrame(3);

  // Type search query
  await page.keyboard.type('play', { delay: 100 });
  await sleep(300);
  await captureFrame(5);

  // Press Escape to close Spotlight
  await page.keyboard.press('Escape');
  await sleep(300);
  await captureFrame(3);

  // 7. Open Mock Data Grid Modal
  console.log('7. Opening Mock Data Grid...');
  const dataGridBtn = await page.$('button[title*="mock data grid"]');
  if (dataGridBtn) {
    await dataGridBtn.click();
    await sleep(600);
    await captureFrame(6); // Show data grid modal with synthetic rows

    // Click Regenerate Seed
    const regenBtn = await page.$('button[title*="Regenerate"]');
    if (regenBtn) {
      await regenBtn.click();
      await sleep(400);
      await captureFrame(4);
    }

    // Close Data Grid Modal with Escape
    await page.keyboard.press('Escape');
    await sleep(400);
    await captureFrame(3);
  }

  // 8. Open Code View Drawer
  console.log('8. Opening Live Code Drawer & switching dialects...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Code View'));
    if (b) b.click();
  });
  await sleep(600);
  await captureFrame(6); // PostgreSQL DDL

  // Switch to Prisma tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Prisma'));
    if (b) b.click();
  });
  await sleep(400);
  await captureFrame(6); // Prisma schema

  // Switch to Drizzle tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Drizzle'));
    if (b) b.click();
  });
  await sleep(400);
  await captureFrame(6); // Drizzle schema

  // Switch to Mermaid ERD tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Mermaid'));
    if (b) b.click();
  });
  await sleep(400);
  await captureFrame(5); // Mermaid ERD

  // Close Code Drawer
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent && x.textContent.includes('Code View'));
    if (b) b.click();
  });
  await sleep(500);

  // Final Overview
  console.log('9. Capturing final canvas view...');
  await captureFrame(8); // Hold at end for clean loop

  await browser.close();
  console.log(`✓ Captured ${frameIndex} frames in ${tempFramesDir}`);

  // 10. Compile frames into optimized animated GIF with ffmpeg
  console.log('10. Compiling GIF with ffmpeg (two-pass palettegen)...');
  const inputPattern = path.join(tempFramesDir, 'frame_%04d.png');
  const ffmpegCmd = `ffmpeg -y -framerate 8 -i "${inputPattern}" -vf "scale=1000:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${outputGifPath}"`;

  execSync(ffmpegCmd, { stdio: 'inherit' });
  console.log(`✓ Animated GIF generated at: ${outputGifPath}`);

  // Copy to public directory
  fs.copyFileSync(outputGifPath, publicGifPath);
  console.log(`✓ Copied to public: ${publicGifPath}`);

  // Clean up temp frames
  fs.rmSync(tempFramesDir, { recursive: true, force: true });
  console.log('✓ Cleaned up temporary frames.');
}

generateDemoGif().catch((err) => {
  console.error('Error generating demo GIF:', err);
  process.exit(1);
});
