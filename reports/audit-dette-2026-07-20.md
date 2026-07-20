# Audit de dette technique — 2026-07-20

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-07-20

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, les **5 priorités identifiées ont toutes été traitées** : le rate limiting est en place sur `/api/guest/validate`, les `connectToMongoDB()` redondants ont disparu des deux routes signalées, `getIp()` est centralisée dans `src/lib/auth/getIp.ts`, et les tests pour les routes admin `pin` et `memo` ont été ajoutés. C'est la première fois en 3 audits consécutifs que la catégorie 🔴 Critique est vide.

**Le vecteur de dette principale reste les god components** : le projet compte désormais **12 composants > 300 lignes** (contre 10 il y a six semaines). Deux nouveaux composants ont franchi le seuil : `PlayerDeckModal.tsx` (309 lignes) et `Round.tsx` (304 lignes). Aucun des composants persistants n'a été réduit.

**Un nouveau résidu d'architecture** : la correction des `connectToMongoDB()` dans `api-tokens/route.ts` (scope groupe) n'a pas été propagée à la variante `api-tokens/[tokenId]/route.ts` du même répertoire — le même pattern existe toujours là.

**Deux nouvelles routes sans couverture** : `/api/tournaments/[id]/admin-groups/route.ts` et `/api/tournaments/[id]/member-groups/route.ts`, introduites avec la feature player-history, n'ont pas de tests d'intégration.

**Pattern N+1 introduit dans deux nouvelles routes** : `admin-groups` et `member-groups` effectuent un double aller-retour MongoDB par groupe (un `isAdmin()/isMember()` + un `findById()`), là où un seul lookup enrichi suffirait.

La couverture de tests globale est bonne : `registrations.test.ts`, `player-history.test.ts`, `api-tokens.test.ts`, `comment-counts.test.ts`, `admin-badge-counts.test.ts` et `user-badge-counts.test.ts` ont tous été créés. Le projet totalise **51 fichiers de tests**.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18` | 🆕 Nouveau |
| 2 | Architecture — logique métier dans route | 🟡 Mineur | `app/api/tournaments/[id]/players/[playerId]/history/route.ts:11–25` | 🆕 Nouveau |
| 3 | Perf — N+1 MongoDB | 🟡 Mineur | `app/api/tournaments/[id]/admin-groups/route.ts`, `member-groups/route.ts` | 🆕 Nouveau |
| 4 | Fetch directs dans composants | 🟡 Mineur | `AdminMemoModal.tsx:25`, `InvitationSendModal.tsx:32`, `AddToGroupModal.tsx:31` | 🆕 Nouveau |
| 5 | Couverture tests | 🟡 Mineur | `tournaments/[id]/admin-groups`, `tournaments/[id]/member-groups` | 🆕 Nouveau |
| 6 | Dette TS — cast unsafe | 🟡 Mineur | `app/api/tournaments/[id]/players/[playerId]/comments/route.ts:47` | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |
| 20 | Fetch directs | 🟡 Mineur | `components/tournament/Tournament.tsx` (8 useEffect/fetch) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:${getIp(request)}')` ajouté |
| B | `connectToMongoDB()` dans `api-tokens/route.ts` (scope groupe) (🟡 Mineur) | ✅ Supprimé |
| C | `connectToMongoDB()` dans `external/.../players/route.ts` (🟡 Mineur) | ✅ Supprimé |
| D | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts` |
| E | Tests manquants pour routes admin `pin` et `memo` (🟡 Mineur) | ✅ Ajoutés dans `admin-groups.test.ts` et `admin-users.test.ts` |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (IMPORTANT)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — ligne 18

Le handler DELETE de la route `[tokenId]` appelle toujours `connectToMongoDB()` directement, alors que le handler du même feature (`api-tokens/route.ts`, sans `[tokenId]`) a été corrigé lors du sprint précédent. Le pattern est identique à ce qui a été fixé.

```typescript
// Avant (à corriger)
import connectToMongoDB from '@/src/lib/db';
// ...
await connectToMongoDB();                              // ← redondant
const isAdmin = await GroupRepository.isAdmin(...);   // gère sa propre connexion
```

**Correction :** Supprimer l'import et l'appel `await connectToMongoDB()`. `GroupRepository.isAdmin()` et `ApiTokenRepository.revoke()` gèrent chacun leur connexion en interne.

---

### 1.2 Logique métier inline dans la route `/history` (MINEUR)

**Fichier :** `app/api/tournaments/[id]/players/[playerId]/history/route.ts` — lignes 11–25

Les fonctions `buildResult()` et `buildScores()` implémentent de la logique de domaine (interprétation du résultat d'un match pour un joueur donné) directement dans le fichier de route. `src/domain/rules/matchRules.ts` contient déjà `getStatusFromMatch()` et `showScoreFromMatch()` — deux fonctions qui opèrent sur les mêmes données de match.

```typescript
// Dans la route (à déplacer)
function buildResult(match: Match, playerId: number): PlayerHistoryResult {
  if (match.match_is_bye || match.match_is_loss) return 'BYE';
  if (match.match_is_intentional_draw || ...) return 'DRAW';
  if (match.winning_player === null) return 'PENDING';
  return match.winning_player === playerId ? 'WIN' : 'LOSS';
}

