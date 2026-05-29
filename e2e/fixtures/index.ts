import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type SeedData = {
  password: string;
  player: { id: string; username: string };
  admin: { id: string; username: string };
  tournament: { id: number };
  round: { id: number };
  matchId: number;
  group: { id: string };
  guestToken: string;
  guestAccessId: string;
};

type Fixtures = {
  seed: SeedData;
};

export const test = base.extend<Fixtures>({
  seed: async ({ request }, use) => {
    const res = await request.post('/api/test/seed');
    if (!res.ok()) throw new Error(`Seed échoué (${res.status()}): ${await res.text()}`);
    await use((await res.json()) as SeedData);
  },
});

export { expect };

/** Marque les tours Driver.js comme déjà vus pour éviter qu'ils bloquent les interactions. */
export async function dismissTours(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('ftl_tournament_tour_done', '1');
    localStorage.setItem('ftl_tournaments_tour_done', '1');
  });
}

/** Login via le formulaire et attend la redirection. */
export async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Identifiant').fill(username);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  // Attend la sortie de /login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
}
