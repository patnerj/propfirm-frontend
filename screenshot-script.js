const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/admin/settings');
  
  // Set light theme
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  
  await page.waitForTimeout(1000);
  
  // Open dropdown menu
  await page.click('button:has(svg.lucide-user)');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'light_mode_fixed.png' });
  await browser.close();
})();
