# Audit de dette technique — 2026-07-27

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-07-27

---

## Résumé exécutif

Comparé à l'audit du **2026-06-08**, la quasi-totalité des items critiques ont été traités : le rate limiting sur `/api/guest/validate` est en place, `getIp()` est centralisée dans `src/lib/auth/getIp.ts`, les `connectToMongoDB()` redondants dans `api-tokens` et `external/players` ont été supprimés, et les tests pour les routes `pin` et `memo` ont été ajoutés. Le bilan est très positif sur les items prioritaires de l'audit précédent.

**Un problème de sécurité nouveau est identifié :** le handler `POST /api/rounds/[roundId]/matchs` n'appelle pas `getAuthSession()`. La protection se réduit à la vérification HMAC du cookie par le middleware — qui ne valide pas la session contre MongoDB. Tout utilisateur avec un cookie signé (même d'une session révoquée) peut insérer des données arbitraires dans n'importe quel Round.

**Une route public sans tests persiste :** `GET /api/guest/my-tournaments` n'a aucune couverture dans `guest-access.test.ts`. La route `GET /api/tournaments/[id]/member-groups` (feature du 2026-06-13) est dans le même état.

**Le nettoyage incomplet du `connectToMongoDB()` :** le fichier `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` conserve l'appel redondant, qui n'a pas été traité lors du commit du 2026-06-09.

