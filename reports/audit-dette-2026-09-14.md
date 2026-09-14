# Audit de dette technique — 2026-09-14

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-09-14

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, **tous les problèmes 🔴 Critique ont été corrigés** : le rate limiting est désormais présent sur `/api/guest/validate`, `getIp()` est centralisé dans `src/lib/auth/getIp.ts`, et les tests des routes admin `pin` et `memo` ont été ajoutés. Le système de feedback a été entièrement supprimé (décision de product, pas un bug).

**Un nouveau problème d'architecture 🔴 Critique émerge** : trois pages admin Server Components (`app/admin/users/page.tsx`, `app/admin/users/[id]/page.tsx`, `app/admin/invitations/page.tsx`) effectuent des requêtes Mongoose directes en bypassant totalement les repositories. Cette violation explicite de l'architecture définie dans CLAUDE.md est présente dans du code récemment ajouté.

**La dette sur les god components stagne ou s'aggrave** : les 10 composants > 300 lignes du dernier audit persistent sans amélioration, et deux nouveaux composants franchissent le seuil (`PlayerDeckModal.tsx` 309 lignes, `Round.tsx` 304 lignes). `Tournament.tsx` grossit encore (+22 lignes, à 398).

**9 routes API n'ont pas de tests d'intégration**, dont la route de génération de magic link (cœur du flux invité) et les routes de listing des invités de groupe.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — Mongoose direct dans Server Components | 🔴 Critique | `app/admin/users/page.tsx`, `app/admin/users/[id]/page.tsx`, `app/admin/invitations/page.tsx` | 🆕 Nouveau |
| 2 | Architecture — connectToMongoDB redondant | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🔁 Persistant (partiel) |
| 3 | Couverture tests — magic-link & guests | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts`, `guests/route.ts`, `/guest/my-tournaments/route.ts` | 🆕 Nouveau |
| 4 | Couverture tests — routes manquantes | 🟡 Mineur | 6 autres routes sans test | 🆕 Nouveau |
| 5 | Redondance — fetch directs dans composants | 🟠 Important | `Tournament.tsx` (8 fetch), + 6 autres composants | 🔁 Persistant |
| 6 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Croissant |
| 9 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Croissant |
| 10 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 18 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |
| 19 | Architecture — logique métier dans composant | 🟡 Mineur | `Tournament.tsx` (filter côté client), `Round.tsx` (dedup inline) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:${ip}')` ajouté |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisé dans `src/lib/auth/getIp.ts` |
| C | `connectToMongoDB()` redondant dans `external/.../players/route.ts` (🟡 Mineur) | ✅ Supprimé |
| D | Tests manquants pour routes admin `pin` et `memo` (🟡 Mineur) | ✅ Ajoutés dans `admin-groups.test.ts` et `admin-users.test.ts` |
| E | Système feedback (routes, widget, modèle) | ✅ Supprimé intentionnellement (décision product) |

---

## 1. Architecture

### 1.1 Requêtes Mongoose directes dans trois pages admin Server Components (CRITIQUE)

**Fichiers :**
- `app/admin/users/page.tsx` — lignes 34, 40
- `app/admin/users/[id]/page.tsx` — lignes 14, 21, 25, 26
- `app/admin/invitations/page.tsx` — lignes 24, 31

Ces trois pages Server Components contournent la couche repository en important et en interrogeant directement les modèles Mongoose (`UserModel`, `SessionModel`, `AuditLogModel`, `InvitationModel`). C'est une violation explicite du principe d'architecture de CLAUDE.md : "Accès MongoDB exclusivement via les repositories (`src/repositories/db/`) — jamais de requêtes Mongoose directes dans les routes ou services."

Les Server Components sont dans `app/` (équivalent fonctionnel de routes) : la règle s'applique.

**Exemple — `app/admin/users/page.tsx` :**
```typescript
// ❌ Violation : importation et usage direct du modèle Mongoose
import UserModel from '@models/User';

const [rawUsers, total] = await Promise.all([
  UserModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    .select('-passwordHash').lean(),
  UserModel.countDocuments(query),
]);
```

**Correction :**

1. Ajouter `findWithFilters(query, page, limit)` dans `UserRepository` (si absent) :
```typescript
// src/repositories/db/UserRepository.ts
static async findWithFilters(
  query: Record<string, unknown>,
  page: number,
  limit: number
): Promise<{ users: UserLean[]; total: number }> {
  await connectToMongoDB();
  const [users, total] = await Promise.all([
    UserModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit)
      .limit(limit).select('-passwordHash').lean(),
    UserModel.countDocuments(query),
  ]);
  return { users, total };
}
```

