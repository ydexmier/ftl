# Audit de dette technique — 2026-05-19

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-05-19

---

## Résumé exécutif

Comparé à l'audit du 2026-05-16, la progression est **majeure** : la quasi-totalité des violations critiques et importantes ont été corrigées. Les 5 routes auth/user qui contournaient les repositories via des requêtes Mongoose directes sont désormais conformes. L'authentification manuelle dans `admin/groups` et `auth/me` a été remplacée par `getAuthSession()`. Les 3 fichiers JavaScript ont été migrés en TypeScript, les 10 `as any` de `Tournament.tsx` ont disparu, et les debounces manuels utilisent maintenant `useDebounce`. La logique métier dans les composants (`GroupTournaments`, `TournamentsPageClient`, `MatchModal`) a été extraite vers des fonctions de domaine et des hooks. Les tests critiques manquants (`/api/auth/refresh`, `/api/feedback`, `/api/user/onboarding`) sont maintenant couverts — la couverture globale est passée à 47 fichiers de test.

Il reste **trois nouvelles failles de sécurité** — toutes sur le rate limiting des endpoints publics mutables — qui n'étaient pas signalées précédemment : `/api/auth/forgot-password`, `/api/auth/reset-password/[token]` et `/api/invitations/[token]` peuvent être appelés sans restriction, permettant respectivement un email bombing et un brute-force de tokens. Un bug fonctionnel a également été identifié dans `DeleteTournamentButton.tsx` (callback `onDeleted` toujours appelé avec `undefined`). La dette mineure résiduelle porte sur un God component admin (478 lignes) et deux routes récentes sans tests.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité | 🔴 Critique | `app/api/auth/forgot-password/route.ts` | 🆕 Nouveau |
| 2 | Sécurité | 🟠 Important | `app/api/auth/reset-password/[token]/route.ts` | 🆕 Nouveau |
| 3 | Sécurité | 🟠 Important | `app/api/invitations/[token]/route.ts` | 🆕 Nouveau |
| 4 | Dette technique | 🟠 Important | `components/tournament/DeleteTournamentButton.tsx` | 🆕 Nouveau |
| 5 | Validation | 🟠 Important | 10+ routes admin (users, groups, invitations) | 🆕 Nouveau |
| 6 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (478 lignes) | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (314 lignes) | 🆕 Nouveau |
| 8 | Couverture tests | 🟡 Mineur | `/api/tournaments/[id]/last-round`, `/api/tournaments/[id]/comment-counts` | 🆕 Nouveau |
| 9 | Logique dans composant | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (animation flyingCard) | 🔁 Persistant |
| 10 | Fetch directs | 🟡 Mineur | 50+ occurrences dans les composants | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-05-16

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Requêtes Mongoose directes dans 5 routes auth/user | ✅ Corrigé |
| B | Auth manuelle dans `auth/me` et `admin/groups` | ✅ Corrigé |
| C | Debounce manuel dans `PlayersTab.tsx` et `TournamentSearchBar.tsx` | ✅ Corrigé |
| D | Fichiers JS non migrés (`constants/index.js`, `fetchRound.js`, `fetchTournament.js`) | ✅ Corrigé |
| E | 10 `as any` dans `Tournament.tsx` | ✅ Corrigé |
| F | `console.error` dans forgot-password, useRound, FetchButton | ✅ Corrigé |
| G | Logique `reduce()` dans `GroupTournaments.tsx` | ✅ Extrait vers `countConflictsByTournament()` dans `domain/rules` |
| H | Logique `existingIds/Set` dans `TournamentsPageClient.tsx` | ✅ Retirée |
| I | Reducer `matchReducer` dans `MatchModal.tsx` | ✅ Extrait vers hook `useMatchState` |
| J | Tests manquants sur `/api/auth/refresh` | ✅ `auth-refresh.test.ts` ajouté |
| K | Tests manquants sur `/api/feedback` et `/api/user/onboarding` | ✅ `feedback.test.ts`, `user-profile.test.ts` |
| L | `countDocuments() > 0` pour checks booléens (GroupRepository, UserRepository) | ✅ Migré vers `Model.exists()` |
| M | Nommage `FeedbackRepository.findAll()` vs `findWithFilters()` | ✅ Harmonisé |

---

## 1. Sécurité

### 1.1 Absence de rate limiting sur `/api/auth/forgot-password` (CRITIQUE)

**Fichier :** `app/api/auth/forgot-password/route.ts`

**Problème :** Cet endpoint public (`POST` sans auth) ne limite pas le nombre d'appels par IP. Un attaquant peut appeler cet endpoint en boucle avec l'email d'une victime pour :
1. Inonder sa boîte mail de liens de réinitialisation
2. Déclencher des coûts sur Resend en production (envois massifs)
3. Invalider en chaîne les tokens précédents via `PasswordResetRepository.invalidateForUser()`