function buildScores(match: Match, playerId: number): { gamesWon: number|null; gamesLost: number|null } { ... }
```

**Correction :** Déplacer ces deux fonctions dans `src/domain/rules/matchRules.ts` et les exporter. La route n'importe que les fonctions depuis le module de règles.

---

## 2. Performance

### 2.1 Pattern N+1 dans `admin-groups` et `member-groups` (MINEUR)

**Fichiers :**
- `app/api/tournaments/[id]/admin-groups/route.ts`
- `app/api/tournaments/[id]/member-groups/route.ts`

Ces deux routes partagent le même pattern : pour chaque `GroupTournament` trouvé, elles effectuent deux requêtes MongoDB séquentielles — une pour vérifier le rôle (`isAdmin`/`isMember`) et une pour récupérer le nom du groupe (`findById`).

```typescript
// Pattern actuel — 2 requêtes par groupe
await Promise.all(
  groupTournaments.map(async (gt) => {
    const groupId = String(gt.groupId);
    const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);   // requête 1
    if (isAdmin) {
      const group = await GroupRepository.findById(groupId);               // requête 2
      if (group) adminGroups.push({ groupId, groupName: group.name });
    }
  }),
);
```

Pour un tournoi lié à N groupes, cela génère jusqu'à 2N aller-retours MongoDB. Le `Promise.all` externe les parallélise correctement, mais les deux appels internes restent séquentiels par groupe.

**Correction suggérée :** Enrichir `GroupTournamentRepository.findGroupsByTournamentId()` avec un `$lookup` sur la collection `groups` pour ramener `name` en une seule requête, puis filtrer en mémoire sur le rôle :

```typescript
// Option 1 — lookup en aggregation (préféré)
// Dans GroupTournamentRepository :
async findGroupsByTournamentIdWithName(tournamentId: number) {
  return GroupTournamentModel.aggregate([
    { $match: { tournamentId } },
    { $lookup: { from: 'groups', localField: 'groupId', foreignField: '_id', as: 'group' } },
    { $unwind: '$group' },
    { $project: { groupId: 1, groupName: '$group.name' } },
  ]);
}

// Option 2 — batch fetch (plus simple)
const allGroups = await GroupRepository.findByIds(groupTournaments.map(gt => String(gt.groupId)));
const groupMap = new Map(allGroups.map(g => [String(g._id), g]));
```

---

## 3. Redondances

### 3.1 `fetch()` direct pour des GETs dans les composants admin (MINEUR)

**Fichiers :**
- `components/admin/users/AdminMemoModal.tsx:25` — `fetch('/api/admin/users/${userId}/memo')`
- `components/admin/invitations/InvitationSendModal.tsx:32` — `fetch('/api/admin/groups')`
- `components/admin/groups/InviteMemberModal.tsx:33` — `fetch('/api/users/search?...')`
- `components/admin/users/AddToGroupModal.tsx:31` — `fetch('/api/admin/groups')`

Ces composants effectuent des appels GET directement avec `fetch()` alors que le hook `useFetch<T>(url)` (dans `src/hooks/useFetch.ts`) est le pattern standard du projet pour les requêtes GET côté client.

**Différence d'impact :** `useFetch` gère `loading`, `error`, et déduplication automatique ; un `fetch()` nu nécessite du boilerplate manuel.

**Correction :** Remplacer les `fetch()` GET par `useFetch` dans ces composants. Les mutations (POST/DELETE/PATCH) peuvent rester en `fetch()` nu — `useFetch` est conçu pour le read-only.

---

## 4. Dette TypeScript

### 4.1 Cast `as unknown as { _id: string }` dans `comments/route.ts` (MINEUR)

**Fichier :** `app/api/tournaments/[id]/players/[playerId]/comments/route.ts` — ligne 47

```typescript
const id = typeof c.authorId === 'object'
  ? String((c.authorId as unknown as { _id: string })._id)
  : String(c.authorId);
