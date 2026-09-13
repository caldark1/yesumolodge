const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const messages = [];
  page.on('console', msg => messages.push({ type: 'console', text: msg.text(), location: msg.location() }));
  page.on('pageerror', err => messages.push({ type: 'pageerror', text: err.message }));

  try {
    // Seed database and ensure reception user exists
    try {
      await fetch('http://localhost:3000/api/seed', { method: 'POST' });
      console.log('Seeded DB');
    } catch (e) {
      console.warn('Seed failed (may already be seeded)', e.message || e);
    }

    // Login as reception user to access the dashboard
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@williamsyesumo.com', password: 'reception123' }),
    });
    const loginJson = await loginRes.json();
    console.log('Login response:', loginJson);
    const rawSetCookie = loginRes.headers.get('set-cookie');
    let token = null;
    if (rawSetCookie) {
      const match = rawSetCookie.match(/auth_token=([^;]+);/);
      if (match) token = match[1];
    }

    if (token) {
      await page.context().addCookies([{ name: 'auth_token', value: token, domain: 'localhost', path: '/' }]);
      console.log('Set auth_token cookie in browser context');
    } else {
      console.warn('No auth_token cookie found; dashboard may require login');
    }

    const url = 'http://localhost:3000/dashboard/reception';
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for walk-in tab button and click it
    await page.waitForSelector('button:has-text("Walk-in Booking")', { timeout: 5000 });
    await page.click('button:has-text("Walk-in Booking")');
    await page.waitForTimeout(500);

    // Wait for number of days input and set values manually (simulate typing)
    const daysSelector = 'input[name="numberOfDays"], input[aria-label="Number of Days"], input[placeholder="1"]';

    // Fallback selector used in the page
    const input = await page.$('input[type="number"][value]');

    // Try several manipulations
    const numberInput = await page.$('input[type=number]');
    if (!numberInput) {
      console.log('Number input not found');
    } else {
      // Clear and type invalid input
      await numberInput.fill('');
      await page.keyboard.type('abc');
      await page.waitForTimeout(300);
      // Replace with a large number
      await numberInput.fill('10');
      await page.waitForTimeout(300);
      // Set back to 1
      await numberInput.fill('1');
      await page.waitForTimeout(300);
    }

    // Also test changing Number of Rooms to >1
    const roomsInput = await page.$('input[name="numberOfRooms"], input[type=number]');
    if (roomsInput) {
      await roomsInput.fill('2');
      await page.waitForTimeout(300);
    }

    // capture a screenshot
    await page.screenshot({ path: 'reception-test-screenshot.png', fullPage: true });

    console.log('Collected console messages:');
    console.log(messages);
  } catch (err) {
    console.error('Test error', err);
  } finally {
    await browser.close();
  }
})();
