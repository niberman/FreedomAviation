import { test, expect } from '@playwright/test';

test.describe('Row-Level Security (Owner Scoping)', () => {
  test.skip('Owner A cannot view Owner B aircraft or service requests', async ({ page }) => {
    test.skip();
  });

  test.skip('Admin can view all aircraft and service requests', async ({ page }) => {
    test.skip();
  });

  test.skip('Owner can only create service requests for their own aircraft', async ({ page }) => {
    test.skip();
  });

  test.skip('Owner cannot modify another owner aircraft', async ({ page }) => {
    test.skip();
  });
});