```

Ce cast en deux temps (`as unknown as`) trahit une définition de type incomplète sur le champ `authorId` dans `IPlayerComment`. Quand Mongoose retourne un document `.lean()`, `authorId` est un `ObjectId`, pas un objet avec `_id`. Le cast est fonctionnellement correct mais masque la vraie cause : le type de `authorId` dans `PlayerComment.ts` devrait être `mongoose.Types.ObjectId | string | null` et la conversion devrait utiliser `.toString()` directement.

**Correction :**
```typescript
// Méthode directe sans cast
const id = String(c.authorId);  // ObjectId.toString() et string.toString() fonctionnent les deux
```

### 4.2 `any` dans les pipelines MongoDB (MINEUR — PERSISTANT)

Identique à l'audit du 2026-06-08. 7 usages dans `RoundRepository.ts` (lignes 67, 95, 114, 168) et `TournamentPlayersDeckRepository.ts` (lignes 142, 163, 224). Ces `any` peuvent être typés avec `PipelineStage[]` de Mongoose.

---

## 5. God components (PERSISTANT)

Le projet compte désormais **12 composants > 300 lignes** (contre 10 au dernier audit). Deux nouveaux composants franchissent le seuil.

### 5.1 Nouveaux composants > 300 lignes

| Composant | Lignes | Contenu |
|-----------|-------|---------|
| `components/tournament/PlayerDeckModal.tsx` | 309 | Modal d'assignation de deck + historique joueur + sélection d'encres |
| `components/round/Round.tsx` | 304 | Vue ronde complète : liste matchs, filtres, modal, historique, confirm modal |

`Round.tsx` orchestre 6 composants enfants distincts (`MatchCard`, `MatchModal`, `RoundHeader`, `RoundSearch`, `PlayerCommentHistory`, `PlayerHistoryDrawer`, `DeckConfirmModal`) — ce niveau d'orchestration pourrait être extrait dans un hook `useRoundLayout()`.

### 5.2 God components persistants (à surveiller)

| Composant | Lignes | Tendance |
|-----------|-------|---------|
| `GroupDetailClient.tsx` (admin) | 480 | Stable |
| `Tournament.tsx` | 398 | +22 vs juin (376→398) |
| `TournamentsPageClient.tsx` | 375 | Stable |
| `MatchModal.tsx` | 357 | +29 vs juin (328→357) |
| `GroupDetail.tsx` | 356 | Stable |
| `PlayersTab.tsx` | 342 | Stable |
| `GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `GroupTournaments.tsx` | 319 | Stable |
| `PlayerCommentHistory.tsx` | 317 | Stable |
| `UserDetailClient.tsx` | 315 | Stable |

`Tournament.tsx` (+22 lignes) et `MatchModal.tsx` (+29 lignes) progressent à chaque audit.

---

## 6. Couverture de tests

### 6.1 Deux nouvelles routes sans tests d'intégration (MINEUR)

| Route | Méthode | Logique à tester |
|-------|---------|-----------------|
| `app/api/tournaments/[id]/admin-groups/route.ts` | GET | Filtre sur le rôle admin ; retourne uniquement les groupes où l'utilisateur est admin |
| `app/api/tournaments/[id]/member-groups/route.ts` | GET | Filtre sur membership ; retourne les groupes où l'utilisateur est membre |

**Cas prioritaires pour `admin-groups` :**
- Utilisateur non-admin dans tous les groupes → `groups: []`
- Utilisateur admin dans 1 groupe sur 2 → retourne uniquement ce groupe
- Tournoi sans groupes → `groups: []`

**Cas prioritaires pour `member-groups` :**
- Utilisateur non-membre → `groups: []`
- Utilisateur membre → retourne le groupe avec son nom

---

## Récapitulatif des priorités

### 🟠 Important — À corriger dans le prochain sprint

1. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** — même correction que pour le parent, 2 lignes.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Déplacer `buildResult()` et `buildScores()` dans `src/domain/rules/matchRules.ts`.
3. Résoudre le N+1 dans `admin-groups` et `member-groups` via lookup enrichi ou batch fetch.
4. Remplacer les `fetch()` GET par `useFetch` dans `AdminMemoModal`, `InvitationSendModal`, `AddToGroupModal`.
5. Ajouter tests pour `/api/tournaments/[id]/admin-groups` et `/api/tournaments/[id]/member-groups`.
6. Corriger le cast `as unknown as` dans `comments/route.ts:47` → `String(c.authorId)`.
7. Typer les pipelines MongoDB avec `PipelineStage[]` (suppression des 7 `any`).
8. Découper `MatchModal.tsx` et `Tournament.tsx` lors des prochaines features touchant ces composants.
