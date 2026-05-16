# Audit de dette technique — 2026-05-16

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-05-16

---

## Résumé exécutif

Comparé à l'audit du 2026-05-11, la dette la plus critique (repositories manquants, routes admin sans couverture de test) a été significativement réduite : les repositories `UserRepository`, `PasswordResetRepository`, `AuditLogRepository` existent désormais, et 27 suites de tests couvrent la majorité des routes. Il reste cependant **deux violations architecturales persistantes** : plusieurs routes auth et user contournent les repositories en appelant directement les modèles Mongoose (`UserModel.findOne()`, `PasswordResetModel`), et l'endpoint `/api/admin/groups` utilise une authentification manuelle au lieu de `getAuthSession()`. Sur le plan frontend, le composant `TournamentsPageClient.tsx` (572 lignes) concentre trop de responsabilités, et 35+ appels `fetch()` sont disséminés dans les composants au lieu de passer par les hooks dédiés. La dette technique résiduelle comprend 3 fichiers JavaScript non migrés en TypeScript, 10 `as any` dans `Tournament.tsx`, et 4 `console.error`/`console.log` en production. La couverture de tests est solide mais présente deux lacunes notables : `/api/auth/refresh` (mécanisme critique du sliding window session) et `/api/feedback` sont entièrement sans test.

---

## Tableau de synthèse

| # | Catégorie | Fichier(s) concerné(s) | Criticité |
|---|-----------|------------------------|-----------|
| 1 | Violation architecture | `app/api/auth/login/route.ts`, `me/route.ts` | 🔴 Critique |
| 2 | Violation architecture | `app/api/auth/forgot-password/route.ts` | 🔴 Critique |
| 3 | Violation architecture | `app/api/user/profile/route.ts`, `password/route.ts` | 🔴 Critique |
| 4 | Violation architecture | `app/api/feedback/route.ts` | 🟠 Important |
| 5 | Violation architecture | `app/api/admin/groups/route.ts` (auth manuelle) | 🟠 Important |
| 6 | Violation architecture | Logique métier dans composants React | 🟠 Important |
| 7 | Redondance | Debounce manuel dans 2 composants malgré hook existant | 🟠 Important |
| 8 | Redondance | `fetch()` direct dans 20+ composants | 🟡 Mineur |
| 9 | Redondance | `countDocuments() > 0` pour vérification d'existence (8 repos) | 🟡 Mineur |
| 10 | Redondance | Nommage inconsistant `findWithFilters` vs `findAll` | 🟡 Mineur |
| 11 | Dette technique | `constants/index.js`, `lib/api/fetchRound.js`, `lib/api/fetchTournament.js` | 🟠 Important |
| 12 | Dette technique | 10× `as any` dans `components/tournament/Tournament.tsx` | 🟠 Important |
| 13 | Dette technique | `console.error`/`console.log` dans 4 fichiers de production | 🟡 Mineur |
| 14 | Dette technique | God component `TournamentsPageClient.tsx` (572 lignes) | 🟡 Mineur |
| 15 | Couverture tests | `/api/auth/refresh` — aucun test | 🔴 Critique |
| 16 | Couverture tests | `/api/feedback`, `/api/user/onboarding` — aucun test | 🟠 Important |

---

## 1. Violations d'architecture

### 1.1 Requêtes Mongoose directes dans les routes auth et user

**Principe violé :** *"Accès MongoDB exclusivement via les repositories (`src/repositories/db/`) — jamais de requêtes Mongoose directes dans les routes ou services."*

Ces 5 fichiers importent directement des modèles Mongoose et exécutent des requêtes sans passer par les repositories correspondants (`UserRepository`, `PasswordResetRepository`).

#### `app/api/auth/login/route.ts`

```typescript
// Ligne 3 — import direct
import UserModel from '@models/User';
// Ligne 22 — requête directe
const user = await UserModel.findOne({ username: username?.toLowerCase() });
```

**Correction :** Utiliser `UserRepository.findByUsername(username)`. Si la méthode n'existe pas encore, l'ajouter au repository.

#### `app/api/auth/me/route.ts`

