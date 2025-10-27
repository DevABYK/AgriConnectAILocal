import { test, expect } from '@playwright/test';

test.describe('Crop Management', () => {
  test('farmer can create, update and delete crops', async ({ page }) => {
    const apiBase = 'http://127.0.0.1:3001/api';

    // Wait for backend readiness
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

    // Login as farmer
    await page.addInitScript((f) => { localStorage.setItem('currentUser', JSON.stringify(f)); }, { arg: farmer });

    // Visit dashboard
    await page.goto('/dashboard');

    // Navigate to farmer dashboard
    await page.click('text=Farmer Dashboard');

    // Click add crop button
    await page.click('button:has-text("Add Crop")');

    // Fill crop form
    await page.fill('input[placeholder="Crop name"]', 'Test Tomato');
    await page.fill('textarea[placeholder="Describe your crop"]', 'Fresh organic tomatoes');
    await page.fill('input[placeholder="Quantity"]', '100');
    await page.fill('input[placeholder="Price per unit"]', '25');
    await page.fill('input[placeholder="Location"]', 'Test Farm');

    // Submit form
    await page.click('button:has-text("Add Crop")');

    // Verify crop appears in list
    await expect(page.locator('text=Test Tomato')).toBeVisible();

    // Edit the crop
    await page.click('button[aria-label="Edit crop"]');

    // Update crop details
    await page.fill('input[placeholder="Crop name"]', 'Updated Tomato');
    await page.fill('input[placeholder="Quantity"]', '150');
    await page.click('button:has-text("Update Crop")');

    // Verify updated crop
    await expect(page.locator('text=Updated Tomato')).toBeVisible();

    // Delete the crop
    await page.click('button[aria-label="Delete crop"]');

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify crop is removed
    await expect(page.locator('text=Updated Tomato')).not.toBeVisible();
  });

  test('buyer can search and filter crops', async ({ page }) => {
    const apiBase = 'http://127.0.0.1:3001/api';

    // Wait for backend readiness
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

    // Register a buyer
    const buyerEmail = `e2e_buyer_${Date.now()}@example.com`;
    const buyerResp = await page.request.post(`${apiBase}/auth/register`, {
      data: JSON.stringify({ email: buyerEmail, password: 'password', fullName: 'E2E Buyer', userType: 'buyer' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const buyer = await buyerResp.json();

    // Register a farmer and create crops
    const farmerEmail = `e2e_farmer_${Date.now()}@example.com`;
    const farmerResp = await page.request.post(`${apiBase}/auth/register`, {
      data: JSON.stringify({ email: farmerEmail, password: 'password', fullName: 'E2E Farmer', userType: 'farmer' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const farmer = await farmerResp.json();

    // Create multiple crops
    const crops = [
      { name: 'Tomatoes', description: 'Red tomatoes', quantity: 100, unit: 'kg', pricePerUnit: 20, location: 'Farm A' },
      { name: 'Potatoes', description: 'Fresh potatoes', quantity: 200, unit: 'kg', pricePerUnit: 15, location: 'Farm B' },
      { name: 'Carrots', description: 'Organic carrots', quantity: 150, unit: 'kg', pricePerUnit: 18, location: 'Farm A' }
    ];

    for (const crop of crops) {
      await page.request.post(`${apiBase}/crops`, {
        data: JSON.stringify({
          farmerId: farmer.id,
          ...crop,
          harvestDate: null
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Login as buyer
    await page.addInitScript((b) => { localStorage.setItem('currentUser', JSON.stringify(b)); }, { arg: buyer });

    // Visit dashboard
    await page.goto('/dashboard');

    // Search for tomatoes
    await page.fill('input[placeholder="Search crops..."]', 'tomatoes');

    // Verify only tomatoes show
    await expect(page.locator('text=Tomatoes')).toBeVisible();
    await expect(page.locator('text=Potatoes')).not.toBeVisible();
    await expect(page.locator('text=Carrots')).not.toBeVisible();

    // Clear search and filter by location
    await page.fill('input[placeholder="Search crops..."]', '');
    await page.selectOption('select[aria-label="Filter by location"]', 'Farm A');

    // Verify only Farm A crops show
    await expect(page.locator('text=Tomatoes')).toBeVisible();
    await expect(page.locator('text=Carrots')).toBeVisible();
    await expect(page.locator('text=Potatoes')).not.toBeVisible();
  });
});