# Audit de dette technique — 2026-09-07

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Audit précédent :** 2026-06-08

---

## Résumé exécutif

Depuis l'audit du 2026-06-08, **les 5 problèmes signalés ont été corrigés** : le rate limiting sur `/api/guest/validate`, la centralisation de `getIp()`, les tests pour les routes admin `pin/unpin` et `memo`, et le `connectToMongoDB()` redondant dans la route parente `api-tokens`. C'est un bilan de correction complet sur les items actionnables.

**Un nouveau problème de sécurité critique est identifié** : la route externe `/api/external/tournaments/[id]/players` — authentifiée par Bearer token — n'a aucun rate limiting. Un attaquant peut tester des tokens en rafale (brute-force) sans défense applicative.

**Deux nouvelles redondances de code émergent** : `NextResponse.json()` est utilisé directement dans 3 routes (`login`, `refresh`, `validate`) là où `ApiResponse.*` est la convention du projet ; 4 incohérences de nommage persistent dans les repositories. Ces deux familles de problèmes n'avaient pas été signalées dans les audits précédents.

**Les god components stagnent** : 12 composants dépassent 300 lignes (10 persistants, 2 nouveaux), dont `Tournament.tsx` (+22 lignes) et `MatchModal.tsx` (+29 lignes) qui dérivent vers 400 lignes. `Tournament.tsx` maintient 8 appels `useEffect`/`fetch()` directs au lieu des hooks dédiés.

**10 routes API n'ont pas de tests d'intégration**, dont 2 de haute criticité : le flux `magic-link` (parcours critique des accès invités) et `guests/[accessId]` (approbation + email).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|------------|------|
| 1 | Sécurité — rate limiting | 🔴 Critique | `app/api/external/tournaments/[id]/players/route.ts` | 🆕 Nouveau |
| 2 | Architecture — connectToMongoDB | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` (l.18) | 🔁 Persistant |
| 3 | Redondance — NextResponse.json | 🟠 Important | `app/api/auth/login/route.ts`, `app/api/auth/refresh/route.ts`, `app/api/guest/validate/route.ts` | 🆕 Nouveau |
| 4 | Couverture tests | 🟠 Important | `magic-link/route.ts`, `guests/[accessId]/route.ts` | 🆕 Nouveau |
| 5 | Redondance — nommage repositories | 🟡 Mineur | `InvitationRepository.ts`, `AccessRequestRepository.ts`, `GroupTournamentRepository.ts`, `TournamentPlayersDeckRepository.ts` | 🆕 Nouveau |
| 6 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 8 | Couverture tests | 🟡 Mineur | `users/search`, `admin-groups`, `member-groups`, `guest/my-tournaments`, `guests`, `admin/groups/[id]/invitations/[invId]`, `admin/users/[id]/groups`, `groups/[id]/invitations/[invId]` | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 19 | Fetch directs dans composant | 🟡 Mineur | `components/tournament/Tournament.tsx` (8 useEffect/fetch) | 🔁 Persistant |
| 20 | Dette TS — as unknown as | 🟡 Mineur | `app/admin/invitations/page.tsx`, `app/register/[token]/page.tsx`, `app/api/tournaments/[id]/players/[playerId]/comments/route.ts` | 🔁 Persistant |
| 21 | Dette TS — any pipelines | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:IP')` ajouté |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts` |
| C | Tests manquants — routes admin `pin/unpin` (🟡 Mineur) | ✅ Couverts dans `admin-groups.test.ts` |
| D | Tests manquants — route admin `memo` (🟡 Mineur) | ✅ Couvert dans `admin-users.test.ts` |
| E | `connectToMongoDB()` redondant dans `api-tokens/route.ts` (parent) (🟡 Mineur) | ✅ Supprimé |

---

## 1. Sécurité

### 1.1 Rate limiting manquant sur `/api/external/` (CRITIQUE)

**Fichier :** `app/api/external/tournaments/[id]/players/route.ts`

**Problème :** Cette route GET est authentifiée uniquement par un Bearer token (`Authorization: Bearer <rawToken>`). Elle est publique (pas de session utilisateur) et **ne dispose d'aucun rate limiting**. Un attaquant peut tester des tokens en boucle — chaque requête calcule `hashToken(raw)` en base, ce qui représente un coût CPU et une surface de brute-force réelle.

```typescript
// app/api/external/tournaments/[id]/players/route.ts
export async function GET(request: NextRequest, { params }: Params) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return ApiResponse.unauthorized('Bearer token requis');
  const rawToken = authHeader.slice(7).trim();
  // ← aucun checkRateLimit() ici
  const apiToken = await ApiTokenRepository.findByRawToken(rawToken); // hash + DB lookup