```typescript
// Lignes 3, 5-6 — imports directs + auth manuelle au lieu de getAuthSession()
import UserModel from '@models/User';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
// Lignes 9-20 — authentification manuelle en 3 étapes
const val = request.cookies.get('session')?.value;
const parsed = await verifyCookie(val);
const session = await getSession(parsed.sessionId);
const user = await UserModel.findById(session.userId).select('username role').lean();
```

**Double problème :** Auth manuelle (devrait utiliser `getAuthSession()`) et requête Mongoose directe (devrait utiliser `UserRepository.findById()`).

#### `app/api/auth/forgot-password/route.ts`

```typescript
// Lignes 4-5 — imports directs
import UserModel from '@models/User';
import PasswordResetModel from '@models/PasswordReset';
// Lignes 18, 26, 31, 37 — 4 requêtes directes
const user = await UserModel.findOne({ email: email.toLowerCase() });
await PasswordResetModel.updateMany(...)
const reset = new PasswordResetModel(...)
await reset.save();
```

**Correction :** Utiliser `UserRepository.findByEmail()` et `PasswordResetRepository` (create, invalidatePrevious).

#### `app/api/user/profile/route.ts`

```typescript
// Ligne 3 — import direct
import UserModel from '@models/User';
// Lignes 26, 34, 45 — 3 requêtes directes
const existing = await UserModel.findOne({ username: ..., _id: { $ne: auth.userId } });
const existing = await UserModel.findOne({ email: ..., _id: { $ne: auth.userId } });
const user = await UserModel.findByIdAndUpdate(auth.userId, update, { new: true })...
```

**Correction :** Ajouter `UserRepository.existsByUsernameExcluding(username, excludeId)` et `UserRepository.update(userId, fields)`.

#### `app/api/user/password/route.ts`

```typescript
// Ligne 3 — import direct
import UserModel from '@models/User';
// Lignes 24, 31 — requêtes directes
const user = await UserModel.findById(auth.userId);
await user.save();
```

**Correction :** Utiliser `UserRepository.findById()` et `UserRepository.updatePassword()` (méthode qui existe déjà selon le CLAUDE.md).

#### `app/api/feedback/route.ts`

```typescript
// Ligne 5 — import direct
import UserModel from '@models/User';
// Ligne 21 — requête directe pour récupérer le username
const user = await UserModel.findById(session.userId).select('username').lean();
```

**Correction :** Utiliser `UserRepository.findById(session.userId)`. La session contient déjà `userId` ; si le username n'est pas dans la session, l'ajouter à `getAuthSession()` ou utiliser le repository.

---

### 1.2 Authentification manuelle contournant `getAuthSession()`

**Principe violé :** *"Utiliser `getAuthSession(request)` pour l'auth dans les routes API — ne pas lire `x-user-id` / `x-user-role` directement."*

#### `app/api/admin/groups/route.ts`

```typescript
// Lignes 5-6 — imports auth manuels
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
// Lignes 11-17 — 4 étapes manuelles au lieu d'un seul appel
const val = request.cookies.get('session')?.value;
if (!val) return ApiResponse.unauthorized();
const parsed = await verifyCookie(val);
if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return ApiResponse.unauthorized();
await connectToMongoDB();
const session = await getSession(parsed.sessionId);
if (!session) return ApiResponse.unauthorized();
// Ligne 19 — requête Mongoose directe
const groups = await GroupModel.find().sort({ name: 1 }).select('_id name').lean();
```

**Triple problème :** auth manuelle, `GroupModel` direct (devrait être `GroupRepository.findAll()` ou méthode similaire), et duplication d'une logique de vérification de rôle déjà encapsulée dans `getAuthSession()`.

**Correction :**
```typescript
const auth = await getAuthSession(request);
if (!auth || !hasRole(auth.role, 'ADMIN')) return ApiResponse.forbidden();
// puis déléguer à un repository ou méthode de GroupRepository
```

#### `app/api/auth/me/route.ts`

Même pattern qu'exposé en 1.1 — auth en 3 étapes manuelles au lieu de `getAuthSession()`.

---

### 1.3 Logique métier dans les composants React

**Principe violé :** *"Pas de logique métier dans les composants React — les composants sont purement présentationnels."*

#### `components/groups/GroupTournaments.tsx` (lignes 84-92)

