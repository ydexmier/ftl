# Audit de dette technique — 2026-10-05

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-10-05  
**Dernier audit :** 2026-06-08

---

## Résumé exécutif

Depuis l'audit du 2026-06-08, **tous les items critiques et importants ont été corrigés** : rate limiting sur `/api/guest/validate`, centralisation de `getIp()`, suppression des `connectToMongoDB()` redondants dans les routes API, et ajout des tests pour les routes `pin` et `memo`. Ces corrections ont été livrées dans les commits `d7a9b76`, `18b5adb` et `aea6ae7`.

**Une régression architecturale isolée a été introduite** : la route `DELETE /api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]` créée après la correction du 08 juin réintroduit un `connectToMongoDB()` redondant — même pattern, même fichier de la même feature (api-tokens), mais sous-route `[tokenId]` cette fois.

**La dette de couverture de tests s'est creusée** : 7 routes fonctionnelles n'ont aucun test d'intégration (magic-link, guests, admin user groups, users/search, admin-groups, member-groups, admin invitations cancel). Ces routes couvrent des fonctionnalités non triviales.

**Les god components stagnent** : 10 composants dépassent toujours 300 lignes, et `PlayerDeckModal.tsx` vient de passer ce seuil (309 lignes). Aucun découpage n'a été effectué depuis le dernier audit.

La dette TypeScript (`any` dans les pipelines MongoDB) reste inchangée — 6 usages dans 2 fichiers. Elle reste justifiable fonctionnellement.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18` | 🆕 Régression |
| 2 | Couverture tests — magic-link | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | 🆕 Nouveau |
| 3 | Couverture tests — guests | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | 🆕 Nouveau |
| 4 | Couverture tests — users/search | 🟡 Mineur | `app/api/users/search/route.ts` | 🆕 Nouveau |
| 5 | Couverture tests — admin user groups | 🟡 Mineur | `app/api/admin/users/[id]/groups/route.ts` | 🆕 Nouveau |
| 6 | Couverture tests — tournament admin-groups | 🟡 Mineur | `app/api/tournaments/[id]/admin-groups/route.ts` | 🆕 Nouveau |
| 7 | Couverture tests — tournament member-groups | 🟡 Mineur | `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 8 | Couverture tests — admin invitation cancel | 🟡 Mineur | `app/api/admin/groups/[id]/invitations/[invId]/route.ts` | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 10 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes) | 🔁 Persistant (+22) |
| 12 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant (+29) |
| 14 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (6 usages) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Commit | Statut |
|---|-----------------|--------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | `d7a9b76` | ✅ Corrigé |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | `d7a9b76` | ✅ Corrigé — `src/lib/auth/getIp.ts` créé |
| C | `connectToMongoDB()` dans `api-tokens/route.ts` et `external/players/route.ts` (🟡 Mineur) | `18b5adb` | ✅ Corrigé |
| D | Tests manquants pour `/api/admin/groups/pinned`, `/pin`, `/memo` (🟡 Mineur) | `aea6ae7` | ✅ Corrigé |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (RÉGRESSION)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — ligne 18

Ce pattern avait été corrigé en juin pour le fichier `api-tokens/route.ts` et `external/players/route.ts`. La route `[tokenId]/route.ts` a été créée après la correction et réintroduit le même anti-pattern : appel explicite à `connectToMongoDB()` avant un repository qui gère déjà sa propre connexion.

```typescript
// Extrait du fichier — le problème est à la ligne 18
import connectToMongoDB from '@/src/lib/db';  // ← import inutile
// ...
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid, tokenId } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  await connectToMongoDB();  // ← redondant : GroupRepository.isAdmin l'appelle déjà

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
```

**Correction :**
```typescript
// Supprimer les deux lignes suivantes :
import connectToMongoDB from '@/src/lib/db';
// ...
await connectToMongoDB();
```

---

## 2. Sécurité

Aucun nouveau problème de sécurité identifié. Les corrections de l'audit précédent (rate limiting guest, auth sur DELETE tournaments, suppression des routes POST sans auth) sont en place.

---

## 3. Couverture de tests

### 3.1 Routes sans tests d'intégration (7 routes)

Ces routes ont été créées ou intégrées au cours des sprints récents. Aucune n'a de fichier de test dédié ou de couverture dans les suites existantes.

#### 🟠 Priorité haute

**`app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts`** (GET + POST)

Cette route crée et récupère les magic links d'invitation invité. Elle interagit avec `GroupMagicLinkRepository.upsert` qui désactive l'ancien lien et en crée un nouveau — logique de mutation d'état non triviale qui mérite des tests.

