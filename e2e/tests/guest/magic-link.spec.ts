import { test, expect, dismissTours } from '../../fixtures';

test.describe('Accès invité (magic link)', () => {
  test('valider le magic link → redirect vers le tournoi', async ({ page, seed }) => {
    await page.goto(`/guest/${seed.guestToken}`);
    await expect(page.getByLabel('Prénom ou pseudo')).toBeVisible();

    await page.getByLabel('Prénom ou pseudo').fill('Scout42');
    await page.getByRole('button', { name: 'Accéder au tournoi' }).click();

    await page.waitForURL(
      (url) => url.pathname.startsWith(`/tournaments/${seed.tournament.id}`),
      { timeout: 10_000 },
    );
    await expect(page).toHaveURL(new RegExp(`/tournaments/${seed.tournament.id}`));
  });

  test('invité peut voir les matchs du tournoi', async ({ page, seed }) => {
    // Validation du magic link
    await page.goto(`/guest/${seed.guestToken}`);
    await page.getByLabel('Prénom ou pseudo').fill('Scout42');
    await page.getByRole('button', { name: 'Accéder au tournoi' }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith(`/tournaments/${seed.tournament.id}`),
      { timeout: 10_000 },
    );

    // Navigation vers la ronde
    await page.goto(
      `/tournaments/${seed.tournament.id}?roundId=${seed.round.id}&groupId=${seed.group.id}&guest=1`,
    );

    await expect(page.locator('[data-testid="match-card"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('invité assigne une bicolorité dans la ronde du groupe', async ({ page, seed }) => {
    // Validation du magic link → pose le cookie guest_session
    await page.goto(`/guest/${seed.guestToken}`);
    await page.getByLabel('Prénom ou pseudo').fill('Scout42');
    await page.getByRole('button', { name: 'Accéder au tournoi' }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith(`/tournaments/${seed.tournament.id}`),
      { timeout: 10_000 },
    );

    // Navigation vers la ronde en portée groupe (groupId transmis via query param)
    await page.goto(
      `/tournaments/${seed.tournament.id}?roundId=${seed.round.id}&groupId=${seed.group.id}&guest=1`,
    );

    // Empêche le tour Driver.js de bloquer les interactions
    await dismissTours(page);

    const firstCard = page.locator('[data-testid="match-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    // Ouvrir le modal et sélectionner Amber + Steel pour la combinaison 1
    await firstCard.click();

    const combo1 = page.locator('[data-testid="ink-selection-combination1"]');
    await combo1.locator('[data-testid="ink-btn-amber"]').click();
    await combo1.locator('[data-testid="ink-btn-steel"]').click();

    // Assigner la combinaison 1 à Alice
    await page.getByRole('button', { name: /Alice/i }).first().click();

    // Valider → POST /api/rounds/[rid]/matchs/[mid]/assign_deck avec guest_session
    await page.getByRole('button', { name: 'Valider' }).click();

    // Modal fermé, encres visibles sur la carte (sauvegardées en portée groupe)
    await expect(page.locator('[data-testid="match-modal"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(firstCard.locator('img[alt="/svg/amber.svg"]').first()).toBeVisible({ timeout: 5_000 });
    await expect(firstCard.locator('img[alt="/svg/steel.svg"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('token invalide → message d\'erreur sur la page invité', async ({ page }) => {
    await page.goto('/guest/token-invalide-000');
    // La page s'affiche mais la soumission renvoie une erreur
    await page.getByLabel('Prénom ou pseudo').fill('Test');
    await page.getByRole('button', { name: 'Accéder au tournoi' }).click();
    await expect(page.getByText(/invalide|expir/i)).toBeVisible({ timeout: 5_000 });
  });
});