```typescript
const stats = conflicts.reduce((acc, c) => {
  const key = String(c.tournamentId);
  if (!acc[key]) acc[key] = { conflicts: 0, uncertainties: 0 };
  if (c.status === 'UNCERTAINTY') acc[key].uncertainties++;
  else acc[key].conflicts++;
  return acc;
}, {} as Record<string, { conflicts: number; uncertainties: number }>);
```

**Problème :** Agrégation métier inlinée dans le composant. Devrait être dans un hook custom (`useGroupConflictStats`) ou dans une fonction utilitaire dans `src/domain/rules/`.

#### `components/tournament/TournamentsPageClient.tsx` (lignes 216-223)

```typescript
const existingIds = new Set(userTournaments.map((t) => t.tournamentId));
const newTournamentIds = selectedTournaments
  .filter((id) => !existingIds.has(id))
  .map((id) => Number(id));
```

**Problème :** Logique de diff de sets (détecter quels tournois ajouter vs supprimer) dans le composant. Devrait être dans un hook.

#### `components/match/MatchModal.tsx` (lignes 1-90)

Le reducer `matchReducer` est entièrement défini dans le fichier du composant, incluant la logique de transition d'état des decks. À externaliser dans `src/hooks/useMatchState.ts` ou `src/domain/rules/`.

---

## 2. Redondances

### 2.1 Debounce manuel dupliqué malgré le hook `useDebounce` existant

`src/hooks/useDebounce.ts` est un hook propre et typé disponible dans le projet. Pourtant il est réimplémenté manuellement dans 2 composants :

#### `components/tournament/PlayersTab.tsx` (lignes 49-51)

```typescript
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);
```

**Correction :**
```typescript
const debouncedSearch = useDebounce(search, 300);
```
(supprimer l'état `debouncedSearch` et l'effet)

