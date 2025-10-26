import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Wait for articles to load
  await page.waitForSelector('article', { timeout: 5000 });
  
  // Measure gaps
  const gaps = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const grid = document.querySelector('div[class*="grid"]');
    
    const gridStyles = window.getComputedStyle(grid);
    const gap = gridStyles.gap || gridStyles.gridGap;
    const rowGap = gridStyles.rowGap;
    const columnGap = gridStyles.columnGap;
    
    const measurements = articles.map((article, i) => {
      const rect = article.getBoundingClientRect();
      return {
        index: i,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    });
    
    return {
      gridGap: gap,
      rowGap: rowGap,
      columnGap: columnGap,
      cards: measurements
    };
  });
  
  console.log(JSON.stringify(gaps, null, 2));
  
  await page.waitForTimeout(10000);
  await browser.close();
})();
