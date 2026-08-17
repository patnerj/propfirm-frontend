const { chromium } = require('playwright');
const path = require('path');
const artifactPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\51d1962f-9c03-4a0b-b434-cbbabfc2004d\\theme_page.png';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login first to get admin session
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000); // wait for login to complete

  await page.goto('http://localhost:3000/dashboard/admin/theme');
  await page.waitForTimeout(2000); // wait for data to load
  
  await page.screenshot({ path: artifactPath, fullPage: true });
  await browser.close();
  console.log("Screenshot saved to " + artifactPath);
})();