#### `components/tournament/TournamentSearchBar.tsx` (lignes 52-76)

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// ...
if (debounceRef.current) clearTimeout(debounceRef.current);
debounceRef.current = setTimeout(() => search(query), 300);
```

**Correction :** Utiliser `useDebounce(query, 300)` et déclencher `search` via un `useEffect` sur la valeur debouncée.

---

### 2.2 Appels `fetch()` directs dans les composants (35+ occurrences)

`src/hooks/useFetch.ts` fournit un hook standardisé pour les requêtes GET. Pour les mutations (POST/PUT/PATCH/DELETE), les composants font directement des `fetch()` sans gestion d'erreur unifiée ni état de chargement centralisé.

**Fichiers les plus impactés :**

| Fichier | Occurrences `fetch()` | Nature |
|---------|----------------------|--------|
| `components/tournament/TournamentsPageClient.tsx` | 6 | archivage, restauration, assignation groupe |
| `components/groups/GroupDetail.tsx` | 3 | gestion membres |
| `components/groups/GroupTournaments.tsx` | 3 | conflits, suppression |
| `components/tournament/TournamentSearchBar.tsx` | 4 | recherche, linking |
| `components/groups/AddTournamentModal.tsx` | 2 | chargement + ajout |
| `components/groups/InviteMemberModal.tsx` | 2 | recherche + invitation |
| `components/groups/ExternalAccessModal.tsx` | 2 | recherche + accès |

**Recommandation :** Créer un hook `useApiMutation(url, method)` ou un utilitaire `apiFetch` (qui semble déjà exister dans `src/lib/api/apiFetch.ts`) pour centraliser gestion des erreurs HTTP, état loading, et affichage toast. À court terme, vérifier que `apiFetch.ts` est utilisé là où il devrait l'être.

---

### 2.3 `countDocuments() > 0` pour vérification d'existence (8 repositories)

Ce pattern effectue un `COUNT(*)` MongoDB au lieu de simplement chercher un document :

```typescript
// Exemple dans GroupRepository.ts lignes 86, 95
return (await GroupModel.countDocuments({ _id: groupId, 'members.userId': userId })) > 0;
```

MongoDB doit scanner potentiellement tous les résultats pour compter. Le pattern optimal est :

```typescript
return (await GroupModel.exists({ _id: groupId, 'members.userId': userId })) !== null;
// ou
return (await GroupModel.findOne(query, { _id: 1 }).lean()) !== null;
```

**Repositories concernés :** `GroupRepository.ts` (×2), `GroupInvitationRepository.ts`, `TournamentExternalAccessRepository.ts`, `GroupTournamentRepository.ts`, `InvitationRepository.ts`, `AccessRequestRepository.ts`, `UserRepository.ts` (×2), `UserTournamentRepository.ts`.

---

### 2.4 Nommage incohérent dans les repositories

Même concept (recherche paginée avec filtres optionnels), deux noms différents :

| Repository | Méthode | Cohérence |
|------------|---------|-----------|
| `InvitationRepository` | `findWithFilters()` | — |
| `FeedbackRepository` | `findAll()` | ≠ |
| `AccessRequestRepository` | `findWithFilters()` | — |
| `UserRepository` | `findWithFilters()` | — |
| `AuditLogRepository` | `findWithFilters()` | — |

De même pour les vérifications booléennes : `isMember()`, `isAdmin()`, `hasPendingInvitation()`, `hasAccess()`, `existsByUsername()`, `existsByEmail()`, `exists()` désignent tous la même sémantique (retourner un booléen).

**Recommandation :** Choisir une convention : `findWithFilters()` pour les listes paginées filtrées, `existsBy*()` pour les vérifications booléennes. Renommer `FeedbackRepository.findAll()` en `findWithFilters()` et harmoniser les `has*`/`is*` vers `existsBy*` lors du prochain refactoring.

---

## 3. Dette technique

### 3.1 Fichiers JavaScript non migrés en TypeScript

**Règle CLAUDE.md :** TypeScript mode strict activé, tout le projet en `.ts`/`.tsx`.

| Fichier | Rôle | Impact |
|---------|------|--------|
| `constants/index.js` | Exporte `FETCH_ALL_ASYNC` | Importé par d'autres fichiers TS — perd le typage |
| `lib/api/fetchRound.js` | Fonction client fetch admin | Pas de types sur les paramètres |
| `lib/api/fetchTournament.js` | Fonction client fetch admin | Pas de types sur les paramètres |

Note : `docs/migrations/roundMigration.js` est un script ponctuel de migration et peut rester en JS.

**Correction pour `constants/index.js` :**
```typescript
// constants/index.ts
export const FETCH_ALL_ASYNC = { mode: 'fetchAllAsync', perPage: 200 } as const;
```

**Correction pour `lib/api/fetchRound.js` :**
```typescript
// lib/api/fetchRound.ts
export async function fetchRound(tournamentId: number, roundId: number, options?: object): Promise<unknown> { ... }
```

---

### 3.2 Utilisation injustifiée de `as any` dans `Tournament.tsx`

**Fichier :** `components/tournament/Tournament.tsx` — **10 occurrences**

```typescript
// Lignes 72-74
const selectedRoundType: RoundType | undefined = (tournament as any)?.tournament_phases
  ?.flatMap((p: any) => p.rounds ?? [])
  .find((r: any) => String(r.id) === String(roundId))?.round_type;