```typescript
// app/api/auth/forgot-password/route.ts — aucun appel à checkRateLimit
export async function POST(request: NextRequest) {
  const body = await request.json();
  const v = validateForgotPasswordBody(body);
  if (!v.ok) return ApiResponse.badRequest(v.error);
  // ← pas de rate limiting ici
  const user = await UserRepository.findByEmail(v.data.email);
  ...
  await sendPasswordResetEmail(user.email, token); // email envoyé sans limite
}
```

**Correction :**
```typescript
import { checkRateLimit } from '@/src/lib/auth/rateLimit';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const rl = checkRateLimit(`forgot-password:${ip}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de tentatives. Réessayez dans 15 minutes.');
  // ...
}
```

---

### 1.2 Absence de rate limiting sur `/api/auth/reset-password/[token]` (IMPORTANT)

**Fichier :** `app/api/auth/reset-password/[token]/route.ts`

**Problème :** Le handler `POST` (qui valide le token et réinitialise le mot de passe) n'a pas de rate limiting. Bien que le token soit un UUID cryptographique, l'absence de limite permet un brute-force théorique sur des tokens courts ou prévisibles, et facilite les attaques timing sur la comparaison de tokens.

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  // ← pas de rate limiting
  const { token } = await params;
  const reset = await PasswordResetRepository.findByToken(token);
```

**Correction :**
```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
const rl = checkRateLimit(`reset-password:${ip}`);
if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de tentatives.');
```

---

### 1.3 Absence de rate limiting sur `/api/invitations/[token]` (IMPORTANT)

**Fichier :** `app/api/invitations/[token]/route.ts`

