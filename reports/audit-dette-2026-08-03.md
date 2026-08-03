# Audit de dette technique — 2026-08-03

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-08-03

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, la **progression est totale sur les 7 items prioritaires** : rate limiting sur `/api/guest/validate` ajouté, `getIp()` centralisée dans `src/lib/auth/getIp.ts`, `connectToMongoDB()` nettoyé dans `api-tokens/route.ts` et `external/.../players/route.ts`, tests ajoutés pour les routes `pin`, `memo` et `admin/stats`, et la route uncertainty renommée DELETE et testée. Le système de Feedback a également été supprimé proprement (modèle, routes, composant, tests).

**La même violation se reproduit sur un nouveau fichier** : `api-tokens/[tokenId]/route.ts` appelle encore `connectToMongoDB()` à la ligne 18, alors que le pattern est corrigé sur les autres routes du même groupe. La violation s'est répliquée lors d'une nouvelle feature sans être interceptée.

**Les god components continuent leur progression silencieuse** : `Tournament.tsx` passe de 376 à 398 lignes, `MatchModal.tsx` de 328 à 357. Deux nouveaux fichiers franchissent le seuil de 300 lignes : `PlayerDeckModal.tsx` (309) et `Round.tsx` (304), portant le total à 12 composants concernés.

**Nouvelles routes sans tests** : le flux d'approbation des invités (`PUT /api/groups/[id]/guests/[accessId]`), la liste des invités en attente (`GET /api/groups/[id]/tournaments/[tid]/guests`), la récupération des groupes d'un tournoi pour l'utilisateur (`GET /api/tournaments/[id]/member-groups`) et l'annulation d'invitation de groupe (`DELETE /api/groups/[id]/invitations/[invId]`) n'ont aucun test.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🆕 Nouveau |
| 2 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 3 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 4 | Couverture tests | 🟡 Mineur | `PUT /api/groups/[id]/guests/[accessId]` (approve/reject/revoke) | 🆕 Nouveau |
| 5 | Couverture tests | 🟡 Mineur | `GET /api/groups/[id]/tournaments/[tid]/guests` | 🆕 Nouveau |
| 6 | Couverture tests | 🟡 Mineur | `GET /api/tournaments/[id]/member-groups` | 🆕 Nouveau |
| 7 | Couverture tests | 🟡 Mineur | `DELETE /api/groups/[id]/invitations/[invId]` | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 9 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant ↗ |
| 10 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Persistant ↗ |
| 12 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 18 | Fetch directs | 🟡 Mineur | `components/tournament/Tournament.tsx` (9 appels), `PlayerCommentHistory.tsx` (4 appels) | 🔁 Persistant |
| 19 | Hooks non testés | 🟡 Mineur | `src/hooks/useTournamentManagement.ts` (276 lignes) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:${getIp(request)}')` ajouté |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts` |
| C | `connectToMongoDB()` dans `api-tokens/route.ts` et `external/.../players/route.ts` (🟡 Mineur) | ✅ Supprimé |
| D | Tests manquants pour `admin/groups/pin` et `admin/groups/pinned` (🟡 Mineur) | ✅ Ajoutés dans `admin-groups.test.ts` |
| E | Tests manquants pour `admin/users/[id]/memo` (🟡 Mineur) | ✅ Ajoutés dans `admin-users.test.ts` |
| F | Tests manquants pour `GET /api/admin/stats` (🟡 Mineur) | ✅ Ajoutés dans `admin-remaining.test.ts` |
| G | `PUT /api/groups/[id]/uncertainties/[conflictId]` non testé (🟡 Mineur) | ✅ Route renommée DELETE, testée dans `uncertaintyBadges.test.ts` |
| H | Système Feedback — routes, modèle, composant orphelins | ✅ Supprimé proprement (modèle, 3 routes API, composant `FeedbackWidget.tsx`) |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` résiduel dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6, 18

Ce fichier DELETE d'un token API appelle `connectToMongoDB()` directement avant d'invoquer `ApiTokenRepository.revoke()`, alors que le repository gère lui-même la connexion en interne. La même violation a été corrigée sur `api-tokens/route.ts` (parent) le 2026-06-09, mais ce fichier enfant n'a pas été traité en même temps.

```typescript
// api-tokens/[tokenId]/route.ts — extrait
import connectToMongoDB from '@/src/lib/db';  // ← import inutile

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid, tokenId } = await params;
  // ...
  await connectToMongoDB();  // ← ligne 18, redondant
  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);  // gère sa propre connexion
```

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` (ligne 6) et `await connectToMongoDB()` (ligne 18).

---

## 2. God components

Le projet compte désormais **12 composants > 300 lignes** (contre 10 au dernier audit). Deux nouveaux fichiers franchissent le seuil, et deux composants existants continuent de grossir.

### 2.1 Nouveaux composants franchissant le seuil

**`components/tournament/PlayerDeckModal.tsx` — 309 lignes** (🆕)

Modal d'assignation de deck depuis la vue scouting groupe. Cumule : logique de sélection d'encres, validation des combinaisons, appel API, affichage conditionnel du formulaire de commentaire, et rendu de l'historique des decks précédents pour le joueur.

