# Audit de dette technique — 2026-08-31

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-08-31

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, **trois items prioritaires ont été corrigés** : le rate limiting sur `/api/guest/validate` est en place (+ import `getIp` centralisé), `getIp()` est désormais centralisée dans `src/lib/auth/getIp.ts` (importée depuis 7 routes), et les tests pour les routes admin `pin` / `memo` ainsi que `guest/validate` sont couverts.

**Ce qui stagne :** Le `connectToMongoDB()` redondant persiste dans `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts`. Les god components ne régressent pas mais s'accumulent : 12 fichiers dépassent maintenant 300 lignes (contre 10 lors du dernier audit), avec deux nouveaux entrants (`PlayerDeckModal.tsx` à 309 lignes, `Round.tsx` à 304 lignes). Les 7 `any` MongoDB persistent, légitimes mais typables.

**Nouveaux problèmes identifiés :** Un endpoint Bearer token public (`/api/external/tournaments/[id]/players`) n'a aucun rate limiting sur les authentifications échouées. Dix-sept composants effectuent des appels `fetch()` directs dans des `useEffect` alors que le hook `useFetch` existe et est disponible — incohérence structurelle croissante. Neuf routes n'ont aucun test d'intégration, dont quatre relatives aux accès invités (magic-link, guests, my-tournaments) qui concentrent de la logique d'autorisation sensible. Le projet a développé un système API tokens complet (~10 routes) et des routes d'enrichissement tournoi (~8 routes) absents de CLAUDE.md.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — rate limiting Bearer | 🟠 Important | `app/api/external/tournaments/[id]/players/route.ts` | 🆕 Nouveau |
| 2 | Tests manquants — routes invités | 🟠 Important | `magic-link`, `guests`, `my-tournaments` (4 routes) | 🆕 Nouveau |
| 3 | Fetch directs (vs useFetch) | 🟠 Important | 17 composants dont `Tournament.tsx` (7 fetch directs) | 🆕 Nouveau |
| 4 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` ligne 18 | 🔁 Persistant |
| 5 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 6 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant (aggravé) |
| 7 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 8 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Persistant (aggravé) |
| 9 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 16 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 17 | Tests manquants — routes diverses | 🟡 Mineur | `admin-groups/[id]/invitations`, `admin-users/[id]/groups`, `users/search`, `admin-groups`, `member-groups` | 🆕 Nouveau |
| 18 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant |
| 19 | console.error en production | 🟡 Mineur | `app/error.tsx`, `app/global-error.tsx`, `src/lib/api/responses.ts` | 🔁 Persistant |
| 20 | Documentation CLAUDE.md obsolète | 🟡 Mineur | CLAUDE.md (section Routes API) — ~30 routes manquantes, 3 routes fantômes | 🆕 Nouveau |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:IP')` ajouté, clé namespaced |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts`, 7 imports propres |
| C | Tests manquants pour `admin/groups/pinned`, `admin/groups/[id]/pin`, `admin/users/[id]/memo` (🟡 Mineur) | ✅ Couverts dans `admin-groups.test.ts` et `admin-users.test.ts` |
| D | `connectToMongoDB()` dans `api-tokens/route.ts` et `external/.../players/route.ts` (🟡 Mineur) | ✅ Retiré des deux fichiers originaux — mais réintroduit dans `api-tokens/[tokenId]/route.ts` |

---

## 1. Sécurité

### 1.1 Rate limiting absent sur l'endpoint Bearer token public (IMPORTANT)

**Fichier :** `app/api/external/tournaments/[id]/players/route.ts`

**Problème :** Cette route GET publique (dans `PUBLIC_PREFIXES` du middleware) authentifie via un Bearer token. Elle n'a aucun rate limiting sur les tentatives d'authentification échouées. Un attaquant peut envoyer des milliers de requêtes avec des tokens invalides sans être bloqué.

**Risque :** Brute-force de tokens valides, charge CPU accrue (vérification hash à chaque requête), log pollution. Le risque de brute-force est réel si les tokens sont courts ou prévisibles.

**Correction :**
```typescript
// Ajouter au début du handler, après extraction du token
const ip = getIp(request);
const rl = checkRateLimit(`external-api:${ip}`);
if (!rl.allowed) {
  return ApiResponse.tooManyRequests(`Trop de requêtes. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} minute(s).`);
}
```

Si les tokens échoués méritent un throttle plus agressif :
```typescript
// Rate limit supplémentaire par token invalide
if (!apiToken) {
  const rlFail = checkRateLimit(`external-api-fail:${ip}`);
  // log + retour 401
}
```

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — ligne 18

Ce fichier appelle `connectToMongoDB()` directement, alors que `GroupRepository.isAdmin` et `ApiTokenRepository.revoke` passent par des repositories qui déclenchent déjà le singleton. La violation est fonctionnellement inoffensive (la fonction est idempotente) mais brise la convention établie dans tout le reste du codebase.

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` et l'appel `await connectToMongoDB()` à la ligne 18.

