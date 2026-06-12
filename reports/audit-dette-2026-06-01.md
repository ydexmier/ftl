# Audit de dette technique — 2026-06-01

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-06-01

---

## Résumé exécutif

Comparé à l'audit du 2026-05-25, **tous les problèmes prioritaires ont été corrigés** : `getAdminSession` supprimé et remplacé par `requireAdminSession` dans toutes les routes admin, `connectToMongoDB()` redondant retiré des routes `fetchRound`/`fetchTournament`, `StatsTab.tsx` refactorisé de 433 → 108 lignes avec extraction des builders ECharts et du hook `useTournamentStats`, tests pour `/api/tournaments/[id]/stats` ajoutés.

**Trois nouvelles régressions de sécurité** sont identifiées cette semaine, introduites par les features `feat(api-externe-tokens)` et `feat(guest-access)` : `DELETE /api/tournaments/[id]` et `POST /api/rounds/[roundId]/matchs/[matchId]` n'ont aucune vérification d'identité dans le handler — un invité (guest_session) peut supprimer n'importe quel tournoi ou écraser des données de ronde. `POST /api/tournaments` est également sans garde. Le pattern `connectToMongoDB()` direct, corrigé en `fix(sec-01)`, a été réintroduit dans 5 nouvelles routes.

Par ailleurs, les nouvelles features ont grossi 4 composants au-delà des 300 lignes (TournamentsPageClient 365, Tournament 363, GroupTournamentScoutingPage 334, PlayersTab 321).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité | 🔴 Critique | `app/api/tournaments/[id]/route.ts` | 🆕 Nouveau |
| 2 | Sécurité | 🔴 Critique | `app/api/rounds/[roundId]/matchs/[matchId]/route.ts` | 🆕 Nouveau |
| 3 | Sécurité | 🟠 Important | `app/api/tournaments/route.ts` | 🆕 Nouveau |
| 4 | Architecture | 🟠 Important | 5 nouvelles routes (external, api-tokens, guest/validate) | 🆕 Nouveau |
| 5 | God component | 🟡 Mineur | `TournamentsPageClient.tsx` (365 l.), `GroupTournamentScoutingPage.tsx` (334 l.), `PlayersTab.tsx` (321 l.) | 🆕 Nouveau |
| 6 | God component | 🟡 Mineur | `Tournament.tsx` (363 l., 8 fetch directs) | 🔁 Aggravé (+1 fetch) |
| 7 | Tests | 🟡 Mineur | `POST /api/rounds/[roundId]/matchs/[matchId]` — non testé | 🆕 Nouveau |
| 8 | Redondance | 🟡 Mineur | Validation `name` dupliquée dans 2 routes api-tokens | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `PlayerCommentHistory.tsx` (314 l.) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-05-25

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | `getAdminSession` → `requireAdminSession` unifiée (ARCH-01 🟠) | ✅ Corrigé — `refacto(auth)` PR #142 |
| B | `connectToMongoDB()` redondant dans `fetchRound/route.ts` et `fetchTournament/route.ts` (ARCH-02 🟡) | ✅ Corrigé — `fix(sec)` PR #141 |
| C | `StatsTab.tsx` 433 lignes → 108 lignes, builders extraits (COMP-01 🟡) | ✅ Corrigé — `refacto(stats)` PR #144 |
| D | Tests manquants pour `GET /api/tournaments/[id]/stats` (TEST-01 🟡) | ✅ Corrigé — `test(stats)` PR #143 |

---

## 1. Sécurité

### 1.1 `DELETE /api/tournaments/[id]` — suppression sans vérification d'identité (CRITIQUE)

**Fichier :** `app/api/tournaments/[id]/route.ts` (lignes 14–27)

```typescript
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await TournamentRepository.deleteById(Number(id));
    if (!deleted) return ApiResponse.notFound('Tournament not found');
    return ApiResponse.ok({ message: 'Tournament deleted' });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
```

**Problème :** Le handler ne fait aucun appel à `getAuthSession()`. Combiné à deux vecteurs d'accès :

1. **Tout utilisateur connecté** peut supprimer n'importe quel tournoi, sans vérification de rôle ni d'appartenance.
2. **Tout invité** (cookie `guest_session` valide) peut atteindre cette route car le middleware autorise `GUEST_ALLOWED_API_PREFIXES = ['/api/tournaments/']` pour **tous** les sous-chemins `/api/tournaments/*`, sans restriction de méthode HTTP.

