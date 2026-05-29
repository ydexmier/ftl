import { test, expect, loginAs } from '../../fixtures';

// Données créées par le seed de scénarios :
//   - Conflit PENDING (Alice) : Ruby+Sapphire (groupe) vs Amber+Steel (utilisateur)
//   - Conflit PENDING_ADMIN (Bob) : Emerald+Amber (groupe) vs Steel+Ruby (utilisateur)

test.describe('Gestion des conflits de bicolorité', () => {
  test.beforeEach(async ({ request, seed }) => {
    const res = await request.post('/api/test/seed/scenarios');
    if (!res.ok()) throw new Error(`Seed scenarios échoué: ${await res.text()}`);
    void seed;
  });

  // ────────────────────────────────────────────────────────────────────
  // Parcours utilisateur : voir son conflit et proposer à l'admin
  // ────────────────────────────────────────────────────────────────────

  test('utilisateur voit le modal de conflits sur la page tournoi', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    // Le ConflictResolutionModal s'ouvre automatiquement si des conflits PENDING existent
    await page.goto(`/tournaments/${seed.tournament.id}`);

    const modal = page.locator('[data-testid="conflict-resolution-modal"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/Conflits d.encres/)).toBeVisible();
    await expect(modal.getByText('Alice')).toBeVisible();
  });

  test('utilisateur propose son deck à l\'admin → conflit escaladé', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);
    await page.goto(`/tournaments/${seed.tournament.id}`);

    const modal = page.locator('[data-testid="conflict-resolution-modal"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Alice : version du groupe = Ruby+Sapphire, ma version = Amber+Steel
    await expect(modal.getByText('Version du groupe')).toBeVisible();
    await expect(modal.getByText('Ma version')).toBeVisible();

    // Proposer à l'admin → escalade le conflit (PENDING → PENDING_ADMIN)
    await modal.getByRole('button', { name: "Proposer à l'admin" }).click();

    // Le conflit d'Alice disparaît du modal (plus de conflits PENDING → modal se ferme)
    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });

  test('utilisateur marque un conflit comme incertitude', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);
    await page.goto(`/tournaments/${seed.tournament.id}`);

    const modal = page.locator('[data-testid="conflict-resolution-modal"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Marquer comme incertitude
    await modal.getByRole('button', { name: 'Incertitude' }).click();

    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });

  // ────────────────────────────────────────────────────────────────────
  // Parcours admin : voir et résoudre les propositions
  // ────────────────────────────────────────────────────────────────────

  test('admin voit le badge "1 proposition" sur le tournoi', async ({ page, seed }) => {
    await loginAs(page, seed.admin.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);

    // Badge jaune "1 proposition" (conflit Bob en PENDING_ADMIN)
    await expect(page.getByText(/1 proposition/)).toBeVisible({ timeout: 8_000 });
  });

  test('admin approuve une proposition → badge disparaît', async ({ page, seed }) => {
    await loginAs(page, seed.admin.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);

    // Clic sur le badge jaune
    await page.getByText(/1 proposition/).click();

    // Modal AdminConflictModal
    await expect(page.getByText('Propositions en attente')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText(/Proposé par e2e_player/)).toBeVisible();

    // Approuver
    await page.getByRole('button', { name: 'Approuver' }).click();

    // Modal se ferme (plus de conflit)
    await expect(page.getByText('Propositions en attente')).not.toBeVisible({ timeout: 5_000 });

    // Badge "proposition" disparaît de la liste
    await expect(page.getByText(/1 proposition/)).not.toBeVisible({ timeout: 3_000 });
  });

  test('admin rejette une proposition → badge disparaît', async ({ page, seed }) => {
    await loginAs(page, seed.admin.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);
    await page.getByText(/1 proposition/).click();

    await expect(page.getByText('Propositions en attente')).toBeVisible({ timeout: 5_000 });

    // Rejeter
    await page.getByRole('button', { name: 'Rejeter' }).click();

    await expect(page.getByText('Propositions en attente')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/1 proposition/)).not.toBeVisible({ timeout: 3_000 });
  });

  // ────────────────────────────────────────────────────────────────────
  // Parcours fusion : "Fusionner mes données" → génération de conflit
  // ────────────────────────────────────────────────────────────────────

  test('badge "Fusionner mes données" visible quand l\'utilisateur a des données perso non fusionnées', async ({ page, seed }) => {
    await loginAs(page, seed.player.username, seed.password);

    await page.goto(`/groups/${seed.group.id}/tournaments`);

    // Le seed utilisateur a Alice avec Amber+Steel (différent du groupe Ruby+Sapphire)
    // → merge-status doit retourner hasPendingPersonalData=true
    await expect(page.getByText('Fusionner mes données')).toBeVisible({ timeout: 10_000 });
  });
});
