import { test, expect, loginAs } from '../../fixtures';

// Ce test vérifie le parcours d'ajout d'un tournoi à un groupe.
// Le seed de BASE est utilisé (pas de GroupTournament) — le tournoi n'est pas encore lié au groupe.

test.describe('Ajout d\'un tournoi à un groupe', () => {
  test('page vide → ouvrir le modal → ajouter le tournoi → il apparaît dans la liste', async ({ page, seed }) => {
    await loginAs(page, seed.admin.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);

    // État initial : aucun tournoi dans ce groupe
    await expect(page.getByText('Aucun tournoi dans ce groupe')).toBeVisible({ timeout: 8_000 });

    // Bouton "Ajouter" visible (admin uniquement)
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // Modal d'ajout
    await expect(page.getByText('Ajouter un tournoi')).toBeVisible();

    // Le tournoi E2E Test Tournament doit apparaître dans la liste
    const tournamentItem = page.locator('li').filter({ hasText: 'E2E Test Tournament' });
    await expect(tournamentItem).toBeVisible({ timeout: 8_000 });

    // Cliquer sur "Ajouter" dans la ligne du tournoi
    await tournamentItem.getByRole('button', { name: 'Ajouter' }).click();

    // Modal fermé, tournoi présent dans la liste de la page
    await expect(page.getByText('Ajouter un tournoi')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('a').filter({ hasText: 'E2E Test Tournament' })).toBeVisible({ timeout: 5_000 });
  });

  test('membre (non-admin) ne voit pas le bouton Ajouter', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);

    await expect(page.getByText('Aucun tournoi dans ce groupe')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Ajouter' })).not.toBeVisible();
  });
});
