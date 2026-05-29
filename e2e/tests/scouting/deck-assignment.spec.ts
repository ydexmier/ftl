import { test, expect, loginAs, dismissTours } from '../../fixtures';

test.describe('Assignation de deck', () => {
  test('assigner Amber+Steel à Alice depuis la vue match', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/tournaments/${seed.tournament.id}?roundId=${seed.round.id}`);

    // Empêche le tour Driver.js de bloquer les interactions
    await dismissTours(page);

    // Attend l'affichage des cartes de match
    const firstCard = page.locator('[data-testid="match-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    // Ouvre le modal en cliquant sur la carte
    await firstCard.click();

    // Sélectionne Amber puis Steel pour la combinaison 1
    const combo1 = page.locator('[data-testid="ink-selection-combination1"]');
    await combo1.locator('[data-testid="ink-btn-amber"]').click();
    await combo1.locator('[data-testid="ink-btn-steel"]').click();

    // Assigne la combinaison 1 à Alice
    await page.getByRole('button', { name: /Alice/i }).first().click();

    // Valide
    await page.getByRole('button', { name: 'Valider' }).click();

    // Le modal doit se fermer et les encres d'Alice apparaître sur la carte
    await expect(page.locator('[data-testid="match-modal"]')).not.toBeVisible();
    await expect(firstCard.locator('img[alt="/svg/amber.svg"]').first()).toBeVisible({ timeout: 5_000 });
    await expect(firstCard.locator('img[alt="/svg/steel.svg"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('sans session → accès refusé au round (redirect login)', async ({ page, seed }) => {
    await page.goto(`/tournaments/${seed.tournament.id}?roundId=${seed.round.id}`);
    await expect(page).toHaveURL(/\/login/);
  });
});
