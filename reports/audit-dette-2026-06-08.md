# Audit de dette technique — 2026-06-08

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-06-08

---

## Résumé exécutif

Comparé à l'audit du 2026-05-25, la progression est **totale sur les 4 items prioritaires** : `getAdminSession` est définitivement supprimé, `requireAdminSession` est uniformisé sur les 28 routes admin, `StatsTab.tsx` a été entièrement refactorisé (108 lignes, builders extraits, hook dédié), `/api/tournaments/[id]/stats` est testé avec 8 cas, et `connectToMongoDB()` a été retiré de `fetchRound` et `fetchTournament`.

**Un nouveau problème de sécurité est identifié :** `/api/guest/validate` crée des comptes utilisateurs sans aucun rate limiting, contrairement aux autres endpoints d'inscription (`/api/invitations/[token]`, `/api/auth/forgot-password`). Cette route est publique et accessible sans authentification.

**La prolifération des god components s'aggrave** : 10 composants dépassent 300 lignes (contre 5 il y a deux semaines). Deux nouvelles features (admin groupes, page tournois) ont généré des composants larges sans découpage préventif. `GroupDetailClient.tsx` côté admin atteint 480 lignes.

**Redondance structurelle** : la fonction `getIp()` est dupliquée à l'identique dans 6 fichiers différents sans centralisation.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — rate limiting | 🔴 Critique | `app/api/guest/validate/route.ts` | 🆕 Nouveau |
| 2 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/route.ts`, `app/api/external/tournaments/[id]/players/route.ts` | 🆕 Nouveau |
| 3 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🆕 Nouveau |
| 4 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🆕 Nouveau |
| 5 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🆕 Nouveau |
| 6 | Redondance | 🟡 Mineur | `getIp()` dupliquée dans 6 fichiers | 🆕 Nouveau |
| 7 | Couverture tests | 🟡 Mineur | `app/api/admin/groups/pinned`, `app/api/admin/groups/[id]/pin`, `app/api/admin/users/[id]/memo` | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (376 lignes) | 🔁 Persistant |
| 9 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (328 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 15 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |
| 16 | Fetch directs | 🟡 Mineur | `components/tournament/Tournament.tsx` (8 useEffect/fetch) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-05-25

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | `getAdminSession` — primitive d'auth parallèle (🟠 Important) | ✅ Supprimé — `requireAdminSession` uniformisé sur 28 routes |
| B | `connectToMongoDB()` redondant dans `fetchRound/route.ts` et `fetchTournament/route.ts` (🟡 Mineur) | ✅ Corrigé |
| C | `StatsTab.tsx` god component 433 lignes (🟡 Mineur) | ✅ Réduit à 108 lignes, builders extraits, hook `useTournamentStats` créé |
| D | `/api/tournaments/[id]/stats` — seule route non testée (🟡 Mineur) | ✅ 8 cas de test ajoutés dans `tournament-stats.test.ts` |

---

## 1. Sécurité

### 1.1 Rate limiting manquant sur `/api/guest/validate` (CRITIQUE)

**Fichier :** `app/api/guest/validate/route.ts`

**Problème :** Cette route POST publique crée un compte utilisateur (`isGuest: true`) et une session. Elle n'a aucun rate limiting par IP, contrairement aux autres endpoints d'inscription du projet.

```typescript
// app/api/guest/validate/route.ts — extrait
export async function POST(request: NextRequest) {
  const { token, username, email, password } = await request.json();
  // ... aucun checkRateLimit() ...
  const user = await UserRepository.create({
    username: trimmedUsername, email: trimmedEmail, passwordHash, role: 'USER', isGuest: true,
  });
```

**Comparaison avec les endpoints similaires :**
- `/api/auth/forgot-password` → `checkRateLimit('forgot-password:${ip}')` ✅
- `/api/invitations/[token]` → `checkRateLimit('register-invite:${ip}')` ✅
- `/api/access-requests` → `checkRateLimit('access-request:${ip}')` ✅
- `/api/guest/validate` → ❌ aucun rate limiting

**Risque :** Un attaquant peut spammer des créations de comptes invités en boucle (épuisement des username, pollution de la base, charge CPU sur le hachage Argon2id).

**Correction :**
```typescript
// Ajouter après la résolution de l'IP, avant la validation du token
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
const rl = checkRateLimit(`guest-validate:${ip}`);
if (!rl.allowed) {
  return ApiResponse.tooManyRequests(`Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} minute(s).`);
}
```

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant dans deux nouvelles routes (MINEUR)

**Fichiers :**
- `app/api/groups/[id]/tournaments/[tid]/api-tokens/route.ts` — lignes 6, 18, 42
- `app/api/external/tournaments/[id]/players/route.ts` — lignes 2, 19

Ces deux routes appellent `connectToMongoDB()` directement avant d'invoquer des repositories qui gèrent déjà leur propre connexion en interne. C'est la même violation corrigée la semaine dernière dans `fetchRound` et `fetchTournament`.

```typescript
// api-tokens/route.ts — connectToMongoDB() redondant (ligne 18)
await connectToMongoDB();                                 // ← redondant
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId); // appelle aussi connectToMongoDB()

// external/.../players/route.ts — connectToMongoDB() redondant (ligne 19)
await connectToMongoDB();                                 // ← redondant
const apiToken = await ApiTokenRepository.findByRawToken(rawToken); // appelle aussi connectToMongoDB()
```

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` et les appels `await connectToMongoDB()` dans les deux routes.

