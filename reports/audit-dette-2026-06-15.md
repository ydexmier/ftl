# Audit de dette technique — 2026-06-15

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-06-15

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, **tous les items critiques et importants ont été corrigés** : le rate limiting sur `/api/guest/validate` est en place, `getIp()` est centralisée dans `src/lib/auth/getIp.ts`, les `connectToMongoDB()` redondants dans `api-tokens/route.ts` et `external/.../players/route.ts` ont été supprimés, et les trois routes admin `pin` / `memo` sont désormais testées.

**Un `connectToMongoDB()` redondant subsiste** dans la route de révocation de token (`api-tokens/[tokenId]/route.ts`), créée en même temps que les deux routes corrigées mais oubliée dans le correctif.

**La prolifération des god components s'aggrave légèrement** : 12 composants dépassent 300 lignes (contre 10 il y a une semaine). `Tournament.tsx` (376 → 398 lignes) et `MatchModal.tsx` (328 → 357 lignes) continuent de croître, et deux nouveaux composants `PlayerDeckModal.tsx` (309 lignes) et `Round.tsx` (304 lignes) franchissent le seuil.

**Cinq routes API sans tests** sont identifiées : `/api/guest/my-tournaments`, `/api/groups/[id]/tournaments/[tid]/magic-link`, `/api/groups/[id]/tournaments/[tid]/guests`, `/api/tournaments/[id]/admin-groups`, et `/api/tournaments/[id]/member-groups`. Elles appartiennent aux features récentes (guest access, magic link, bandeaux groupe).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🆕 Nouveau |
| 2 | God component — croissance | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant (croissant) |
| 3 | God component — croissance | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Persistant (croissant) |
| 4 | God component — nouveau | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 5 | God component — nouveau | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 6 | Couverture tests | 🟡 Mineur | `app/api/guest/my-tournaments/route.ts` | 🆕 Nouveau |
| 7 | Couverture tests | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | 🆕 Nouveau |
| 8 | Couverture tests | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | 🆕 Nouveau |
| 9 | Couverture tests | 🟡 Mineur | `app/api/tournaments/[id]/admin-groups/route.ts` | 🆕 Nouveau |
| 10 | Couverture tests | 🟡 Mineur | `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 11 | God component — stable | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 12 | God component — stable | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 13 | God component — stable | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 14 | God component — stable | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 15 | God component — stable | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 16 | God component — stable | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 17 | God component — stable | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 18 | God component — stable | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant (justifié) |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — `checkRateLimit('guest-validate:${ip}')` + `getIp` |
| B | `connectToMongoDB()` redondant dans `api-tokens/route.ts` et `external/.../players/route.ts` (🟡 Mineur) | ✅ Corrigé |
| C | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Corrigé — `src/lib/auth/getIp.ts` centralisée, tous les fichiers importent |
| D | Tests manquants pour `admin/groups/pinned`, `admin/groups/[id]/pin`, `admin/users/[id]/memo` (🟡 Mineur) | ✅ Corrigé — couverts dans `admin-groups.test.ts` et `admin-users.test.ts` |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` redondant dans la révocation de token (IMPORTANT)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6 et 18

La route de révocation d'un token API appelle encore `connectToMongoDB()` directement avant d'invoquer `GroupRepository.isAdmin` et `ApiTokenRepository.revoke`, qui gèrent leur propre connexion en interne. C'est la même violation que les deux routes corrigées la semaine dernière (`api-tokens/route.ts` et `external/.../players/route.ts`) — la route `[tokenId]` a été oubliée dans le correctif.

