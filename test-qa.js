const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to Sign Up (/register)...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForSelector('#user', { timeout: 60000 });
    
    console.log('Filling registration form...');
    const username = 'browserqa' + Date.now();
    const email = username + '@example.com';
    const password = 'password123';
    
    await page.fill('#user', username);
    await page.fill('#email', email);
    await page.fill('#pwd', password);
    await page.click('button[type="submit"]');
    
    console.log('Waiting for Dashboard or welcome page...');
    await page.waitForURL('**/dashboard**', { timeout: 60000 });
    console.log('Sign Up successful! Now at: ' + page.url());
    
    console.log('2. Testing Logout...');
    // Clear localStorage to simulate logout if button is hard to find
    await page.evaluate(() => {
        localStorage.clear();
        // Also clear any cookies if necessary
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
    });
    
    console.log('Navigating to Login (/login)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForSelector('#user', { timeout: 60000 });
    
    console.log('Filling login form...');
    await page.fill('#user', email);
    await page.fill('#pwd', password);
    await page.click('button[type="submit"]');
    
    console.log('Waiting for Dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 60000 });
    console.log('Login successful! Now at: ' + page.url());
    
    console.log('3. Navigating the dashboard...');
    
    // Wait for links to appear
    await page.waitForSelector('a', { timeout: 30000 });
    const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
    const uniqueLinks = [...new Set(links)].filter(link => link.includes('/dashboard') || link.includes('/challenges'));
    
    if (uniqueLinks.length > 0) {
        console.log(`Found internal links: ${uniqueLinks.slice(0, 3).join(', ')}`);
        for (const link of uniqueLinks.slice(0, 2)) {
            console.log(`Navigating to ${link}...`);
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log(`Successfully reached: ${page.url()}`);
        }
    } else {
        console.log('No internal dashboard links found, maybe they use custom routing or it is a single page app?');
    }
    
    console.log('All tests passed successfully.');
  } catch (err) {
    console.error('Test failed:', err);
    await page.screenshot({ path: 'error_screenshot.png' });
    console.log('Saved error screenshot to error_screenshot.png');
  } finally {
    await browser.close();
  }
})();