Cas prioritaires :
- GET → 401 sans auth, 403 si non-admin, 200 avec `link: null` si aucun lien actif
- POST → 401, 403, 404 si tournoi non attaché au groupe, 201 avec le token généré
- POST → un second POST désactive le lien précédent (unicité garantie)

**`app/api/groups/[id]/tournaments/[tid]/guests/route.ts`** (GET)

Retourne la liste des accès invités en attente pour un groupe+tournoi. Utilisée par l'admin pour gérer les invités. La logique de jointure entre `TournamentExternalAccess` et `User` mérite une vérification.

Cas prioritaires :
- GET → 401, 403 si non-admin, 200 avec liste vide
- GET → 200 avec accès PENDING + ACCEPTED (seuls les PENDING sont retournés selon `findPendingByGroupAndTournament`)

#### 🟡 Priorité normale

**`app/api/admin/users/[id]/groups/route.ts`** (POST)

Ajoute directement un utilisateur à un groupe (admin only). Appelle `GroupService.adminAddDirectMember`.

Cas : 401, 403, 400 si `groupId` absent, 404 si groupe inconnu, 201 si succès.

**`app/api/users/search/route.ts`** (GET)

Recherche d'utilisateurs par username/email (GET authentifié). Minimum 3 caractères requis.

Cas : 401, 400 si `q` < 3 chars, 200 avec résultats filtrés (max 10).

**`app/api/tournaments/[id]/admin-groups/route.ts`** (GET)

Retourne les groupes liés à ce tournoi où l'utilisateur courant est admin. Utilisé pour afficher le bouton admin-groupe.

Cas : 401, 200 avec liste vide si pas de groupe, 200 avec les groupes admin de l'utilisateur.

**`app/api/tournaments/[id]/member-groups/route.ts`** (GET)

Retourne les groupes où l'utilisateur est membre et qui ont ce tournoi.

Cas : 401, 200 avec liste vide, 200 avec les groupes membres.

**`app/api/admin/groups/[id]/invitations/[invId]/route.ts`** (DELETE)

Annule une invitation de groupe par un admin. Vérifie que l'invitation est bien PENDING et appartient au groupe.

Cas : 401, 403, 404 si invitation inconnue ou groupe mismatch, 400 si invitation déjà non-PENDING, 200 si succès.

---

## 4. God components

### 4.1 `PlayerDeckModal.tsx` — 309 lignes (NOUVEAU)

**Fichier :** `components/tournament/PlayerDeckModal.tsx`

Ce composant franchit le seuil des 300 lignes. Il gère la modal d'assignation de deck depuis la vue scouting groupe, avec logique d'état pour la sélection d'encres, les conflits, et les commentaires. À surveiller lors des prochaines features.

### 4.2 `Tournament.tsx` et `MatchModal.tsx` — croissance continue

Ces deux composants ont chacun pris ~25 lignes depuis le dernier audit :
- `Tournament.tsx` : 376 → 398 lignes (+22)
- `MatchModal.tsx` : 328 → 357 lignes (+29)

La transformation de `MatchModal` en bottom sheet mobile (commit `d89a652`) a ajouté du code conditionnel sans découpage préventif. Ces composants approchent du seuil critique de 400 lignes.

### 4.3 God components persistants (>300 lignes, stables)

| Composant | Lignes | vs audit précédent |
|-----------|--------|-------------------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | = |
| `components/tournament/TournamentsPageClient.tsx` | 375 | = |
| `components/groups/GroupDetail.tsx` | 356 | = |
| `components/tournament/PlayersTab.tsx` | 342 | = |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | = |
| `components/groups/GroupTournaments.tsx` | 319 | = |
| `components/ui/PlayerCommentHistory.tsx` | 317 | = |

---

## 5. Dette TypeScript

### 5.1 `any` dans les pipelines MongoDB (PERSISTANT — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (4 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 163, 224 (2 usages)

Inchangé depuis le dernier audit. Ces `any` restent fonctionnellement corrects. La migration vers `PipelineStage[]` de Mongoose reste recommandée mais non urgente.

```typescript
// Correction suggérée :
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🟠 Important — À traiter dans le prochain sprint

1. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** — 2 lignes, correction triviale, même pattern déjà corrigé deux fois.
2. **Tests pour `magic-link` et `guests`** — Routes liées à la feature invité, logique non triviale.

### 🟡 Mineur — Opportunités d'amélioration continue

3. Tests pour `users/search`, `admin/users/[id]/groups`, `admin-groups`, `member-groups`, `admin invitations DELETE`.
4. Surveiller `Tournament.tsx` et `MatchModal.tsx` — croissance continue, découpage préventif lors de la prochaine feature.
5. Typer les pipelines MongoDB avec `PipelineStage[]` (6 `any` restants).
