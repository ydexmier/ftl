# Audit de dette technique — 2026-07-13

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-07-13

---

## Résumé exécutif

L'audit du 2026-06-08 avait identifié un problème critique (rate limiting manquant sur `/api/guest/validate`) et 5 problèmes mineurs. **Tous ont été corrigés** entre le 8 juin et aujourd'hui, avec 6 corrections supplémentaires au passage (routes POST vestigiales sans auth, `DELETE /api/tournaments/[id]` non protégé).

La session courante a intégré **4 nouvelles features** (player history, deck quick-confirm, filtre multi-sélection scouting, bandeau groupe sur tournoi). Elles sont globalement propres, mais révèlent **deux nouveaux problèmes d'architecture** : des fonctions helpers de domaine (`buildResult`, `buildScores`) définies directement dans un route handler, et des règles de domaine (`deduplicateDecks`, `countConflictsByTournament`) appelées dans des composants React.

**Un nouveau problème de sécurité** est identifié : `validateRegisterBody` ne valide ni le jeu de caractères du pseudo (contrairement au flux guest qui impose `^[a-z0-9_-]+$`) ni la casse (contrairement au guest qui lowercaseifie). Un utilisateur inscrit via invitation peut donc créer un compte avec des espaces ou caractères spéciaux dans son pseudo.

La dette structurelle — god components, fetch directs dans les composants, `any` dans les pipelines MongoDB — reste inchangée et stable. Le nombre de composants > 300 lignes est identique à l'audit précédent (9 composants), mais `MatchModal.tsx` a grossi de 328 → 357 lignes avec la nouvelle feature deck quick-confirm.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — validation username | 🟠 Important | `src/lib/validation.ts:23` | 🆕 Nouveau |
| 2 | Architecture — business logic en route | 🟡 Mineur | `app/api/tournaments/[id]/players/[playerId]/history/route.ts` | 🆕 Nouveau |
| 3 | Architecture — règle domaine en composant | 🟡 Mineur | `components/match/MatchModal.tsx:60`, `components/groups/GroupTournaments.tsx:12` | 🆕 Nouveau |
| 4 | Architecture — connectToMongoDB() redondant | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18` | 🆕 Nouveau |
| 5 | Redondance — formatDate dupliquée | 🟡 Mineur | `components/groups/ExternalAccessList.tsx:32`, `components/groups/ApiTokensTab.tsx:101` | 🆕 Nouveau |
| 6 | Redondance — hooks réimplémentant useFetch | 🟡 Mineur | `src/hooks/usePlayerHistory.ts`, `src/hooks/useTournamentStats.ts` | 🆕 Nouveau |
| 7 | Redondance — nommage incohérent | 🟡 Mineur | `InvitationRepository.ts:46`, `PlayerCommentRepository.ts:150` | 🆕 Nouveau |
| 8 | Couverture tests | 🟡 Mineur | `/api/tournaments/[id]/member-groups`, `/api/external/tournaments/[id]/players`, `usePlayerHistory` | 🆕 Nouveau |
| 9 | Architecture — business logic en route | 🟡 Mineur | `app/api/tournaments/[id]/stats/route.ts:41-89` | 🔁 Persistant |
| 10 | Fetch directs composants | 🟡 Mineur | `Tournament.tsx` (8 fetch) + 16 composants | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `Tournament.tsx` (398 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `MatchModal.tsx` (357 lignes, +29 vs audit précédent) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `GroupDetail.tsx` (356), `PlayersTab.tsx` (342), `GroupTournamentScoutingPage.tsx` (334), `PlayerDeckModal.tsx` (309), `Round.tsx` (304) | 🔁 Persistant |
| 16 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (4), `TournamentPlayersDeckRepository.ts` (3) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — `checkRateLimit('guest-validate:{ip}')` ajouté |
| B | `connectToMongoDB()` redondants dans `api-tokens/route.ts` et `external/players/route.ts` (🟡 Mineur) | ✅ Corrigé — imports supprimés (commit 18b5adb) |
| C | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Corrigé — centralisé dans `src/lib/auth/getIp.ts` (commit d7a9b76) |
| D | Tests manquants pour routes admin `pin` et `memo` (🟡 Mineur) | ✅ Corrigé — `admin-groups.test.ts` complété (commit aea6ae7) |
| E | `DELETE /api/tournaments/[id]` sans auth ni audit log | ✅ Corrigé — auth + audit log ajoutés (commit f510749) |
| F | Routes POST vestigiales sans authentification | ✅ Corrigé — supprimées (commit 9ef02aa) |

---

## 1. Sécurité

### 1.1 Validation du pseudo incohérente entre les flux d'inscription (IMPORTANT)

**Fichier :** `src/lib/validation.ts:23-31`  
**Fichiers concernés :** `app/api/invitations/[token]/route.ts` (utilise `validateRegisterBody`)

**Problème :** `validateRegisterBody` ne valide que la présence et la longueur du pseudo (≤ 30 chars), mais pas :
1. **Le jeu de caractères** : le flux guest valide `^[a-z0-9_-]+$`, le flux invitation n'a aucune contrainte de caractères
2. **La casse** : le flux guest lowercaseifie le pseudo, le flux invitation préserve la casse

```typescript
// validation.ts:23-31 — validation actuelle incomplète
export function validateRegisterBody(body: unknown): ValidationResult<{ username: string; password: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.username || typeof b.username !== 'string' || !b.username.trim())
    return err('Le pseudo est requis');
  if (b.username.trim().length > 30)
    return err('Le pseudo ne peut pas dépasser 30 caractères');
  // ← PAS de validation de caractères
  // ← PAS de toLowerCase()
  return ok({ username: b.username.trim(), password: b.password });
}

