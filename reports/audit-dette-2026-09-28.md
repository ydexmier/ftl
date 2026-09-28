# Audit de dette technique — 2026-09-28

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-09-28  
**Référence précédente :** `reports/audit-dette-2026-06-08.md`

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, **les 3 problèmes critiques et mineurs prioritaires sont corrigés** : le rate limiting sur `/api/guest/validate` est en place, `getIp()` est centralisé dans `src/lib/auth/getIp.ts`, et les tests manquants (admin badge-counts, user badge-counts, comment-counts, last-round, player-history, registrations, admin-groups, api-tokens, group-scouting-stats) ont tous été ajoutés.

**Un problème d'architecture est apparu** dans la nouvelle feature player-history : les fonctions `buildResult()` et `buildScores()` sont définies directement dans le handler de route, violant le principe "pas de logique métier dans les routes". Elles devraient être dans un service ou un module de règles domaine.

**Une régression de performance** est présente dans l'endpoint admin `GET /api/admin/groups` : le handler effectue 2×N requêtes DB supplémentaires (findById + findByGroupId par groupe) dans un Promise.all, créant un schéma N+1 sur la liste complète des groupes.

**La progression des god components est stable** : le total reste à 12 composants > 300 lignes. `Tournament.tsx` est passé de 376 à 398 lignes (+22). Deux nouveaux composants (`PlayerDeckModal.tsx` 309 lignes, `Round.tsx` 304 lignes) ont franchi le seuil.