Le test existant confirme le bug : `makeRequest('DELETE', '/api/tournaments/...')` sans cookie retourne HTTP 200.

Aucun audit log n'est émis lors de la suppression.

**Correction :**
```typescript
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();
  // Option A : admin uniquement
  if (session.role !== 'ADMIN' && session.role !== 'SUPERUSER') return ApiResponse.forbidden();
  // Option B : propriétaire du tournoi (vérifier UserTournament)
  
  await AuditLogRepository.create({
    action: 'TOURNAMENT_DELETE',
    userId: session.userId,
    username: '',
    ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
    metadata: { tournamentId: Number((await params).id) },
  });
  
  const { id } = await params;
  const deleted = await TournamentRepository.deleteById(Number(id));
  if (!deleted) return ApiResponse.notFound('Tournament not found');
  return ApiResponse.ok({ message: 'Tournament deleted' });
}
```

---

### 1.2 `POST /api/rounds/[roundId]/matchs/[matchId]` — upsert de ronde sans auth (CRITIQUE)

**Fichier :** `app/api/rounds/[roundId]/matchs/[matchId]/route.ts` (lignes 16–25)

```typescript
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { roundId } = await params;
    const body = await request.json();
    const round = await RoundRepository.upsert({ id: Number(roundId), ...body });
    return ApiResponse.ok(round);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
```

**Problèmes :**

1. **Aucune auth** : tout utilisateur connecté ou invité (le middleware autorise `/api/rounds/` aux guests) peut upsert des données de ronde arbitraires.
2. **Aucune validation du body** : `RoundRepository.upsert({ id, ...body })` accepte n'importe quelle structure JSON.
3. **Route non documentée dans CLAUDE.md** : la documentation indique `GET/PUT` pour `matchs/[matchId]`, or l'implémentation expose `GET/POST`. Cette route POST semble vestigiale (aucune utilisation trouvée dans les composants ou hooks frontend).

**Correction recommandée :** Supprimer cette méthode POST si elle est vestigiale. Si elle doit être conservée, la protéger a minima avec `requireAdminSession`.

---

### 1.3 `POST /api/tournaments` — upsert de tournoi sans auth (IMPORTANT)

**Fichier :** `app/api/tournaments/route.ts` (lignes 12–19)

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tournament = await TournamentRepository.upsert(body);
    return ApiResponse.ok(tournament);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
```

**Problème :** Tout utilisateur connecté peut injecter ou écraser des données de tournoi arbitraires sans vérification d'identité, sans validation du body, et sans audit log. La route `POST /api/tournaments/fetch` (qui passe par `TournamentService.fetchAndSave` avec auth) est la voie canonique ; cette route POST directe est probablement vestigiale.

**Correction :** Supprimer la méthode POST si vestigiale, ou la protéger avec `requireAdminSession` et validation du body.

---

## 2. Architecture

### 2.1 `connectToMongoDB()` direct dans 5 nouvelles routes (IMPORTANT)

Ce pattern a été corrigé dans `fix(sec-01)` pour `fetchRound/route.ts` et `fetchTournament/route.ts`, mais il a été réintroduit par les nouvelles features.

**Routes concernées :**

| Fichier | Ligne(s) |
|---------|----------|
| `app/api/external/tournaments/[id]/players/route.ts` | 19 |
| `app/api/groups/[id]/tournaments/[tid]/api-tokens/route.ts` | 18, 42 |
| `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 18 |
| `app/api/guest/validate/route.ts` | 18 |

**Problème :** Chaque appel `await connectToMongoDB()` est redondant puisque les repositories (`ApiTokenRepository`, `GroupRepository`, `TournamentExternalAccessRepository`) appellent déjà `connectToMongoDB()` en interne. Cela crée un couplage inutile entre les routes et l'implémentation interne des repositories.

**Correction :** Supprimer les imports `import connectToMongoDB from '@/src/lib/db'` et les appels `await connectToMongoDB()` dans ces 5 routes. La connexion est assurée par les repositories appelés ensuite.

---

## 3. God components

### 3.1 Quatre composants > 300 lignes (MINEUR)

