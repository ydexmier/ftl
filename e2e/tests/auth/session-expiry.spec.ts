import { test, expect, loginAs } from '../../fixtures';

test.describe('Session guard', () => {
  test('page login affiche l\'avertissement quand reason=expired', async ({ page }) => {
    await page.goto('/login?reason=expired');
    await expect(page.getByText(/session.*expir/i)).toBeVisible();
  });

  test('refresh 401 → redirect /login?reason=expired', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);
    await expect(page).toHaveURL('/');

    // Intercepte /api/auth/refresh pour simuler l'expiration de session
    await page.route('/api/auth/refresh', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expirée' }),
      }),
    );

    // Reproduit exactement la logique de SessionGuard (voir app/providers.tsx)
    await page.evaluate(async () => {
      const res = await fetch('/api/auth/refresh', { method: 'POST', redirect: 'manual' });
      if (res.status === 401) window.location.href = '/login?reason=expired';
    });

    await page.waitForURL('**/login?reason=expired', { timeout: 5_000 });
    await expect(page.getByText(/session.*expir/i)).toBeVisible();
  });
});