**Problème :** Le handler `POST` (inscription via token d'invitation) peut être appelé sans limite par IP. Un attaquant peut brute-forcer des tokens, ou tenter une inscription en masse.

**Correction :** Même pattern que 1.2 — ajouter `checkRateLimit('register-invite:${ip}')` en début de handler POST.

---

## 2. Dette technique

### 2.1 Bug : `(response as any).data` dans `DeleteTournamentButton.tsx`

**Fichier :** `components/tournament/DeleteTournamentButton.tsx:26`

**Problème :** `response` est un objet `Response` de l'API Fetch. Il n'a pas de propriété `.data`. Le cast `as any` masque ce bug : le callback `onDeleted` est **toujours appelé avec `undefined`** au lieu des données de réponse.

```typescript
// Code actuel — bugué
const response = await fetch('/api/admin/tournaments', { method: 'DELETE', ... });
setConfirmOpen(false);
onDeleted?.((response as any).data); // .data n'existe pas sur Response → toujours undefined
```

La route DELETE retourne `ApiResponse.ok({ message: ..., ...result })` — pour accéder à ces données il faut consommer le body avec `.json()`.

**Correction :**
```typescript
const response = await fetch('/api/admin/tournaments', { method: 'DELETE', ... });
setConfirmOpen(false);
if (response.ok) {
  const json = await response.json();
  onDeleted?.(json);
} else {
  const err = await response.json().catch(() => ({}));
  setErrorMessage(err.error ?? 'Erreur lors de la suppression');
}
```

---

## 3. Validation

### 3.1 Routes admin sans schéma de validation déclaratif

**Contexte :** `src/lib/validation.ts` centralise les schémas de validation des routes publiques et sensibles. Mais 10+ routes admin parsent `request.json()` et valident champ par champ sans schéma réutilisable.

**Fichiers impactés :**

| Route | Problème |
|-------|----------|
| `app/api/admin/users/route.ts` | `{ username, email, password, role }` — pas de validation force password, pas de validation format email |
| `app/api/admin/invitations/route.ts` | `{ emails, groupIds }` — pas de validation format email sur le tableau |
| `app/api/admin/feedback/[id]/route.ts` | `{ status }` — pas de validation contre l'enum `FeedbackStatus` |
| `app/api/admin/groups/route.ts` POST | `{ name, description }` — pas de limite de longueur sur le nom |
| `app/api/admin/groups/[id]/route.ts` PATCH | `{ name, description }` — idem |
| `app/api/admin/groups/[id]/members/[uid]/route.ts` PATCH | `{ role }` — pas de validation contre l'enum de rôles |
| `app/api/admin/groups/[id]/members/[uid]/merge-tournament/route.ts` | `{ tournamentId }` — vérifié `typeof !== 'number'` mais pas de plage |

**Impact :** Les routes admin sont protégées par RBAC (ADMIN/SUPERUSER), donc le risque de sécurité externe est faible. Mais un admin peut déclencher des comportements imprévus avec des données malformées, et la maintenance est plus difficile sans schémas centralisés.

**Recommandation :** Étendre `src/lib/validation.ts` avec des fonctions `validateAdminUser*`, `validateAdminGroup*` sur le même modèle que les fonctions existantes. Pas d'urgence mais à intégrer lors des prochains développements sur ces routes.

---

## 4. God components

### 4.1 `GroupDetailClient.tsx` — 478 lignes

**Fichier :** `components/admin/groups/GroupDetailClient.tsx`

Ce composant admin cumule :
- 3 modales inlinées (`InviteMemberModal`, `AddTournamentModal`, `MergeMemberModal` définies dans le même fichier)
- Gestion de 2 onglets (membres, tournois)
- 7 appels `fetch()` directs
- Logique de filtrage et de mise à jour d'état pour membres et tournois

**Découpage suggéré :**
- Extraire les 3 composants-modales dans des fichiers séparés sous `components/admin/groups/`
- Regrouper les handlers async dans un hook `useAdminGroupDetail(groupId)`

### 4.2 `PlayerCommentHistory.tsx` — 314 lignes

**Fichier :** `components/ui/PlayerCommentHistory.tsx`

Ce composant gère à la fois :
- Le chargement et l'affichage des commentaires (vue personnelle et groupe)
- L'édition et la suppression inline
- La création d'un nouveau commentaire
- Les différentes portées (groupe vs personnel)

**Seuil dépassé légèrement** (314 lignes vs limite 300). À surveiller lors des prochains ajouts de fonctionnalités.

---

## 5. Couverture de tests

### 5.1 Routes sans test

#### `/api/tournaments/[id]/last-round` — aucun test ❌

**Fichier :** `app/api/tournaments/[id]/last-round/route.ts`

Retourne le dernier `roundId` fetchée pour un tournoi. Utilisée par `Tournament.tsx` pour l'auto-sélection de la ronde. Cas à couvrir :
- Retourne 401 si non authentifié
- Retourne l'ID correct pour un tournoi avec des rondes
- Retourne `null` pour un tournoi sans ronde fetchée
- Retourne 400 pour un tournoi ID invalide

#### `/api/tournaments/[id]/comment-counts` — aucun test ❌

**Fichier :** `app/api/tournaments/[id]/comment-counts/route.ts`

Retourne un dictionnaire `{ [playerId]: count }` de commentaires par joueur. Utilisée pour afficher des badges dans la vue ronde. Cas à couvrir :
- Retourne 401 si non authentifié
- Retourne 403 si non-membre pour une portée groupe
- Retourne les counts corrects pour une liste de `playerIds`
- Retourne `{}` si `playerIds` est vide ou absent

---

## 6. Patterns persistants acceptés

Les éléments suivants ont été identifiés dans l'audit précédent mais sont considérés **conformes** au regard des conventions du projet :

### 6.1 `fetch()` directs dans les composants React (50+ occurrences)

Les composants client Next.js utilisent `fetch()` directement dans des `useEffect` ou des handlers. Ce pattern est accepté pour les mutations (POST/PUT/DELETE) qui ne justifient pas un hook dédié. Les requêtes GET répétées pourraient migrer vers `useFetch`, mais l'écart de qualité ne justifie pas un refactoring prioritaire.

### 6.2 `countDocuments()` pour les totaux de pagination et badges

Tous les usages restants de `countDocuments()` retournent un **nombre** (total de pages, badge count, stats) — aucun n'est utilisé pour un check booléen. Les checks booléens utilisent désormais `Model.exists()` conformément aux corrections de l'audit précédent.

### 6.3 Animation `flyingCard` dans `TournamentsPageClient.tsx`

L'animation de carte volante (portail React + `requestAnimationFrame`) reste dans le composant principal. Elle est fonctionnellement isolée via le hook `useFlyingCardAnimation` qui gère l'état, mais le rendu du portail reste dans le JSX du composant. Niveau de couplage acceptable.

---

## Récapitulatif des priorités

### 🔴 Critique — À traiter en sprint courant

1. **Rate limiting manquant sur `/api/auth/forgot-password`** — risque email bombing et surcoût Resend en production.

### 🟠 Important — À planifier dans les 2 prochains sprints

2. **Rate limiting sur `/api/auth/reset-password/[token]`** et **`/api/invitations/[token]`** — compléter la couverture des endpoints publics mutables.
3. **Bug `(response as any).data`** dans `DeleteTournamentButton.tsx` — le callback `onDeleted` reçoit toujours `undefined`.
4. **Validation déclarative** dans les routes admin — étendre `src/lib/validation.ts`.

### 🟡 Mineur — Opportunités d'amélioration continue

5. Découper `GroupDetailClient.tsx` (478 lignes) en sous-composants.
6. Ajouter tests pour `/api/tournaments/[id]/last-round` et `/api/tournaments/[id]/comment-counts`.
7. Surveiller la croissance de `PlayerCommentHistory.tsx` (314 lignes).