**La dette TypeScript persistante** sur les pipelines MongoDB reste identique (7 usages de `any` dans 2 fichiers).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — logique métier en route | 🟠 Important | `app/api/tournaments/[id]/players/[playerId]/history/route.ts` | 🆕 Nouveau |
| 2 | Performance — N+1 queries | 🟠 Important | `app/api/admin/groups/route.ts` | 🆕 Nouveau |
| 3 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 4 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 5 | Documentation CLAUDE.md | 🟡 Mineur | `AdminMemoRepository`, `ApiTokenRepository`, `TournamentRegistrationRepository`, `RegistrationService` | 🆕 Nouveau |
| 6 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` (ligne 18) | 🔁 Persistant |
| 7 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 8 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant |
| 9 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 17 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |
| 18 | Fetch directs admin | 🟡 Mineur | `components/admin/**` (0 usage de useFetch) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — `checkRateLimit` + `getIp()` en place |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Corrigé — centralisé dans `src/lib/auth/getIp.ts` |
| C | Tests manquants admin badge-counts, user badge-counts, comment-counts, last-round, player-history, registrations, admin-groups, api-tokens (🟡 Mineur) | ✅ Corrigé — tous ajoutés |

---

## 1. Architecture

### 1.1 Logique métier dans la route `player-history` (IMPORTANT)

**Fichier :** `app/api/tournaments/[id]/players/[playerId]/history/route.ts`

**Problème :** Le handler contient deux fonctions utilitaires de domaine (`buildResult`, `buildScores`) et une boucle complète de construction de l'historique, directement dans le fichier de route. Cela viole le principe du projet : "pas de logique métier dans les routes" (CLAUDE.md).

```typescript
// history/route.ts (lignes 12-30) — logique métier en dehors du service
function buildResult(match: Match, playerId: number): PlayerHistoryResult {
  if (match.match_is_bye || match.match_is_loss) return 'BYE';
  if (match.match_is_intentional_draw || ...) return 'DRAW';
  if (match.winning_player === null) return 'PENDING';
  return match.winning_player === playerId ? 'WIN' : 'LOSS';
}

function buildScores(match: Match, playerId: number): { gamesWon: ...; gamesLost: ... } {
  // ...
}
// + boucle sur rounds (lignes 70-100)
```

Ces fonctions ont une logique de domaine testable indépendamment. `buildResult` notamment gère 5 cas différents qui méritent des tests unitaires.

**Correction :** Créer `src/services/PlayerHistoryService.ts` et extraire la logique :

```typescript
// src/services/PlayerHistoryService.ts
import type { Match } from '@/src/types/match';
import type { PlayerHistoryEntry, PlayerHistoryResult } from '@/src/types/player';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

function buildResult(match: Match, playerId: number): PlayerHistoryResult { ... }
function buildScores(match: Match, playerId: number): { ... } { ... }

export const PlayerHistoryService = {
  async getHistory(tournamentId: number, playerId: number, scope: { groupId?: string | null; userId?: string | null }): Promise<PlayerHistoryEntry[]> {
    const [rounds, decksData] = await Promise.all([
      RoundRepository.findRoundsByTournamentId(tournamentId),
      TournamentPlayersDeckRepository.findByScope(tournamentId, scope),
    ]);
    // ... boucle de construction
  },
};
```

Le handler devient alors une demi-douzaine de lignes d'orchestration auth + appel service.

---

### 1.2 `connectToMongoDB()` redondant (MINEUR — PERSISTANT)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — ligne 18

Ce problème est identique à celui signalé dans l'audit du 06-08 sur un chemin voisin (`api-tokens/route.ts`). Il a été corrigé sur `api-tokens/route.ts` mais pas sur `api-tokens/[tokenId]/route.ts`.

```typescript
// api-tokens/[tokenId]/route.ts — ligne 18
await connectToMongoDB();  // ← redondant, GroupRepository.isAdmin() gère sa propre connexion
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
```

**Correction :** Supprimer `import connectToMongoDB` et l'appel `await connectToMongoDB()` ligne 18.

---

## 2. Performance

### 2.1 Requête N+1 dans `GET /api/admin/groups` (IMPORTANT)

**Fichier :** `app/api/admin/groups/route.ts` — lignes 13-25

**Problème :** Le handler récupère tous les groupes via `GroupRepository.findAll()` puis, pour chaque groupe, effectue deux requêtes DB supplémentaires dans une `Promise.all(groups.map(...))` :

```typescript
const groups = await GroupRepository.findAll();
const enriched = await Promise.all(
  groups.map(async (g) => {
    const id = String(g._id);
    const full = await GroupRepository.findById(id);          // ← N requêtes
    const tournaments = await GroupTournamentRepository.findByGroupId(id); // ← N requêtes
    return { _id: id, name: g.name, memberCount: full?.members.length ?? 0, tournamentCount: tournaments.length };
  }),
);
```

Avec N groupes, cela génère **2N + 1 requêtes DB** au lieu de 1 ou 2. Le `Promise.all` garantit que les requêtes sont parallèles, mais avec N groupes cela crée une contention sur la connection pool MongoDB.

**Correction suggérée :** Ajouter une méthode `GroupRepository.findAllEnriched()` qui utilise une aggregation MongoDB pour récupérer les counts en une seule passe :

```typescript
// src/repositories/db/GroupRepository.ts
async findAllEnriched() {
  await connectToMongoDB();
  return GroupModel.aggregate([
    {
      $lookup: {
        from: 'grouptournaments',
        localField: '_id',
        foreignField: 'groupId',
        as: 'tournaments',
      },
    },
    {
      $project: {
        name: 1,
        isPinned: 1,
        memberCount: { $size: '$members' },
        tournamentCount: { $size: '$tournaments' },
      },
    },
    { $sort: { name: 1 } },
  ]);
},
```

---

## 3. God components

Le projet compte désormais **12 composants > 300 lignes** (+2 depuis le dernier audit). Les deux nouveaux dépassements sont liés aux features récentes de deck assignment.

### 3.1 Nouveaux composants ayant franchi le seuil

| Composant | Lignes | Commentaire |
|-----------|-------|-------------|
| `components/tournament/PlayerDeckModal.tsx` | 309 | Modal d'assignation deck depuis la vue joueurs — 3 fonctionnalités distinctes (scope user, groupe, tournoi) |
| `components/round/Round.tsx` | 304 | Vue ronde — mélange affichage + logique de filtres + état pagination |

### 3.2 God components persistants

| Composant | Lignes | Tendance depuis 06-08 |
|-----------|-------|-----------------------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | +22 (376 → 398) — à surveiller |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |

---

## 4. Documentation CLAUDE.md — nouveaux éléments non documentés (MINEUR)

Depuis le dernier audit, plusieurs éléments ont été ajoutés au codebase sans mise à jour de CLAUDE.md :

| Élément | Fichier | Type |
|---------|--------|------|
| `AdminMemoRepository` | `src/repositories/db/AdminMemoRepository.ts` | Repository |
| `ApiTokenRepository` | `src/repositories/db/ApiTokenRepository.ts` | Repository |
| `TournamentRegistrationRepository` | `src/repositories/db/TournamentRegistrationRepository.ts` | Repository |
| `RegistrationService` | `src/services/RegistrationService.ts` | Service |

Ces éléments sont absents de la section "Repositories" et "Services" de CLAUDE.md. Ils doivent être ajoutés lors de la prochaine mise à jour documentaire (à proposer avant d'appliquer, conformément aux règles du projet).

---

## 5. Dette TypeScript persistante

### 5.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (4 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages)

Inchangé depuis l'audit du 06-08. La correction avec `PipelineStage` de Mongoose reste applicable :

```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🟠 Important — À corriger dans le sprint en cours

1. **Extraire la logique métier de `history/route.ts` vers `PlayerHistoryService`** — refactoring isolé, 1-2h, tests unitaires possibles sur `buildResult`/`buildScores`.
2. **Remplacer le N+1 dans `GET /api/admin/groups`** par un `findAllEnriched()` avec aggregation MongoDB.

### 🟡 Mineur — Opportunités d'amélioration continue

3. Supprimer `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (5 min).
4. Mettre à jour CLAUDE.md avec les 4 éléments manquants (à proposer d'abord).
5. Surveiller `Tournament.tsx` (398 lignes, +22) — si une feature s'ajoute, prévoir un découpage.
6. Typer les pipelines MongoDB avec `PipelineStage[]` (suppression des 7 `any`).