### 2.2 Fetch directs dans des composants au lieu de `useFetch` (IMPORTANT)

**17 composants** effectuent des appels `fetch()` manuels dans des `useEffect`, alors que le hook `useFetch<T>(url)` expose exactement `{ data, loading, error, refetch }` pour les GET :

| Composant | Fetch directs | Endpoints |
|-----------|--------------|-----------|
| `components/tournament/Tournament.tsx` | 7 | conflicts, last-round, me, my-role, merge-status, uncertainties, admin-groups |
| `components/groups/GroupTournaments.tsx` | 3 | merge-status (boucle), conflicts, uncertainties |
| `components/groups/GroupTournamentScoutingPage.tsx` | 2 | scouting-stats, players |
| `components/tournament/PlayersTab.tsx` | 2 | players, registrations |
| `components/tournament/GuestInviteModal.tsx` | 2 | magic-link, guests |
| `components/ui/PlayerCommentHistory.tsx` | 1 | comments |
| `components/tournament/ReportsTab.tsx` | 1 | reports |
| `components/tournament/ConflictResolutionModal.tsx` | 1 | comments |
| `components/groups/ExternalAccessList.tsx` | 1 | external-access |
| `components/groups/AdminConflictModal.tsx` | 1 | comments |
| `components/groups/ApiTokensTab.tsx` | 1 | api-tokens |
| `components/admin/users/AdminMemoModal.tsx` | 1 | memo |
| `components/admin/users/AddToGroupModal.tsx` | 1 | groups |
| `components/admin/invitations/InvitationSendModal.tsx` | 1 | groups |
| `components/admin/AdminSidebar.tsx` | 1 | badge-counts |
| `components/ui/Layout.tsx` | 1 | badge-counts |
| `components/round/Round.tsx` | 1 | comment-counts |

Le cas le plus frappant est `Tournament.tsx` : le composant importe `useFetch` (ligne 81, pour `member-groups`), puis ignore le hook pour 7 autres GET dans le même fichier — incohérence intra-composant.

**Correction type (avant/après) :**
```typescript
// Avant — dans Tournament.tsx
const [conflicts, setConflicts] = useState(null);
useEffect(() => {
  fetch(`/api/tournaments/${id}/conflicts`)
    .then(r => r.json()).then(d => setConflicts(d));
}, [id]);

// Après
const { data: conflicts, loading: conflictsLoading } = useFetch<ConflictsResponse>(
  `/api/tournaments/${id}/conflicts`
);
```

---

## 3. God components

Le projet compte **12 composants > 300 lignes** (contre 10 lors du dernier audit). `Tournament.tsx` et `MatchModal.tsx` ont grossi respectivement de +22 et +29 lignes.

| Composant | Lignes | Évolution |
|-----------|-------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | **+22** |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | **+29** |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |
| `components/tournament/PlayerDeckModal.tsx` | 309 | **🆕** |
| `components/round/Round.tsx` | 304 | **🆕** |

**Découpage recommandé pour les cas les plus critiques :**

`Tournament.tsx` (398 lignes) — Concentre la logique d'état pour les conflits, le merge, les groupes admin, la dernière ronde. Extraction suggérée : hook `useTournamentContext(tournamentId)` qui regroupe les 7–8 états fetch et les expose via context ou props.

`GroupDetailClient.tsx` (480 lignes, admin) — Cumule pin/unpin, info-message, membres, tournois, invitations, 4 modales. Extraction suggérée : `GroupMembersPanel`, `GroupTournamentsPanel` comme sous-composants avec hooks locaux `useGroupPin()`, `useGroupInfoMessage()`.

---

## 4. Couverture de tests

### 4.1 Routes invités sans tests (IMPORTANT)

Quatre routes liées aux accès invités n'ont aucun test d'intégration alors qu'elles concentrent de la logique d'autorisation :