| Composant | Lignes | Observations |
|-----------|--------|--------------|
| `TournamentsPageClient.tsx` | 365 | Principalement rendering, logique d'état locale légère — acceptable mais proche du seuil |
| `Tournament.tsx` | 363 | **8 `fetch()` directs** dans `useEffect` — persistant, s'aggrave |
| `GroupTournamentScoutingPage.tsx` | 334 | 2 `fetch()` directs, pagination + stats + décks inline |
| `PlayersTab.tsx` | 321 | 2 `fetch()` directs, pagination + registrations inline |
| `PlayerCommentHistory.tsx` | 314 | Stable depuis 2 audits |

**`Tournament.tsx` — 8 fetch directs (aggravé)**

Ce composant cumule 8 appels `fetch()` directs dans des `useEffect` séparés : `last-round`, `auth/me`, `my-role`, `merge-status`, `conflicts` (user), `conflicts` (groupe), `uncertainties`, et un nouveau `merge` (POST). Chaque nouvelle feature tend à en ajouter un. Un hook `useTournamentContext(tournamentId, groupId)` centraliserait cette logique et faciliterait les tests, comme a été fait pour `StatsTab.tsx` avec `useTournamentStats`.

**`GroupTournamentScoutingPage.tsx` et `PlayersTab.tsx`** — même pattern que `Tournament.tsx` mais à plus petite échelle. Ces composants ont le même besoin de hooks dédiés (`useGroupScoutingPage`, `usePlayersTab`) pour externaliser la logique de fetch et de pagination.

---

## 4. Tests

### 4.1 `POST /api/rounds/[roundId]/matchs/[matchId]` — route non testée (MINEUR)

**Fichier :** `app/api/rounds/[roundId]/matchs/[matchId]/route.ts`

La méthode POST de cette route n'a aucun test. Les tests existants dans `rounds.test.ts` couvrent uniquement le `GET` (matchs/[matchId]) et le `POST /assign_deck`. Si la route POST doit être conservée, elle devrait avoir au minimum un test vérifiant l'absence d'auth (qui est le bug à corriger).

---

## 5. Redondances

### 5.1 Validation inline identique pour le nom des tokens API (MINEUR)

**Fichiers :**
- `app/api/user/tournaments/[id]/api-tokens/route.ts:37`
- `app/api/groups/[id]/tournaments/[tid]/api-tokens/route.ts:49`

```typescript
// Répété à l'identique dans les deux fichiers
const name = typeof body?.name === 'string' ? body.name.trim() : '';
if (!name || name.length > 100) return ApiResponse.badRequest('Nom requis (max 100 caractères)');
```

**Correction :** Extraire dans `src/lib/validation.ts` :
```typescript
export function validateApiTokenName(body: unknown): ValidationResult<{ name: string }> {
  const name = typeof (body as Record<string,unknown>)?.name === 'string'
    ? ((body as Record<string,unknown>).name as string).trim()
    : '';
  if (!name) return err('Nom requis');
  if (name.length > 100) return err('Nom requis (max 100 caractères)');
  return ok({ name });
}
```

---

## 6. Patterns persistants acceptés

### 6.1 `PlayerCommentHistory.tsx` (314 lignes)

Stable depuis 3 audits. À surveiller si de nouvelles fonctionnalités de commentaires sont ajoutées.

### 6.2 `Tournament.tsx` — fetch directs dans useEffect

Connu depuis 3 audits. S'est aggravé de 7 à 8 fetch cette semaine avec l'ajout du flux merge. Non prioritaire pour l'instant mais à prendre en compte lors de la prochaine refonte de la page tournoi.

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger immédiatement (sprint courant)

1. **Protéger `DELETE /api/tournaments/[id]`** avec `getAuthSession()` + vérification de rôle + audit log.
2. **Supprimer ou protéger `POST /api/rounds/[roundId]/matchs/[matchId]`** — route vestigiale sans auth accessible aux guests.

### 🟠 Important — À planifier dans le prochain sprint

3. **Protéger ou supprimer `POST /api/tournaments`** — upsert direct sans auth ni validation.
4. **Supprimer les `connectToMongoDB()` redondants** dans les 5 nouvelles routes.

### 🟡 Mineur — Opportunités d'amélioration continue

5. Extraire la validation `validateApiTokenName` dans `validation.ts`.
6. Créer un hook `useTournamentContext` pour centraliser les 8 fetch de `Tournament.tsx`.
7. Surveiller la croissance de `PlayersTab.tsx` et `GroupTournamentScoutingPage.tsx`.