// guest/validate/route.ts:25 — validation plus stricte
if (!/^[a-z0-9_-]+$/.test(trimmedUsername))
  return ApiResponse.badRequest('Caractères autorisés : lettres, chiffres, _ et -');
```

**Risque :** Un utilisateur invité peut créer un compte avec `"user name"` (espace), `"user@domain"`, ou `"admin"` (majuscules différentes de `"Admin"`), tandis qu'un invité via magic link ne peut pas. Divergence de contraintes pour deux flux qui créent des objets `User` identiques en base.

**Correction :**
```typescript
export function validateRegisterBody(body: unknown): ValidationResult<{ username: string; password: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.username || typeof b.username !== 'string' || !b.username.trim())
    return err('Le pseudo est requis');
  const username = b.username.trim().toLowerCase();
  if (username.length > 30) return err('Le pseudo ne peut pas dépasser 30 caractères');
  if (!/^[a-z0-9_-]+$/.test(username))
    return err('Caractères autorisés : lettres minuscules, chiffres, _ et -');
  if (!b?.password || typeof b.password !== 'string')
    return err('Le mot de passe est requis');
  return ok({ username, password: b.password });
}
```

---

## 2. Architecture

### 2.1 Helpers de domaine définis dans un route handler (MINEUR)

**Fichier :** `app/api/tournaments/[id]/players/[playerId]/history/route.ts:11-29`

Les fonctions `buildResult()` et `buildScores()` (lignes 11-29) calculent le résultat et les scores d'un match pour un joueur donné. Ce sont des règles métier pures (entrée : `Match + playerId`, sortie : `PlayerHistoryResult | Scores`) qui devraient vivre dans `src/domain/rules/matchRules.ts` ou dans un `PlayerHistoryService`.

```typescript
// Dans la route — à déplacer dans le domain ou un service
function buildResult(match: Match, playerId: number): PlayerHistoryResult { ... }
function buildScores(match: Match, playerId: number): { gamesWon: ...; gamesLost: ... } { ... }
```

**Correction :** Exporter ces deux fonctions depuis `src/domain/rules/matchRules.ts` et les importer dans la route.

### 2.2 Business logic (calcul matrice matchup) dans la route stats (MINEUR)

**Fichier :** `app/api/tournaments/[id]/stats/route.ts:41-89`  
**État :** Persistant depuis l'audit du 2026-05-25

Même problème que 2.1 mais plus étendu : la construction de la matrice de matchup (50 lignes de for-loops et de calculs win/loss) est définie directement dans le handler. À déléguer à `TournamentService` ou un `StatsService`.

### 2.3 Règles de domaine appelées dans des composants React (MINEUR)

**Fichiers :**
- `components/match/MatchModal.tsx:60` — `deduplicateDecks()` de `@/src/domain/rules/scoutingRules`
- `components/groups/GroupTournaments.tsx:12` — `countConflictsByTournament()` de `@/src/domain/rules/conflictRules`

Ces fonctions de domaine sont importées et appelées dans des composants qui doivent rester purement présentationnels.

- `deduplicateDecks()` dans `MatchModal.tsx` : appelé dans `handleValidate()` avant la soumission. À déplacer dans le hook `useMatchState` ou le `onValidate` callback.
- `countConflictsByTournament()` dans `GroupTournaments.tsx` : utilisé pour dériver des compteurs de conflits par tournoi. À pré-calculer côté API ou dans un hook dédié.

### 2.4 `connectToMongoDB()` encore redondant dans `[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18`

Le commit `18b5adb` a supprimé les `connectToMongoDB()` redondants dans `api-tokens/route.ts` et `external/players/route.ts` mais a manqué ce fichier `[tokenId]/route.ts`. `GroupRepository.isAdmin()` et `ApiTokenRepository.revoke()` appellent déjà `connectToMongoDB()` en interne.

```typescript
// ligne 18 — à supprimer
await connectToMongoDB();
```

### 2.5 Fetch directs dans les composants (MINEUR — PERSISTANT)

**Fichier principal :** `components/tournament/Tournament.tsx` (8 fetch directs dans useEffect, alors que `useFetch` est déjà importé ligne 11)

16 autres composants contiennent des `fetch()` directs pour des requêtes GET : `GroupTournaments.tsx`, `GroupTournamentScoutingPage.tsx`, `ReportsTab.tsx`, `Layout.tsx`, `AdminSidebar.tsx`, `ExternalAccessList.tsx`, `Round.tsx`, `GuestInviteModal.tsx`, `PlayersTab.tsx`, `ConflictResolutionModal.tsx`, `AdminConflictModal.tsx`, `AdminMemoModal.tsx`, `InvitationSendModal.tsx`, `AddToGroupModal.tsx`, `AddTournamentModal.tsx`, `PlayerCommentHistory.tsx`.

C'est de la dette transversale à résorber incrémentalement — migrer vers `useFetch` route par route lors des prochains passages dans ces fichiers.

---

## 3. Redondances

### 3.1 `formatDate()` dupliquée dans deux composants (MINEUR)

**Fichiers :**
- `components/groups/ExternalAccessList.tsx:32-33`
- `components/groups/ApiTokensTab.tsx:101-102`

```typescript
// Identique dans les deux fichiers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
```

**Correction :** Exporter depuis `src/lib/date.ts` (qui n'expose actuellement que `diffInSeconds`) :

```typescript
// src/lib/date.ts — à ajouter
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
```

### 3.2 `usePlayerHistory` et `useTournamentStats` réimplémentent `useFetch` (MINEUR)

**Fichiers :**
- `src/hooks/usePlayerHistory.ts:14-29` — `useState + useEffect + fetch()` manuel
- `src/hooks/useTournamentStats.ts:8-17` — même pattern

Ces deux hooks réimplémentent la machine d'état loading/error/data que `useFetch` fournit nativement. `useFetch` accepte `null` comme URL (ne fetch pas), ce qui couvre le cas `!playerId` de `usePlayerHistory`.

```typescript
// Actuel — 15 lignes de plumbing manuel dans usePlayerHistory
const [entries, setEntries] = useState<PlayerHistoryEntry[]>([]);
const [loading, setLoading] = useState(false);
useEffect(() => {
  if (!playerId) { setEntries([]); return; }
  // ...fetch manuel...
}, [tournamentId, playerId, groupId]);

// Avec useFetch — 4 lignes
const url = playerId
  ? `/api/tournaments/${tournamentId}/players/${playerId}/history${groupId ? `?groupId=${groupId}` : ''}`
  : null;
const { data, loading, error } = useFetch<{ history: PlayerHistoryEntry[] }>(url);
const entries = data?.history ?? [];
```

### 3.3 Nommages incohérents dans les repositories (MINEUR)

**Problèmes identifiés :**

1. **`InvitationRepository.findPendingByEmail`** (`src/repositories/db/InvitationRepository.ts:46`) — retourne `boolean`, mais le préfixe `find*` désigne conventionnellement un retour d'entité ou `null`. `GroupInvitationRepository` utilise `hasPendingInvitation` pour la même sémantique. Renommer en `hasPendingInvitation`.

2. **`PlayerCommentRepository.deleteByGuestAccessId`** vs **`ScoutingReportRepository.deleteManyByGuestAccessId`** — même opération (suppression de tous les documents d'un guestAccessId), noms différents. Uniformiser sur `deleteManyByGuestAccessId`.

---

## 4. God components

9 composants dépassent 300 lignes. Le total est stable par rapport à l'audit du 2026-06-08, mais `MatchModal.tsx` a crû de 328 → 357 lignes (+29) avec la feature deck quick-confirm.

| Composant | Lignes | Tendance |
|-----------|--------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | Stable |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | 🔺 +29 (was 328) |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/tournament/PlayerDeckModal.tsx` | 309 | Stable |
| `components/round/Round.tsx` | 304 | Stable |

`MatchModal.tsx` est à surveiller — si les prochaines features continuent de l'alimenter, il franchira 400 lignes et deviendra la priorité de découpage.

---

## 5. Couverture de tests

### 5.1 Nouvelles routes sans tests (MINEUR)

| Route | Méthodes | Contexte |
|-------|---------|---------|
| `GET /api/tournaments/[id]/member-groups` | GET | Retourne les groupes de l'utilisateur qui contiennent un tournoi donné — logique de membership conditionnelle |
| `GET /api/external/tournaments/[id]/players` | GET | API externe avec Bearer token — scopes group/user, validation token, expiration |

**Cas prioritaires pour `/api/tournaments/[id]/member-groups` :**
- Utilisateur membre de 2 groupes contenant le tournoi → retourne les 2 groupes
- Utilisateur non membre → retourne `[]`
- Utilisateur non authentifié → 401

**Cas prioritaires pour `/api/external/tournaments/[id]/players` :**
- Token valide scope group → retourne les decks du groupe avec commentaires
- Token expiré → 401
- Token valide mais mauvais tournamentId → 403
- Token révoqué → 401

### 5.2 Hook sans test (MINEUR)

`src/hooks/usePlayerHistory.ts` — le hook effectue une fetch conditionnelle basée sur `playerId`. Avec la suite de tests de hooks existants (`useTournament.test.ts`, `useRound.test.ts`, `useDeckAssignment.test.ts`, `useTournament.test.ts`), un test unitaire de ce hook est cohérent avec la stratégie du projet.

---

## 6. Dette TypeScript persistante

**Fichiers :** `src/repositories/db/RoundRepository.ts` (4 occurrences), `src/repositories/db/TournamentPlayersDeckRepository.ts` (3 occurrences)

Les 7 `any` sont dans les pipelines d'agrégation MongoDB. Correctif possible : typer avec `PipelineStage[]` de mongoose (pattern documenté dans le rapport du 2026-06-08). Non bloquant, acceptable pragmatiquement.

---

## Récapitulatif des priorités

### 🟠 Important — À traiter dans le prochain sprint

1. **Aligner `validateRegisterBody` sur les contraintes du flux guest** — regex `^[a-z0-9_-]+$` + `toLowerCase()` + corriger le message d'erreur front si nécessaire.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Déplacer `buildResult()` et `buildScores()` dans `src/domain/rules/matchRules.ts`.
3. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`.
4. Déplacer `deduplicateDecks()` hors de `MatchModal.tsx` vers `useMatchState`.
5. Centraliser `formatDate()` dans `src/lib/date.ts`.
6. Migrer `usePlayerHistory` et `useTournamentStats` vers `useFetch`.
7. Renommer `InvitationRepository.findPendingByEmail` → `hasPendingInvitation`.
8. Uniformiser `deleteByGuestAccessId` → `deleteManyByGuestAccessId` dans `PlayerCommentRepository`.
9. Ajouter tests pour `/api/tournaments/[id]/member-groups` et `/api/external/tournaments/[id]/players`.
10. Typer les pipelines MongoDB avec `PipelineStage[]`.
