import { test, expect } from '@playwright/test';

test('add to cart and place order flow', async ({ page }) => {
  // Mock backend API responses so the test doesn't need a running server
  const crop = {
    id: 'pwcrop-1',
    farmer_id: 'pwfarmer-1',
    name: 'Playwright Test Crop',
    description: 'Test crop created by E2E',
    quantity: 10,
    unit: 'kg',
    price_per_unit: 50,
    harvest_date: null,
    location: 'Testville',
    image_url: null,
    status: 'available',
    farmer_name: 'Test Farmer'
  };

  await page.route('**/api/crops**', async route => {
    // Return a paginated response as the frontend expects
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ crops: [crop], total: 1 })
    });
  });

  await page.route('**/api/orders**', async route => {
    if (route.request().method().toLowerCase() === 'post') {
      const body = JSON.parse(await route.request().postData() || '{}');
      // Return a created order payload
      const created = (body.items || []).map((it: any, i: number) => ({
        id: `order-${i}`,
        crop_id: it.crop_id,
        buyer_id: body.buyer_id || 'test-buyer',
        quantity: it.quantity,
        total_price: it.quantity * (crop.price_per_unit || 0),
        buyer_contact: body.buyer_contact || '',
        status: 'pending'
      }));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ created }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  // Ensure a test buyer exists in localStorage so place-order can work in the UI
  // Use addInitScript so localStorage is set before the page scripts run
  await page.addInitScript(() => {
    try {
      localStorage.setItem('currentUser', JSON.stringify({ id: 'test-buyer', email: 'testbuyer@example.com', phone: '' }));
    } catch (e) {
      // ignore
    }
  });

  // Go directly to the buyer dashboard where crop cards are listed
  await page.goto('/dashboard');

  // Wait for our mocked crop to render and click the Add button
  await page.waitForSelector('text=Playwright Test Crop', { timeout: 10000 });
  const addButtons = await page.$$('button:has-text("Add")');
  expect(addButtons.length).toBeGreaterThan(0);
  await addButtons[0].click();

  // Open cart via the header button
  await page.click('button[aria-label="Open cart"]');

  // Wait for Place Order button and click it
  await page.waitForSelector('button:has-text("Place Order")', { timeout: 10000 });
  const placeButtons = await page.$$('button:has-text("Place Order")');
  expect(placeButtons.length).toBeGreaterThan(0);

  await placeButtons[0].click();

  // Expect at least one toast indicating success
  await page.waitForSelector('text=Order placed', { timeout: 10000 });
  const toastCount = await page.locator('text=Order placed').count();
  expect(toastCount).toBeGreaterThan(0);
});
