import { test, expect, dismissTours, loginAsGuest } from '../../fixtures';

test.describe('Accès invité (magic link)', () => {
  test('inscription via magic link → redirect vers /guest/pending', async ({ page, seed }) => {
    await page.goto(`/guest/${seed.guestMagicLinkToken}`);
    await expect(page.getByLabel('Pseudo')).toBeVisible();

    await page.getByLabel('Pseudo').fill('scout42test');
    await page.getByLabel('Email').fill('scout42test@test.local');
    await page.getByLabel('Mot de passe').fill('Scout42Password!');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await page.waitForURL('/guest/pending', { timeout: 10_000 });
    await expect(page).toHaveURL('/guest/pending');
  });

  test('invité pré-approuvé peut voir les matchs du tournoi', async ({ page, seed }) => {
    await loginAsGuest(page, seed);

    await page.goto(
      `/tournaments/${seed.tournament.id}?roundId=${seed.round.id}&groupId=${seed.group.id}`,
    );
    await dismissTours(page);

    await expect(page.locator('[data-testid="match-card"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('invité pré-approuvé assigne une bicolorité dans la ronde du groupe', async ({ page, seed }) => {
    await loginAsGuest(page, seed);

    await page.goto(
      `/tournaments/${seed.tournament.id}?roundId=${seed.round.id}&groupId=${seed.group.id}`,
    );
    await dismissTours(page);

    const firstCard = page.locator('[data-testid="match-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    await firstCard.click();

    const combo1 = page.locator('[data-testid="ink-selection-combination1"]');
    await combo1.locator('[data-testid="ink-btn-amber"]').click();
    await combo1.locator('[data-testid="ink-btn-steel"]').click();

    await page.getByRole('button', { name: /Alice/i }).first().click();

    await page.getByRole('button', { name: 'Valider' }).click();

    await expect(page.locator('[data-testid="match-modal"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(firstCard.locator('img[alt="/svg/amber.svg"]').first()).toBeVisible({ timeout: 5_000 });
    await expect(firstCard.locator('img[alt="/svg/steel.svg"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('token invalide → message d\'erreur sur la page invité', async ({ page }) => {
    await page.goto('/guest/token-invalide-000');
    await expect(page.getByLabel('Pseudo')).toBeVisible();

    await page.getByLabel('Pseudo').fill('testuser');
    await page.getByLabel('Email').fill('testuser@test.local');
    await page.getByLabel('Mot de passe').fill('TestPassword1!');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await expect(page.getByText(/invalide|expir/i)).toBeVisible({ timeout: 5_000 });
  });
});
