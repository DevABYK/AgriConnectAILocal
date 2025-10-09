import { test, expect } from '@playwright/test';

test('add to cart and place order flow (integration)', async ({ page }) => {
  const apiBase = 'http://127.0.0.1:3001/api';

  // Wait for backend readiness by polling /api/crops
  const maxAttempts = 20;
  let ok = false;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await page.request.get(`${apiBase}/crops?page=1&limit=1`);
      if (r.ok()) { ok = true; break; }
    } catch (e) {
      // ignore and wait
    }
    await new Promise(res => setTimeout(res, 1000));
  }
  if (!ok) throw new Error('Backend not available at ' + apiBase);

  // Register a farmer
  const email = `e2e_farmer_${Date.now()}@example.com`;
  const farmerResp = await page.request.post(`${apiBase}/auth/register`, {
    data: JSON.stringify({ email, password: 'password', fullName: 'E2E Farmer', userType: 'farmer' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const farmer = await farmerResp.json();

  // Register a buyer (via API) to avoid uniqueness issues later
  const buyerEmail = `e2e_buyer_${Date.now()}@example.com`;
  const buyerResp = await page.request.post(`${apiBase}/auth/register`, {
    data: JSON.stringify({ email: buyerEmail, password: 'password', fullName: 'E2E Buyer', userType: 'buyer' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const buyer = await buyerResp.json();

  // Create a crop for the farmer
  const cropResp = await page.request.post(`${apiBase}/crops`, {
    data: JSON.stringify({
      farmerId: farmer.id,
      name: 'Integration Test Crop',
      description: 'Created by Playwright integration test',
      quantity: 5,
      unit: 'kg',
      pricePerUnit: 20,
      harvestDate: null,
      location: 'TestTown'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const crop = await cropResp.json();

  // Ensure buyer in localStorage before page load
  await page.addInitScript((b) => { localStorage.setItem('currentUser', JSON.stringify(b)); }, { arg: buyer });

  // Visit dashboard and perform UI flow
  await page.goto('/dashboard');

  // Wait for crop card to appear
  await page.waitForSelector(`text=Integration Test Crop`, { timeout: 20000 });

  // Click Add
  const addButtons = await page.$$('button:has-text("Add")');
  expect(addButtons.length).toBeGreaterThan(0);
  await addButtons[0].click();

  // Open cart and place order
  await page.click('button[aria-label="Open cart"]');
  await page.waitForSelector('button:has-text("Place Order")', { timeout: 10000 });
  const placeButtons = await page.$$('button:has-text("Place Order")');
  expect(placeButtons.length).toBeGreaterThan(0);
  await placeButtons[0].click();

  // Verify order created on backend by querying orders for this farmer
  await page.waitForSelector('text=Order placed', { timeout: 10000 });
  const ordersResp = await page.request.get(`${apiBase}/orders?farmerId=${farmer.id}`);
  const orders = await ordersResp.json();
  expect(Array.isArray(orders)).toBeTruthy();
  expect(orders.length).toBeGreaterThan(0);
});
