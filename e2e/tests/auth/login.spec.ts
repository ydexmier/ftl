import { test, expect, loginAs } from '../../fixtures';

test.describe('Authentification', () => {
  test('login valide → redirect vers /', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);
    await expect(page).toHaveURL('/');
  });

  test('admin login → redirect vers /admin/dashboard', async ({ page, seed }) => {
    await loginAs(page, seed.admin.username, seed.password);
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('mauvais mot de passe → message d\'erreur, reste sur /login', async ({ page, seed }) => {
    await page.goto('/login');
    await page.getByLabel('Identifiant').fill(seed.player.username);
    await page.getByLabel('Mot de passe').fill('MauvaisMotDePasse1!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('accès page protégée sans session → redirect /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