// Lignes 96-97
const roundOptions = (tournament as any).tournament_phases?.flatMap((phase: any) =>
  (phase.rounds ?? []).map((round: any) => ({ ... }))
// Lignes 109, 119, 122, 172
conflicts={conflicts as any}
{(tournament as any).name}
{(tournament as any).registered_user_count}/{(tournament as any).capacity}
<DeckbuildingRound playerCount={(tournament as any)?.registered_user_count} />
```

**Cause racine :** Le type du tournoi passé en prop n'inclut pas `tournament_phases`, `registered_user_count`, `capacity`. Ces champs existent sur le modèle Mongoose `Tournament` mais ne sont probablement pas dans l'interface TypeScript de `src/types/`.

**Correction :** Mettre à jour l'interface `Tournament` dans `src/types/tournament.ts` pour inclure ces champs, puis supprimer tous les casts.

---

### 3.3 `console.error` / `console.log` en production

| Fichier | Ligne | Type | Contexte |
|---------|-------|------|----------|
| `app/api/auth/forgot-password/route.ts` | 36 | `console.error` | Échec envoi email |
| `src/hooks/useRound.ts` | 73 | `console.error` | Erreur fetch de ronde |
| `src/lib/api/responses.ts` | 32 | `console.error` | Erreur 500 serveur |
| `components/ui/FetchButton.tsx` | 45 | `console.error` | Erreur fetch bouton |

**Note :** `responses.ts:32` est le cas le plus justifiable (log côté serveur pour les erreurs 500 inattendues), mais idéalement devrait passer par un service de logging structuré en production. Les autres 3 cas devraient être supprimés ou remplacés par de la gestion d'erreur silencieuse ou remontée à l'UI.

---

### 3.4 God component `TournamentsPageClient.tsx` (572 lignes)

Ce composant cumule trop de responsabilités :
- Gestion de l'état local des tournois actifs/archivés/assignables
- Logique d'animation "flying card" avec double `requestAnimationFrame` + `setTimeout`
- Diff de sets pour calculer les tournois à ajouter/supprimer
- 6 appels `fetch()` pour archivage, restauration, assignation
- 3 sections visuelles distinctes (actifs, archivés, à ajouter)

**Découpage suggéré :**
- Extraire la logique d'état et les mutations dans un hook `useTournamentManagement()`
- Séparer la section "assignation groupe" en sous-composant `GroupTournamentAssigner`
- Externaliser l'animation dans un hook `useFlyingCardAnimation()`

---

## 4. Couverture de tests

La couverture est globalement solide avec 27 suites de tests. Les lacunes identifiées :

### 4.1 `/api/auth/refresh` — aucun test (CRITIQUE)

**Fichier :** `app/api/auth/refresh/route.ts`

C'est le mécanisme de **sliding window session** décrit dans CLAUDE.md comme critique : poll toutes les 4 minutes par `SessionGuard`, renouvellement simultané du cookie et de la session DB. Son absence de test signifie que toute régression (cookie mal émis, session non renouvelée, edge case d'expiration) passe inaperçue.

**Tests à écrire :**
- Requête avec cookie valide → renvoie 200 + cookie frais + session DB mise à jour
- Requête avec cookie invalide → renvoie 401
- Requête avec session DB expirée → renvoie 401
- Requête sans cookie → renvoie 401

### 4.2 `/api/feedback` — aucun test

**Fichier :** `app/api/feedback/route.ts`

Route de soumission de feedback utilisateur. Aucun test ne couvre :
- Validation des champs (`type`, `title`, `description`, `page`)
- Création effective en DB
- Authentification requise
- Limites de longueur (200 chars titre, 2000 chars description)

### 4.3 `/api/user/onboarding` — aucun test

**Fichier :** `app/api/user/onboarding/route.ts`

Route `POST` qui marque l'onboarding comme terminé. Bien que simple, c'est une route utilisée dans le flux de premier lancement — une régression ici (ex. mauvais userId) passerait sans alerte.

---

## Récapitulatif des priorités

### 🔴 Critique — À traiter en sprint courant

1. **Requêtes Mongoose directes dans les routes auth/user** — violations systémiques du principe repository, risque de désynchronisation si les modèles évoluent. 5 fichiers impactés.
2. **Auth manuelle dans `api/auth/me` et `api/admin/groups`** — contourne `getAuthSession()`, risque de sécurité si la logique de validation diverge.
3. **Tests manquants sur `/api/auth/refresh`** — mécanisme critique de session sans aucun filet de sécurité.

### 🟠 Important — À planifier dans les 2 prochains sprints

4. Migrer `constants/index.js`, `lib/api/fetchRound.js`, `lib/api/fetchTournament.js` en TypeScript.
5. Corriger les 10 `as any` dans `Tournament.tsx` en typant correctement l'interface `Tournament`.
6. Ajouter tests pour `/api/feedback` et `/api/user/onboarding`.
7. Externaliser la logique métier des composants (`GroupTournaments`, `TournamentsPageClient`, `MatchModal`).

### 🟡 Mineur — Opportunités d'amélioration continue

8. Remplacer le debounce manuel dans `PlayersTab.tsx` et `TournamentSearchBar.tsx` par `useDebounce`.
9. Remplacer `countDocuments() > 0` par `Model.exists()` dans 8 repositories.
10. Harmoniser le nommage `findWithFilters` vs `findAll` dans les repositories.
11. Supprimer les 3 `console.error` non nécessaires en production.
12. Découper `TournamentsPageClient.tsx` en sous-composants.
