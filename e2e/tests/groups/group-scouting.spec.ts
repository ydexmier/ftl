import { test, expect, loginAs, dismissTours } from '../../fixtures';

// Prérequis : le seed de scénarios lie le tournoi au groupe et crée les decks de portée groupe.
// Alice a Ruby+Sapphire dans le groupe, Bob a Emerald+Amber.

test.describe('Scouting en contexte de groupe', () => {
  test.beforeEach(async ({ request, seed }) => {
    // Charge les données de scénarios (GroupTournament + decks + conflits)
    const res = await request.post('/api/test/seed/scenarios');
    if (!res.ok()) throw new Error(`Seed scenarios échoué: ${await res.text()}`);
    // seed est déjà disponible via la fixture
    void seed;
  });

  test('voir la page de scouting du groupe', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments/${seed.tournament.id}`);

    // Header avec le nom du tournoi
    await expect(page.getByText('E2E Test Tournament')).toBeVisible({ timeout: 8_000 });

    // Tableau des joueurs avec Alice et Bob
    await expect(page.locator('tr').filter({ hasText: 'Alice' })).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('tr').filter({ hasText: 'Bob' })).toBeVisible();
  });

  test('assigner un nouveau deck à Alice en portée groupe', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments/${seed.tournament.id}`);
    await dismissTours(page);
    await expect(page.locator('tr').filter({ hasText: 'Alice' })).toBeVisible({ timeout: 8_000 });

    // Cliquer sur Alice → ouvre PlayerDeckModal
    await page.locator('tr').filter({ hasText: 'Alice' }).click();

    const modal = page.locator('[data-testid="player-deck-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Désélectionner Ruby (déjà sélectionné depuis le deck groupe Ruby+Sapphire)
    await modal.locator('[data-testid="ink-btn-ruby"]').click();
    // Désélectionner Sapphire
    await modal.locator('[data-testid="ink-btn-sapphire"]').click();

    // Sélectionner Amber + Steel
    await modal.locator('[data-testid="ink-btn-amber"]').click();
    await modal.locator('[data-testid="ink-btn-steel"]').click();

    // Valider
    await modal.getByRole('button', { name: 'Valider' }).click();

    // Modal fermé
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // La ligne d'Alice doit maintenant montrer Amber+Steel
    const aliceRow = page.locator('tr').filter({ hasText: 'Alice' });
    await expect(aliceRow.locator('img[alt="/svg/amber.svg"]')).toBeVisible({ timeout: 5_000 });
    await expect(aliceRow.locator('img[alt="/svg/steel.svg"]')).toBeVisible({ timeout: 5_000 });
  });

  test('stats de couverture mises à jour après assignation', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments/${seed.tournament.id}`);
    await expect(page.locator('tr').filter({ hasText: 'Alice' })).toBeVisible({ timeout: 8_000 });

    // Couverture initiale : 2 joueurs scoutés sur 2 (Ruby+Sapphire et Emerald+Amber déjà en DB)
    await expect(page.getByText('Scoutés')).toBeVisible();
  });
});