2. Remplacer dans `app/admin/users/page.tsx` :
```typescript
// ✅ Via repository
import { UserRepository } from '@/src/repositories/db/UserRepository';
const { users: rawUsers, total } = await UserRepository.findWithFilters(query, page, limit);
```

**Impact de la violation actuelle :** Si la logique de filtrage (sélection des champs, tri) change dans les repositories, les pages admin devront être mises à jour séparément. Le couplage direct au modèle Mongoose rend aussi ces pages non-testables sans une vraie base de données.

---

### 1.2 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6, 18

Ce fichier appelle `connectToMongoDB()` directement, alors que `ApiTokenRepository.revoke()` (invoqué ligne 24) gère lui-même la connexion. C'est exactement la même violation corrigée la semaine dernière dans `external/.../players/route.ts`, mais le fichier `[tokenId]/route.ts` (DELETE handler) avait été oublié lors du correctif.

```typescript
// ❌ Lignes 6 et 18 — redondant
import connectToMongoDB from '@/src/lib/db';
await connectToMongoDB();

// Le repository appelle lui-même connectToMongoDB() :
await ApiTokenRepository.revoke(tokenId, groupId, tid);
```

**Correction :** Supprimer les deux lignes.

---

## 2. Couverture de tests

### 2.1 Magic link et routes invité sans tests (IMPORTANT)

Les routes au cœur du flux d'accès invité n'ont pas de tests d'intégration, alors que `POST /api/guest/validate` est couvert.