---

## 3. Redondances

### 3.1 Fonction `getIp()` dupliquée dans 6 fichiers (MINEUR)

Le même one-liner d'extraction d'IP est copié-collé dans 6 fichiers :

| Fichier | Ligne | Forme |
|--------|-------|-------|
| `app/api/auth/login/route.ts` | 11–13 | `function getIp(req)` |
| `app/api/auth/forgot-password/route.ts` | 9–11 | `function getIp(req)` |
| `app/api/access-requests/route.ts` | 9–11 | `function getIp(req)` |
| `app/api/auth/reset-password/[token]/route.ts` | 27 | inline |
| `app/api/invitations/[token]/route.ts` | 36 | inline |
| `app/api/guest/validate/route.ts` | 60 | inline |

**Correction :** Extraire dans `src/lib/auth/getIp.ts` (déjà le bon répertoire pour les primitives d'auth) :

```typescript
// src/lib/auth/getIp.ts
import type { NextRequest } from 'next/server';
export function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
```

---

## 4. God components

Le projet compte désormais **10 composants > 300 lignes**, soit +5 par rapport à l'audit du 25 mai. Les nouveaux composants (admin groupes, admin users, page tournois) ont été développés sans découpage préventif.

### 4.1 `GroupDetailClient.tsx` (admin) — 480 lignes (NOUVEAU)

**Fichier :** `components/admin/groups/GroupDetailClient.tsx`

Ce composant admin cumule : gestion du pin/unpin d'un groupe, modification du message d'info, gestion des membres (invitation, suppression, merge de tournois), gestion des tournois du groupe, affichage des invitations en attente, et ouverture de 4 modales distinctes.

**Découpage suggéré :**
- Extraire `GroupMembersPanel` (section membres + invitation)
- Extraire `GroupTournamentsPanel` (section tournois)
- Extraire la logique pin/infoMessage dans deux hooks locaux `useGroupPin()` et `useGroupInfoMessage()`

### 4.2 `TournamentsPageClient.tsx` — 375 lignes (NOUVEAU)

**Fichier :** `components/tournament/TournamentsPageClient.tsx`

Rendu de la liste des tournois personnels, archivés, par groupe, et invités. Les sections collapsibles imbriquées augmentent la complexité. La logique d'affichage conditionnel des tours guidés Driver.js est mélangée avec le rendu.

**Découpage suggéré :** Extraire `InvitedTournamentsSection`, `GroupTournamentSection` comme sous-composants.

### 4.3 `UserDetailClient.tsx` (admin) — 315 lignes (NOUVEAU)

**Fichier :** `components/admin/users/UserDetailClient.tsx`

Gestion admin d'un utilisateur (modification rôle, reset password, révocation sessions, mémo privé). Stable pour l'instant mais à surveiller lors des prochaines features.

### 4.4 God components persistants (à surveiller)

| Composant | Lignes | Tendance |
|-----------|-------|---------|
| `components/tournament/Tournament.tsx` | 376 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/match/MatchModal.tsx` | 328 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable (+3 vs audit précédent) |

---

## 5. Couverture de tests

### 5.1 Nouvelles routes admin sans tests (MINEUR)

Trois routes créées pour les features récentes (pin de groupe, mémo admin) n'ont pas de tests d'intégration :

| Route | Méthode(s) | Feature |
|-------|-----------|---------|
| `app/api/admin/groups/pinned/route.ts` | GET | Récupérer le groupe épinglé |
| `app/api/admin/groups/[id]/pin/route.ts` | POST, DELETE | Épingler / désépingler un groupe |
| `app/api/admin/users/[id]/memo/route.ts` | GET, PUT | Mémo admin privé sur un utilisateur |

Ces routes contiennent de la logique de gestion d'état (un seul groupe peut être épinglé à la fois, validation de longueur du mémo) qui mérite d'être testée.

**Cas prioritaires pour `/api/admin/groups/pinned` et `/admin/groups/[id]/pin` :**
- Épingler un groupe → `findPinned()` retourne ce groupe
- Épingler un nouveau groupe dépingle l'ancien
- Désépingler → `findPinned()` retourne null

**Cas prioritaires pour `/api/admin/users/[id]/memo` :**
- GET retourne null si aucun mémo
- PUT crée / met à jour le mémo (upsert)
- PUT rejette un contenu vide ou > 2000 caractères

---

## 6. Dette TypeScript persistante

### 6.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 167 (4 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages)

Ces `any` sont utilisés pour typer des pipelines d'agrégation MongoDB. Ils sont fonctionnellement corrects. Le type Mongoose `PipelineStage[]` (depuis `mongoose` v7) permettrait de supprimer ces `any` tout en gardant la validation TypeScript :

```typescript
// Au lieu de :
const pipeline: any[] = [{ $match: ... }];

// Utiliser :
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger dans le sprint en cours

1. **Ajouter rate limiting sur `/api/guest/validate`** — 5 lignes à ajouter, pattern identique aux autres routes d'inscription.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Supprimer les `connectToMongoDB()` redondants dans `api-tokens/route.ts` et `external/.../players/route.ts`.
3. Centraliser `getIp()` dans `src/lib/auth/getIp.ts` — évite les divergences futures.
4. Ajouter tests pour les routes admin `pin` et `memo`.
5. Découper `GroupDetailClient.tsx` (admin, 480 lignes) lors de la prochaine feature admin.
6. Typer les pipelines MongoDB avec `PipelineStage[]` (suppression des 7 `any`).