**La suppression du système Feedback** (commit PR #207) est propre : modèle, repository, routes, composant et tests ont tous été supprimés ensemble. Aucun code mort résiduel.

**La prolifération des god components stagne :** 12 composants dépassent 300 lignes (10 persistants + 2 nouveaux depuis juin : `PlayerDeckModal.tsx` 309 lignes, `Round.tsx` 304 lignes). Aucun des god components existants n'a été découpé.

**Dette TypeScript légère mais à adresser :** l'interface `Group` dans `src/types/group.ts` ne déclare pas `isPinned` ni `infoMessage`, deux champs pourtant présents dans le modèle Mongoose et utilisés activement. Aucun type `User` public n'existe dans `src/types/`.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — auth manquante sur POST | 🔴 Critique | `app/api/rounds/[roundId]/matchs/route.ts` | 🆕 Nouveau |
| 2 | Architecture — connectToMongoDB redondant | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🔁 Persistant |
| 3 | Types incomplets — Group | 🟡 Mineur | `src/types/group.ts` | 🆕 Nouveau |
| 4 | Types manquants — User | 🟡 Mineur | absent de `src/types/` | 🆕 Nouveau |
| 5 | Tests manquants | 🟡 Mineur | `app/api/guest/my-tournaments/route.ts` | 🆕 Nouveau |
| 6 | Tests manquants | 🟡 Mineur | `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 8 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes) | 🔁 Persistant |
| 9 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 18 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (6 usages) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — commit `d7a9b76` |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts` |
| C | `connectToMongoDB()` redondant dans `external/players` (🟡 Mineur) | ✅ Supprimé — commit `18b5adb` |
| D | Tests manquants pour routes `pin` et `memo` (🟡 Mineur) | ✅ Ajoutés dans `admin-groups.test.ts` et `admin-users.test.ts` |
| E | Routes POST vestigiales sans auth (`matchs/[matchId]`) (🔴 Sécurité) | ✅ Supprimées — commit `9ef02aa` |

---

## 1. Sécurité

### 1.1 `POST /api/rounds/[roundId]/matchs` — auth manquante (CRITIQUE)

**Fichier :** `app/api/rounds/[roundId]/matchs/route.ts` — lignes 36–44

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

**Problème :** Ce handler n'appelle pas `getAuthSession(request)`. Le middleware vérifie uniquement la signature HMAC du cookie (Edge Runtime, sans accès MongoDB). Un utilisateur dont la session est révoquée en base mais dont le cookie signé est encore valide peut appeler ce handler. Plus grave : un utilisateur authentifié (rôle USER) peut insérer des données arbitraires dans n'importe quel Round via le spread `{ id: Number(roundId), ...body }`.

Le commit du 2026-06-09 (`fix(sec): supprimer les routes POST vestigiales sans auth`) a supprimé le handler POST de `matchs/[matchId]/route.ts` mais a oublié ce handler dans `matchs/route.ts`.

**Comparaison avec le handler GET du même fichier :**
```typescript
// GET — correct : getAuthSession() appelé
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);  // ✅
  // ...
}

// POST — incorrect : aucune vérification d'identité DB
export async function POST(request: NextRequest, { params }: Params) {
  // ❌ pas de getAuthSession(), pas de validation du rôle
}
```

**Correction :** Supprimer le handler POST ou, s'il est nécessaire, le protéger :
```typescript
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();
  // Vérifier que l'utilisateur est ADMIN ou SUPERUSER avant d'accepter un upsert brut
  if (auth.role !== 'ADMIN' && auth.role !== 'SUPERUSER') return ApiResponse.forbidden();
  // ...
}
```

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6, 18

```typescript
import connectToMongoDB from '@/src/lib/db';  // ← import redondant

export async function DELETE(request: NextRequest, { params }: Params) {
  // ...
  await connectToMongoDB();  // ← redondant : getAuthSession() + repositories gèrent la connexion

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  // ...
}
```

Le commit `18b5adb` du 2026-06-09 a supprimé les `connectToMongoDB()` dans le fichier `api-tokens/route.ts` (parent) et dans `external/players/route.ts`, mais a manqué le fichier `[tokenId]/route.ts` (sous-route DELETE d'un token).

**Correction :** Supprimer l'import et l'appel `await connectToMongoDB()`.

---

## 3. Dette TypeScript

### 3.1 Interface `Group` incomplète dans `src/types/group.ts` (MINEUR)

**Fichier :** `src/types/group.ts`

Le modèle Mongoose `models/Group.ts` déclare `isPinned: boolean` (ligne 16) et `infoMessage?: string` (ligne 15). Ces deux champs sont actifs (feature du 2026-05-xx — pin de groupe, message d'info).

L'interface TypeScript publique `Group` ne les déclare pas :

```typescript
// src/types/group.ts — état actuel
export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  // ❌ isPinned manquant
  // ❌ infoMessage manquant
}
```

**Impact :** les composants qui lisent un `Group` depuis l'API et accèdent à `isPinned` ou `infoMessage` font du duck-typing implicite (`group.isPinned` retourne `undefined` plutôt qu'une erreur TypeScript en cas d'absence).

**Correction :**
```typescript
export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: GroupMember[];
  isPinned: boolean;
  infoMessage?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Absence de type `User` / `AuthUser` dans `src/types/` (MINEUR)

Il n'existe pas de fichier `src/types/user.ts`. Les données utilisateur retournées par `/api/auth/me`, `/api/user/badge-counts`, `/api/guest/validate` (champs `isGuest`, `role`, `canCreateGroup`, `needsOnboarding`) sont consommées par les composants sans type partagé.

Le hook `useTournamentManagement.ts` déclare un `GroupSection` local avec `isPinned?: boolean`, et les appels à `user.isGuest` dans les composants sont des duck-typings implicites.

**Correction minimale :**
```typescript
// src/types/user.ts
export type UserRole = 'USER' | 'ADMIN' | 'SUPERUSER';

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  isGuest: boolean;
  canCreateGroup: boolean;
  needsOnboarding: boolean;
}
```

### 3.3 `any` dans les pipelines MongoDB (MINEUR — DOCUMENTÉ)

**Fichiers :** `src/repositories/db/RoundRepository.ts` (4 usages), `src/repositories/db/TournamentPlayersDeckRepository.ts` (2 usages).

Tous les usages sont couverts par `// eslint-disable-next-line @typescript-eslint/no-explicit-any`. Ils correspondent à des limitations réelles du typage Mongoose pour `bulkWrite` et les pipelines d'agrégation. Non-bloquant mais adressable via `PipelineStage[]` de Mongoose v7.

---

## 4. Tests manquants

### 4.1 `GET /api/guest/my-tournaments` — aucune couverture (MINEUR)

**Fichier :** `app/api/guest/my-tournaments/route.ts`

`src/__tests__/guest-access.test.ts` importe uniquement `POST as validateGuest` depuis `guest/validate/route`. La route `GET /api/guest/my-tournaments`, qui retourne les tournois accessibles à un utilisateur `isGuest`, n'a aucun test.

**Cas prioritaires à couvrir :**
- Retourne 401 sans cookie
- Retourne les tournois liés à l'accès actif de l'invité (status ACCEPTED)
- Retourne une liste vide si l'accès est REVOKED ou EXPIRED
- Un non-invité (isGuest: false) reçoit une liste vide ou 403

### 4.2 `GET /api/tournaments/[id]/member-groups` — aucune couverture (MINEUR)

**Fichier :** `app/api/tournaments/[id]/member-groups/route.ts` — feature du 2026-06-13 (commit `a1a81ea`).

Cette route retourne les groupes dont l'utilisateur est membre et qui incluent le tournoi donné. Aucun test dans `src/__tests__/tournaments.test.ts` ni ailleurs.

**Cas prioritaires à couvrir :**
- Retourne 401 sans cookie
- Retourne une liste vide si l'utilisateur n'appartient à aucun groupe lié au tournoi
- Retourne les bons groupes si l'utilisateur est membre de groupes ayant ce tournoi
- Retourne une liste vide si le tournoi n'est lié à aucun groupe

---

## 5. God components

Le projet compte **12 composants > 300 lignes** (10 persistants depuis l'audit 2026-06-08, 2 nouveaux apparus avec les features récentes).

### 5.1 Nouveaux god components

| Composant | Lignes | Feature d'origine |
|-----------|-------|------------------|
| `components/tournament/PlayerDeckModal.tsx` | 309 | Modale d'assignation de deck (scouting groupe) |
| `components/round/Round.tsx` | 304 | Vue ronde avec progression et filtre multiselect |

`Round.tsx` a grossi avec l'ajout du filtre multi-sélection (`feat: filtre multi-sélection sur la barre de progression`). La logique de filtrage est inline dans le composant au lieu d'être extraite dans un hook.

### 5.2 God components persistants

| Composant | Lignes | Tendance |
|-----------|-------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | Stable (+22 depuis audit précédent — bandeau groupe) |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |

---

## 6. Redondances

### 6.1 Style try-catch ancien vs pattern moderne dans les routes (MINEUR)

Deux styles de gestion d'erreur coexistent dans la codebase :

**Style moderne (toutes routes récentes) :**
```typescript
const result = await requireAdminSession(request);
if ('error' in result) return result.error;
return ApiResponse.ok({ ... });
```

**Style ancien (quelques routes) :**
- `app/api/rounds/[roundId]/matchs/route.ts` (handler GET, lignes 10–33) — try-catch wrappant le corps entier avec `(err as Error).message`
- `app/api/groups/[id]/tournaments/[tid]/route.ts` — pattern similaire

Ce n'est pas une violation critique mais crée une incohérence dans la gestion des erreurs. Les routes anciennes ne bénéficient pas des améliorations futures du pattern moderne.

### 6.2 Duplication de pattern fetch dans les hooks (MINEUR)

`useTournamentStats.ts` et `usePlayerHistory.ts` implémentent leur propre boucle `fetch + useState(loading) + catch` au lieu de déléguer à `useFetch<T>`. Le code est fonctionnel mais diverge du pattern établi. À refactorer lors d'une prochaine intervention sur ces hooks.

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger dans le sprint en cours

1. **Supprimer ou protéger `POST /api/rounds/[roundId]/matchs`** — handler sans `getAuthSession()` permettant des upserts bruts sans validation d'identité DB ni de rôle.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Supprimer `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (oubli du commit 2026-06-09).
3. Ajouter `isPinned` et `infoMessage` à l'interface `Group` dans `src/types/group.ts`.
4. Créer `src/types/user.ts` avec un type `AuthUser`.
5. Ajouter tests pour `GET /api/guest/my-tournaments` et `GET /api/tournaments/[id]/member-groups`.
6. Surveiller la croissance de `Round.tsx` et `PlayerDeckModal.tsx` (nouveaux > 300 lignes).
7. Typer les pipelines MongoDB avec `PipelineStage[]` (suppression des 6 `any` commentés).