```typescript
// app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts
import connectToMongoDB from '@/src/lib/db';   // ← à supprimer

export async function DELETE(request: NextRequest, { params }: Params) {
  // ...
  await connectToMongoDB();                    // ← redondant
  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  // ...
}
```

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` et `await connectToMongoDB()` (lignes 6 et 18).

---

## 2. God components

Le projet compte **12 composants > 300 lignes** (contre 10 il y a une semaine). Deux composants persistants continuent de croître et deux nouveaux franchissent le seuil.

### 2.1 `Tournament.tsx` (398 lignes, +22 depuis l'audit précédent)

**Fichier :** `components/tournament/Tournament.tsx`

Ce composant accumule 9 appels `fetch()` directs dans un bloc `useEffect` de 80 lignes (lignes 82–160), gérant conflits, dernière ronde, rôle groupe, statut de merge, accès invités, et déclenchement d'une fusion. Chaque nouvelle feature du tournoi y ajoute des requêtes. La tendance à la croissance est préoccupante : ce composant a déjà dépassé 300 lignes il y a deux audits.

**Découpage suggéré :**
- Extraire un hook `useTournamentContext(tournamentId, groupId)` qui encapsule tous les appels GET (conflits, rôle, merge-status) et retourne un objet de contexte.
- Extraire `TournamentGroupActions` (section merge, bouton admin groupe) comme sous-composant.

### 2.2 `MatchModal.tsx` (357 lignes, +29 depuis l'audit précédent)

**Fichier :** `components/match/MatchModal.tsx`

La feature `deck-quick-confirm` et le bottom sheet mobile ont ajouté 29 lignes. Le composant cumule la logique de sélection d'encres pour deux joueurs, la validation, le commentaire, et désormais les deux modes d'affichage (modal desktop / bottom sheet mobile). Si la tendance continue au même rythme, il dépassera 400 lignes dans deux semaines.

**Découpage suggéré :**
- Extraire `PlayerInkSelector` (section d'un joueur : nom, encres, slot quick-confirm).
- Extraire `MatchCommentField` (champ commentaire + gestion invité).

### 2.3 `PlayerDeckModal.tsx` (309 lignes, NOUVEAU)

**Fichier :** `components/tournament/PlayerDeckModal.tsx`

Franchit le seuil pour la première fois. Stable pour l'instant, à surveiller lors des prochaines features de scouting.

### 2.4 `Round.tsx` (304 lignes, NOUVEAU)

**Fichier :** `components/round/Round.tsx`

Franchit le seuil pour la première fois. Contient la logique de fetch des matchs paginés et le rendu de la liste. Stable pour l'instant.

### 2.5 God components stables (tableau de suivi)

| Composant | Lignes (06-15) | Lignes (06-08) | Tendance |
|-----------|---------------|---------------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | 480 | Stable |
| `components/tournament/TournamentsPageClient.tsx` | 375 | 375 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | 315 | Stable |

---

## 3. Couverture de tests

### 3.1 Cinq routes sans tests (MINEUR)

Ces routes ont été créées pour les features récentes (guest access, magic link, bannière groupe) mais n'ont pas de tests d'intégration associés.

| Route | Méthodes | Feature d'origine |
|-------|----------|-----------------|
| `app/api/guest/my-tournaments/route.ts` | GET | Guest access — liste des tournois accessibles |
| `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | GET, POST | Guest access — génération du magic link |
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | GET | Guest access — liste des invités du tournoi |
| `app/api/tournaments/[id]/admin-groups/route.ts` | GET | Bannière groupe — groupes admin du tournoi |
| `app/api/tournaments/[id]/member-groups/route.ts` | GET | Bannière groupe — groupes membre du tournoi |

**Cas prioritaires pour `guest/my-tournaments` :**
- GET sans session → 401
- GET avec session non-invitée → retourne liste vide
- GET avec invité ayant un accès ACCEPTED → retourne le tournoi lié
- GET avec invité ayant un accès REVOKED → ne retourne pas ce tournoi

**Cas prioritaires pour `magic-link` :**
- GET/POST sans session → 401
- GET/POST par un non-admin du groupe → 403
- POST génère un token UUID et crée/remplace le lien existant (upsert)
- POST sur un tournoi non rattaché au groupe → 404

---

## 4. Dette TypeScript persistante

### 4.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (4 usages, tous `// eslint-disable-next-line @typescript-eslint/no-explicit-any`)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages, idem)

Les `any` sont désormais tous explicitement désactivés avec `eslint-disable`. Fonctionnellement corrects. La migration vers `PipelineStage[]` (type Mongoose v7) reste possible mais non urgente :

```typescript
// Remplacement possible :
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🟠 Important — À corriger dès que possible

1. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** — 2 lignes, même pattern que les corrections de la semaine dernière.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Ajouter des tests pour les 5 routes guest/magic-link/admin-groups/member-groups.
3. Surveiller `Tournament.tsx` et `MatchModal.tsx` — intervention avant qu'ils atteignent 430 lignes.
4. Envisager le découpage de `PlayerDeckModal.tsx` et `Round.tsx` lors de la prochaine feature.
5. Typer les pipelines MongoDB avec `PipelineStage[]` (suppression des 7 `any`).
