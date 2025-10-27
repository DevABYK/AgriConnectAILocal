import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login successfully', async ({ page }) => {
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

    // Generate unique email
    const email = `e2e_test_${Date.now()}@example.com`;

    // Visit the app
    await page.goto('/');

    // Navigate to auth page
    await page.click('text=Login');

    // Switch to register tab
    await page.click('text=Register');

    // Fill registration form
    await page.fill('input[placeholder="Enter your full name"]', 'E2E Test User');
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.click('text=Farmer'); // Select farmer user type
    await page.fill('input[placeholder="Create a password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');

    // Submit registration
    await page.click('button:has-text("Create Account")');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');

    // Should redirect to home
    await page.waitForURL('**/', { timeout: 5000 });

    // Now test login
    await page.click('text=Login');

    // Fill login form
    await page.fill('input[placeholder="Enter your email"]', email);
    await page.fill('input[placeholder="Enter your password"]', 'password123');

    // Submit login
    await page.click('button:has-text("Login")');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    // Visit the app
    await page.goto('/');

    // Navigate to auth page
    await page.click('text=Login');

    // Fill login form with invalid credentials
    await page.fill('input[placeholder="Enter your email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');

    // Submit login
    await page.click('button:has-text("Login")');

    // Should show error message
    await expect(page.locator('text=Login failed')).toBeVisible();

    // Should stay on login page
    await expect(page.url()).toContain('/auth');
  });

  test('registration fails with existing email', async ({ page }) => {
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

    // Visit the app
    await page.goto('/');

    // Navigate to auth page
    await page.click('text=Login');

    // Switch to register tab
    await page.click('text=Register');

    // Fill registration form with existing email (assuming admin@example.com exists)
    await page.fill('input[placeholder="Enter your full name"]', 'Test User');
    await page.fill('input[placeholder="Enter your email"]', 'admin@example.com');
    await page.click('text=Farmer');
    await page.fill('input[placeholder="Create a password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');

    // Submit registration
    await page.click('button:has-text("Create Account")');

    // Should show error message
    await expect(page.locator('text=Registration failed')).toBeVisible();

    // Should stay on register page
    await expect(page.locator('text=Register')).toBeVisible();
  });
});