```

**Comparaison :**
| Endpoint public | Rate limiting |
|----------------|--------------|
| `/api/auth/login` | ✅ `checkRateLimit(ip)` |
| `/api/guest/validate` | ✅ `checkRateLimit('guest-validate:IP')` |
| `/api/invitations/[token]` | ✅ `checkRateLimit('register-invite:IP')` |
| `/api/external/tournaments/[id]/players` | ❌ aucun |

**Correction :**
```typescript
import { checkRateLimit } from '@/src/lib/auth/rateLimit';
import { getIp } from '@/src/lib/auth/getIp';

export async function GET(request: NextRequest, { params }: Params) {
  const rl = checkRateLimit(`ext-api:${getIp(request)}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de requêtes.');
  // ... suite du handler
```

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (IMPORTANT)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts`  
**Ligne :** 18

```typescript
const auth = await getAuthSession(request); // → appelle getSession() → connectToMongoDB() en interne
// ...
await connectToMongoDB(); // ← ligne 18 : redondant
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
```

`getAuthSession` appelle `getSession()` dans `src/lib/auth/session.ts` qui appelle lui-même `connectToMongoDB()`. L'appel explicite ligne 18 est superflu. La route parente (`api-tokens/route.ts`) a été corrigée dans l'audit précédent ; cette sous-route n'a pas été incluse dans la correction.

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` et `await connectToMongoDB()` à la ligne 18.

---

## 3. Redondances

### 3.1 `NextResponse.json()` utilisé directement au lieu d'`ApiResponse` (IMPORTANT)

**Fichiers :**  
- `app/api/auth/login/route.ts` — lignes 15, 21, 30, 37  
- `app/api/auth/refresh/route.ts` — ligne 12  
- `app/api/guest/validate/route.ts` — ligne 69

Le projet utilise `ApiResponse` (via `src/lib/api/responses.ts`) comme convention uniforme pour les réponses HTTP. Ces 3 routes utilisent `NextResponse.json()` directement, créant une incohérence sans bénéfice fonctionnel.

```typescript
// app/api/auth/login/route.ts — incohérent
if (!rl.allowed) return NextResponse.json({ error: 'Trop de tentatives.' }, { status: 429 });
// ↓ devrait être :
if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de tentatives.');

// app/api/auth/refresh/route.ts — incohérent
const res = NextResponse.json({}, { status: 200 });
// ↓ devrait être :
const res = ApiResponse.ok({});

// app/api/guest/validate/route.ts — incohérent
const response = NextResponse.json({ tournamentId: ..., groupId: ... });
// ↓ devrait être :
const response = ApiResponse.ok({ tournamentId: ..., groupId: ... });
```

**Note :** `login/route.ts` et `refresh/route.ts` utilisent `.cookies.set()` sur la réponse, ce qui est compatible avec `ApiResponse.ok()` car celui-ci retourne un `NextResponse`.

### 3.2 Incohérences de nommage dans les repositories (MINEUR)

Quatre incohérences de nommage ont été identifiées, toutes dans des repositories existants.

#### a. `findPendingByEmail()` retourne un `boolean` (2 fichiers)

Le préfixe `find` implique un retour d'entité. Or ces méthodes retournent un booléen d'existence :

| Fichier | Méthode actuelle | Convention cohérente |
|---------|-----------------|---------------------|
| `src/repositories/db/InvitationRepository.ts` L.46 | `findPendingByEmail(email): Promise<boolean>` | `existsPendingByEmail` |
| `src/repositories/db/AccessRequestRepository.ts` L.10 | `findPendingByEmail(email): Promise<boolean>` | `existsPendingByEmail` |

Comparaison avec les patterns corrects du même codebase : `UserRepository.existsByEmail()`, `UserRepository.existsByUsername()`, `GroupInvitationRepository.hasPendingInvitation()`, `GroupTournamentRepository.hasAccess()`.

#### b. `GroupTournamentRepository` : `add/remove` au lieu de `create/delete`

| Méthode actuelle | Convention attendue |
|-----------------|---------------------|
| `add(groupId, tournamentId, addedBy)` | `create(...)` |
| `remove(groupId, tournamentId)` | `delete(...)` ou `deleteByGroupAndTournament(...)` |

Tous les autres repositories (GroupRepository, UserTournamentRepository, TournamentConflictRepository, etc.) utilisent `create` et `delete`/`deleteBy*`.

#### c. `InvitationRepository.cancel()` vs le pattern `mark*`

`cancel(id)` effectue une transition d'état vers `CANCELLED`. Dans le même fichier, les transitions similaires s'appellent `markExpired(id)` et `markUsed(id)`. La méthode devrait s'appeler `markCancelled(id)` par cohérence.

#### d. `TournamentPlayersDeckRepository` : mélange `find` et `get`

Les méthodes `getScoutingStats()` et `getDetailedScoutingStats()` utilisent le préfixe `get`, non utilisé dans les 21 autres repositories (qui utilisent tous `find`). Ces méthodes devraient être renommées `findScoutingStats()` et `findDetailedScoutingStats()`.

---

## 4. Couverture de tests

### 4.1 Routes critiques sans tests (IMPORTANT)

Deux routes de haute criticité n'ont aucune couverture :

#### `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` (GET/POST/DELETE)

Le magic link est le point d'entrée du flux invité. Il gère la génération et la révocation de tokens UUID. Sans tests, la logique de désactivation de l'ancien lien avant d'en créer un nouveau n'est pas vérifiée.

Cas prioritaires :
- POST : création d'un magic link → retourne token UUID
- POST : création d'un second lien → désactive le premier (`isActive = false`)
- DELETE : désactivation → `findByToken` retourne null
- GET sans être admin → 403
- GET non authentifié → 401

#### `app/api/groups/[id]/guests/[accessId]/route.ts` (PATCH)

Cette route approuve un accès invité (transition `PENDING → ACCEPTED`) et envoie un email (`sendGuestApprovedEmail`). C'est de la logique métier non triviale.

Cas prioritaires :
- PATCH par un admin → status passe à ACCEPTED
- PATCH par un non-admin → 403
- PATCH sur un accès déjà REVOKED → comportement à définir/tester
- Email envoyé sur succès (mock)

### 4.2 Routes de criticité moyenne/faible sans tests (MINEUR)

| Route | Méthodes | Remarque |
|-------|----------|---------|
| `app/api/users/search/route.ts` | GET | Requête `q` < 3 chars → 400 ; retour masqué sans hash |
| `app/api/guest/my-tournaments/route.ts` | GET | Tournois accessibles à l'invité connecté |
| `app/api/admin/users/[id]/groups/route.ts` | POST | Ajout d'un user dans plusieurs groupes |
| `app/api/admin/groups/[id]/invitations/[invId]/route.ts` | DELETE | Annulation d'invitation par admin |
| `app/api/groups/[id]/invitations/[invId]/route.ts` | DELETE | Annulation d'invitation par membre |
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | GET | Liste des invités du groupe |
| `app/api/tournaments/[id]/admin-groups/route.ts` | GET | Groupes où l'user est admin |
| `app/api/tournaments/[id]/member-groups/route.ts` | GET | Groupes où l'user est membre |

---

## 5. God components

Le projet compte **12 composants dépassant 300 lignes** (stable par rapport à l'audit précédent, mais 2 nouveaux franchissent le seuil et 2 existants continuent de grossir).

### 5.1 Nouveaux composants franchissant le seuil

| Composant | Lignes | Raison probable |
|-----------|--------|----------------|
| `components/tournament/PlayerDeckModal.tsx` | **309** | Feature "quick confirm" + sélection d'encres |
| `components/round/Round.tsx` | **304** | Logique scouting + filtres + pagination inline |

### 5.2 God components qui grossissent

| Composant | Lignes (actuel) | Lignes (audit 06-08) | Évolution |
|-----------|----------------|---------------------|-----------|
| `components/tournament/Tournament.tsx` | **398** | 376 | **+22** |
| `components/match/MatchModal.tsx` | **357** | 328 | **+29** |

`Tournament.tsx` maintient par ailleurs **8 appels `useEffect` + `fetch()` directs** pour du chargement de données, là où le hook `useFetch` (déjà importé dans le fichier) devrait être utilisé. C'est une violation de la règle CLAUDE.md ("Appels fetch() directs dans les composants au lieu des hooks dédiés").

### 5.3 God components persistants stables

| Composant | Lignes |
|-----------|--------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 |
| `components/tournament/TournamentsPageClient.tsx` | 375 |
| `components/groups/GroupDetail.tsx` | 356 |
| `components/tournament/PlayersTab.tsx` | 342 |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 |
| `components/groups/GroupTournaments.tsx` | 319 |
| `components/ui/PlayerCommentHistory.tsx` | 317 |
| `components/admin/users/UserDetailClient.tsx` | 315 |

---

## 6. Dette TypeScript

### 6.1 Casts `as unknown as` — types `Populated` manquants (MINEUR)

Trois points d'usage dans les Server Components castent des résultats Mongoose peuplés sans type dédié :

| Fichier | Ligne | Cast | Cause |
|---------|-------|------|-------|
| `app/admin/invitations/page.tsx` | 41–42 | `inv.invitedBy as unknown as { username: string }` et `inv.groupIds as unknown as { _id: unknown; name: string }[]` | Absence de type `InvitationPopulated` |
| `app/register/[token]/page.tsx` | 41 | `invitation.groupIds as unknown as Array<{ _id: …; name: string }>` | Même cause |
| `app/api/tournaments/[id]/players/[playerId]/comments/route.ts` | 47 | `c.authorId as unknown as { _id: string }` | Absence de type union post-`.populate()` |

**Correction :** Définir dans `src/types/` :
```typescript
// src/types/invitation.ts
export type InvitationPopulated = Omit<Invitation, 'invitedBy' | 'groupIds'> & {
  invitedBy: { username: string } | null;
  groupIds: { _id: string; name: string }[];
};
```

### 6.2 `any` dans les pipelines MongoDB (MINEUR — justifiable)

**Fichiers :** `src/repositories/db/RoundRepository.ts` (4 occurrences), `src/repositories/db/TournamentPlayersDeckRepository.ts` (3 occurrences)

Ces `any` sont justifiés (pipelines d'agrégation MongoDB, contraintes Mongoose). Chaque occurrence est commentée `// eslint-disable-next-line @typescript-eslint/no-explicit-any`. Le type `PipelineStage[]` de Mongoose permettrait d'éliminer ces `any` mais nécessite une migration non prioritaire.

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger en priorité absolue

1. **Rate limiting sur `/api/external/tournaments/[id]/players`** — 3 lignes à ajouter, même pattern que `guest/validate` après correction.

### 🟠 Important — À corriger dans le sprint en cours

2. **`connectToMongoDB()` redondant** dans `api-tokens/[tokenId]/route.ts` ligne 18 — 2 lignes à supprimer.
3. **`NextResponse.json()` → `ApiResponse`** dans `login`, `refresh`, `validate` — homogénéisation nécessaire.
4. **Tests d'intégration** pour `magic-link` et `guests/[accessId]` — flux critiques non couverts.

### 🟡 Mineur — Opportunités d'amélioration continue

5. Renommer les méthodes incohérentes dans `InvitationRepository`, `AccessRequestRepository`, `GroupTournamentRepository`, `TournamentPlayersDeckRepository`.
6. Découper `Tournament.tsx` : extraire les 8 `useEffect`/`fetch()` en hooks dédiés `useTournamentConflicts()`, `useLastRound()`, etc.
7. Définir `InvitationPopulated` et équivalents dans `src/types/` pour éliminer les casts `as unknown as`.
8. Ajouter tests pour les 8 routes de criticité moyenne/faible non couvertes.
9. Surveiller `Tournament.tsx` (+22) et `MatchModal.tsx` (+29) qui approchent des 400 lignes.