| Route | Méthode(s) | Lacune |
|-------|-----------|--------|
| `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | GET, POST | Génération et récupération du magic link — pas de test |
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | GET | Listing des invités d'un groupe+tournoi — pas de test |
| `app/api/groups/[id]/guests/[accessId]/route.ts` | GET | Détail d'un accès invité — pas de test |
| `app/api/guest/my-tournaments/route.ts` | GET | Tournois accessibles à un compte isGuest — pas de test |

**Cas prioritaires pour `magic-link` :**
- POST génère un nouveau token et désactive l'ancien (`upsert`)
- POST sans auth → 401
- POST par un non-admin du groupe → 403
- GET retourne le token actif s'il existe, null sinon

**Cas prioritaires pour `guest/my-tournaments` :**
- Retourne les tournois liés à l'accès actif de l'invité
- Retourne vide si l'accès est révoqué
- Retourne 401 si non authentifié

### 2.2 Autres routes sans tests (MINEUR)

| Route | Méthode(s) | Priorité |
|-------|-----------|---------|
| `app/api/tournaments/[id]/admin-groups/route.ts` | GET | 🟡 |
| `app/api/tournaments/[id]/member-groups/route.ts` | GET | 🟡 |
| `app/api/admin/groups/[id]/invitations/[invId]/route.ts` | GET, PUT, DELETE | 🟡 |
| `app/api/admin/users/[id]/groups/route.ts` | GET | 🟡 |
| `app/api/users/search/route.ts` | GET | 🟡 (utilisé par InviteMemberModal) |

---

## 3. Redondances

### 3.1 Fetch directs dans les composants — 14 occurrences (IMPORTANT)

Le projet dispose d'un hook `useFetch<T>(url)` dans `src/hooks/useFetch.ts` (pattern standard CLAUDE.md). Pourtant, 14 GET `fetch()` dans des `useEffect` ou callbacks de composants ne l'utilisent pas. Les mutations (POST/PUT/DELETE) sont correctement en fetch direct.

| Composant | Ligne | Endpoint | Note |
|-----------|-------|----------|------|
| `components/tournament/Tournament.tsx` | 88–156 | 8 endpoints | Voir §3.2 |
| `components/ui/PlayerCommentHistory.tsx` | 85 | `/api/tournaments/…/comments` | |
| `components/tournament/ConflictResolutionModal.tsx` | 55 | `/api/tournaments/…/comments` | |
| `components/tournament/PlayersTab.tsx` | 74, 88 | players + registrations | |
| `components/tournament/GuestInviteModal.tsx` | 43, 52 | magic-link + guests | |
| `components/tournament/ReportsTab.tsx` | 22 | reports | |
| `components/admin/users/AdminMemoModal.tsx` | 25 | `/api/admin/users/…/memo` | |
| `components/admin/groups/InviteMemberModal.tsx` | 33 | `/api/users/search` | |
| `components/admin/invitations/InvitationSendModal.tsx` | 32 | `/api/admin/groups` | |
| `components/admin/users/AddToGroupModal.tsx` | 31 | `/api/admin/groups` | |
| `components/admin/AdminSidebar.tsx` | 106 | `/api/admin/badge-counts` | |
| `components/ui/Layout.tsx` | 35 | `/api/user/badge-counts` | |
| `components/round/Round.tsx` | 141 | `/api/tournaments/…/comment-counts` | |

### 3.2 `Tournament.tsx` — appel `/api/auth/me` redondant (MINEUR)

**Fichier :** `components/tournament/Tournament.tsx` — ligne 107

Ce composant effectue un `fetch('/api/auth/me')` pour obtenir l'ID de l'utilisateur connecté, alors que cette information est déjà disponible dans le store Zustand (initialisé dans `app/providers.tsx`). C'est un aller-retour serveur inutile à chaque rendu du composant.

### 3.3 Filtrage côté client dans `Tournament.tsx` (MINEUR)

**Fichier :** `components/tournament/Tournament.tsx` — lignes 133, 141

Les routes `GET /api/groups/[id]/conflicts` et `GET /api/groups/[id]/uncertainties` retournent **tous** les conflits du groupe, et le composant filtre ensuite par `tournamentId` côté client. En tournoi avec beaucoup de conflits, cela transfère des données inutiles.

```typescript
// ❌ Fetch de tous les conflits du groupe puis filtre client-side
.then((data) => setAdminConflicts(
  (data.conflicts ?? []).filter((c: AdminConflict) => c.tournamentId === Number(id))
))
```

**Correction suggérée :** Ajouter un paramètre `?tournamentId=` aux deux routes API et appliquer le filtre côté serveur.

---

## 4. God components

### État actuel — tableau comparatif

| Composant | Lignes (06-08) | Lignes (09-14) | Évolution |
|-----------|---------------|---------------|----------|
| `admin/groups/GroupDetailClient.tsx` | 480 | 480 | = Stable |
| `tournament/Tournament.tsx` | 376 | **398** | ▲ +22 |
| `tournament/TournamentsPageClient.tsx` | 375 | 375 | = Stable |
| `match/MatchModal.tsx` | 328 | **357** | ▲ +29 |
| `groups/GroupDetail.tsx` | 356 | 356 | = Stable |
| `tournament/PlayersTab.tsx` | 342 | 342 | = Stable |
| `groups/GroupTournamentScoutingPage.tsx` | 334 | 334 | = Stable |
| `groups/GroupTournaments.tsx` | 319 | 319 | = Stable |
| `ui/PlayerCommentHistory.tsx` | 317 | 317 | = Stable |
| `admin/users/UserDetailClient.tsx` | 315 | 315 | = Stable |
| `tournament/PlayerDeckModal.tsx` | — | **309** | 🆕 Nouveau |
| `round/Round.tsx` | — | **304** | 🆕 Nouveau |

Les composants `Tournament.tsx` (+22) et `MatchModal.tsx` (+29) sont en croissance active : sans découpage préventif, ils dépasseront 400 lignes lors de la prochaine feature.

---

## 5. Dette TypeScript

### 5.1 `any` dans les pipelines MongoDB (MINEUR — PERSISTANT)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (4 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages)

Inchangé depuis l'audit du 2026-06-08. Ces `any` sont annotés `// eslint-disable-next-line @typescript-eslint/no-explicit-any` et fonctionnellement corrects. Remplacement recommandé :

```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: … }];
```

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger dans le sprint en cours

1. **Refactoriser les 3 pages admin** (`users/page.tsx`, `users/[id]/page.tsx`, `invitations/page.tsx`) pour passer par les repositories — violation explicite de l'architecture CLAUDE.md.

### 🟠 Important — À planifier dans les 2 prochaines semaines

2. **Ajouter des tests d'intégration pour les routes magic-link et guest** (`magic-link/route.ts`, `guests/route.ts`, `guest/my-tournaments/route.ts`).
3. **Migrer les 14 GET fetch() inline vers `useFetch`** — systématiquement dans les composants qui le permettent.

### 🟡 Mineur — À adresser progressivement

4. Supprimer `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (2 lignes).
5. Ajouter filtrage `?tournamentId=` côté serveur sur `/api/groups/[id]/conflicts` et `/uncertainties`.
6. Typer les pipelines MongoDB avec `PipelineStage[]` (7 `any`).
7. Tester les 6 routes mineures sans couverture.
8. Surveiller `Tournament.tsx` et `MatchModal.tsx` (en croissance) — découper lors de la prochaine feature.