**Découpage suggéré :**
- Extraire `DeckSelectionForm` (gestion des encres uniquement)
- Extraire `PlayerDeckHistory` (affichage de l'historique) — à factoriser avec `PlayerCommentHistory.tsx`

**`components/round/Round.tsx` — 304 lignes** (🆕)

Composant de rendu d'une ronde avec ses matchs, contrôles de pagination, filtre de recherche, et affichage des états de chargement. La logique de pagination et de filtrage pourrait être extraite dans `useRoundPagination`.

### 2.2 Composants en hausse (à surveiller)

| Composant | Lignes actuelles | Dernier audit | Delta |
|-----------|----------------|---------------|-------|
| `components/tournament/Tournament.tsx` | 398 | 376 | +22 |
| `components/match/MatchModal.tsx` | 357 | 328 | +29 |

`Tournament.tsx` concentre toujours 9 appels `fetch()` directs (voir section 3.1), ce qui contribue mécaniquement à l'inflation. `MatchModal.tsx` grossit avec chaque nouvelle feature d'assignation.

### 2.3 God components persistants stables

| Composant | Lignes | Tendance |
|-----------|-------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |

---

## 3. Redondances

### 3.1 `fetch()` directs dans les composants (PERSISTANT)

Les composants React appellent directement `fetch()` au lieu d'utiliser les hooks disponibles dans `src/hooks/`. Ce pattern est structurellement incohérent : le projet dispose de `useFetch`, `useRound`, `useTournament`, `usePlayerHistory`, `useTournamentManagement`, mais les composants ne les utilisent pas pour leurs mutations et chargements conditionnels.

**Cas les plus flagrants :**

| Composant | Occurrences fetch() directs | Hook disponible |
|-----------|---------------------------|-----------------|
| `components/tournament/Tournament.tsx` | 9 (lignes 88, 100, 107, 115, 123, 131, 139, 146, 156) | `useTournament`, `useFetch` |
| `components/ui/PlayerCommentHistory.tsx` | 4 (lignes 85, 106, 125, 140) | `usePlayerHistory` existe dans `src/hooks/` |
| `components/groups/GroupDetail.tsx` | 5 (lignes 74, 147, 158, 172, 189) | `useFetch` |
| `components/groups/GroupTournaments.tsx` | 5 (lignes 77, 91, 100, 107, 130) | `useFetch` |
| `components/groups/GroupTournamentScoutingPage.tsx` | 2 (lignes 70, 85) | `useFetch` |

Le cas `PlayerCommentHistory.tsx` est particulièrement visible : `usePlayerHistory` (32 lignes dans `src/hooks/`) encapsule exactement ce fetch, mais le composant gère son propre state de loading/error.

---

## 4. Couverture de tests

### 4.1 Nouvelles routes sans tests (MINEUR)

Quatre routes créées récemment n'ont aucun test d'intégration :

| Route | Méthode | Feature |
|-------|---------|---------|
| `app/api/groups/[id]/guests/[accessId]/route.ts` | PUT | Approve / reject / revoke un accès invité |
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | GET | Lister les invités PENDING d'un groupe+tournoi |
| `app/api/tournaments/[id]/member-groups/route.ts` | GET | Groupes dont l'utilisateur est membre pour un tournoi |
| `app/api/groups/[id]/invitations/[invId]/route.ts` | DELETE | Annuler une invitation de groupe |

La route `PUT /api/groups/[id]/guests/[accessId]` mérite une attention particulière : elle gère trois actions distinctes (approve → email envoyé, reject, revoke) avec des validations de statut et des effets de bord (envoi d'email via `sendGuestApprovedEmail`).

**Cas prioritaires pour `PUT /api/groups/[id]/guests/[accessId]` :**
- Approve un accès PENDING → status ACCEPTED
- Reject un accès PENDING → status REJECTED
- Revoke un accès ACCEPTED → status REVOKED
- Approve un accès non-PENDING → 400
- Non-admin du groupe → 403
- `accessId` appartenant à un autre groupe → 403

### 4.2 Hook `useTournamentManagement` non testé (MINEUR)

**Fichier :** `src/hooks/useTournamentManagement.ts` — 276 lignes

Ce hook gère l'état UI de la page principale des tournois (archive/désarchive, assignation à un groupe, animation de carte volante). Il contient 8 appels `fetch()` internes dans des handlers (`handleArchive`, `handleUnarchive`, `handleAssignGroup`, `handleUnassignGroup`). Aucun test n'existe pour ce hook.

---

## Récapitulatif des priorités

### 🟡 Mineur — Opportunités d'amélioration continue

1. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts` — 2 lignes à supprimer.
2. Ajouter tests pour `PUT /api/groups/[id]/guests/[accessId]` — logique de statut et email à valider.
3. Ajouter tests pour `GET /api/groups/[id]/tournaments/[tid]/guests`, `GET /api/tournaments/[id]/member-groups`, `DELETE /api/groups/[id]/invitations/[invId]`.
4. Surveiller `Tournament.tsx` (398 lignes) et `MatchModal.tsx` (357 lignes) à chaque prochaine feature.
5. Migrer `PlayerCommentHistory.tsx` pour utiliser `usePlayerHistory` au lieu de `fetch()` direct.
