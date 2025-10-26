const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Scroll to featured articles
  await page.evaluate(() => {
    document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' });
  });
  
  await page.waitForTimeout(2000);
  
  // Measure gaps between cards
  const measurements = await page.evaluate(() => {
    const cards = document.querySelectorAll('article');
    const positions = [];
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      positions.push({
        index: i,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });
    });
    return positions;
  });
  
  console.log('CARD POSITIONS:', JSON.stringify(measurements, null, 2));
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