| Route | Logique à tester |
|-------|----------------|
| `app/api/guest/my-tournaments/route.ts` | Retourne uniquement les tournois de l'accès accepté ; refuse si accès révoqué |
| `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | Génération / rotation du token ; unicité par groupe+tournoi |
| `app/api/groups/[id]/guests/[accessId]/route.ts` | Révocation individuelle ; contrôle admin |
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | Liste des accès ; filtre sur statut |

### 4.2 Autres routes sans tests (MINEUR)

| Route | Priorité |
|-------|----------|
| `app/api/tournaments/[id]/admin-groups/route.ts` | Moyenne |
| `app/api/tournaments/[id]/member-groups/route.ts` | Moyenne |
| `app/api/admin/groups/[id]/invitations/[invId]/route.ts` | Moyenne |
| `app/api/admin/users/[id]/groups/route.ts` | Moyenne |
| `app/api/users/search/route.ts` | Basse |

---

## 5. Dette TypeScript

### 5.1 `any` dans les pipelines MongoDB (MINEUR — justifiable)

**7 occurrences, 2 fichiers :**

| Fichier | Ligne | Contexte |
|---------|-------|---------|
| `src/repositories/db/TournamentPlayersDeckRepository.ts` | 142 | `as any` — `$push.$each` dans bulkWrite |
| `src/repositories/db/TournamentPlayersDeckRepository.ts` | 163 | `pipeline: any[]` — aggregation |
| `src/repositories/db/TournamentPlayersDeckRepository.ts` | 224 | `pipeline: any[]` — aggregation |
| `src/repositories/db/RoundRepository.ts` | 67 | `rawDecks: any` |
| `src/repositories/db/RoundRepository.ts` | 95 | `searchStages: any[]` |
| `src/repositories/db/RoundRepository.ts` | 114 | `pipeline: any[]` |
| `src/repositories/db/RoundRepository.ts` | 168 | `scoutingFilterStages: any[]` |

**Correction :** Remplacer par `PipelineStage[]` importé depuis `mongoose` :
```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## 6. Documentation CLAUDE.md

### 6.1 Routes non documentées (~30 routes, MINEUR)

Le codebase a développé depuis juin 2026 plusieurs systèmes complets non reflétés dans CLAUDE.md :

**Système API Tokens :**
- `GET/POST /api/groups/[id]/tournaments/[tid]/api-tokens`
- `DELETE /api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]`
- `GET/POST /api/user/tournaments/[id]/api-tokens`
- `DELETE /api/user/tournaments/[id]/api-tokens/[tokenId]`
- `GET /api/external/tournaments/[id]/players` (Bearer token)

**Routes de merge :**
- `POST /api/groups/[id]/tournaments/[tid]/merge`
- `GET /api/groups/[id]/tournaments/[tid]/merge-status`
- `POST /api/groups/[id]/members/[userId]/merge-tournament`
- `POST /api/admin/groups/[id]/members/[uid]/merge-tournament`

**Routes d'enrichissement tournoi :**
- `GET /api/tournaments/[id]/registrations`
- `GET /api/tournaments/[id]/last-round`
- `GET /api/tournaments/[id]/stats`
- `GET /api/tournaments/[id]/comment-counts`
- `GET /api/tournaments/[id]/admin-groups`
- `GET /api/tournaments/[id]/member-groups`
- `GET /api/tournaments/[id]/players/[playerId]/history`
- `PUT/DELETE /api/player-comments/[commentId]`
- `GET /api/groups/[id]/tournaments/[tid]/scouting-stats`

**Routes admin étendues :**
- `GET/PUT/DELETE /api/admin/groups/[id]`
- `POST/DELETE /api/admin/groups/[id]/pin`
- `GET /api/admin/groups/pinned`
- `GET /api/admin/groups/[id]/members`, `[uid]`
- `GET /api/admin/groups/[id]/tournaments`, `[tid]`
- `DELETE /api/admin/groups/[id]/invitations/[invId]`
- `GET /api/admin/badge-counts`
- `GET/PUT /api/admin/users/[id]/memo`
- `GET /api/admin/users/[id]/groups`
- `GET /api/users/search`
- `GET /api/user/badge-counts`

### 6.2 Routes documentées mais absentes du code (MINEUR)

| Route documentée dans CLAUDE.md | Réalité |
|--------------------------------|---------|
| `GET/POST /api/admin/feedback` | Fichier absent |
| `PUT/DELETE /api/admin/feedback/[id]` | Fichier absent |
| `POST /api/feedback` | Fichier absent |
| `DELETE /api/groups/external-access/[accessId]` | Chemin réel : `DELETE /api/groups/[id]/guests/[accessId]` |

---

## Récapitulatif des priorités

### 🟠 Important — À traiter dans les prochains sprints

1. **Rate limiting sur `/api/external/`** — 5 lignes à ajouter, même pattern que les autres endpoints.
2. **Tests d'intégration pour les 4 routes invités** — logique d'autorisation non couverte sur le flux magic-link/guests/my-tournaments.
3. **Remplacer les fetch directs par `useFetch`** — `Tournament.tsx` en priorité (7 fetch directs dans un fichier qui importe déjà `useFetch`).

### 🟡 Mineur — Opportunités continues

4. Supprimer le `connectToMongoDB()` résiduel dans `api-tokens/[tokenId]/route.ts`.
5. Découper `GroupDetailClient.tsx` (480 lignes) et `Tournament.tsx` (398 lignes) lors des prochaines features.
6. Typer les pipelines MongoDB avec `PipelineStage[]` — suppression des 7 `any`.
7. Mettre à jour CLAUDE.md pour refléter les ~30 routes non documentées.
