# Audit de dette technique — 2026-08-17

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-08-17

---

## Résumé exécutif

Cet audit couvre deux mois de commits depuis le dernier rapport daté du 2026-06-08, période pendant laquelle quatre nouvelles features majeures ont été livrées : API tokens externes, inscriptions pré-tournoi, gestion des invités par approbation admin, et navigation mobile native.

**Toutes les corrections prioritaires de l'audit 2026-06-08 ont été appliquées :** rate limiting sur `/api/guest/validate`, centralisation de `getIp()`, suppression des `connectToMongoDB()` redondants dans deux routes, tests pour les routes admin `pin` et `mémo`.

**Deux nouvelles issues de sécurité identifiées :** (1) `ApiResponse.serverError()` retourne les messages d'exception bruts au client HTTP — un seul caractère à changer pour envoyer un message générique et logger en interne. (2) Le rate limiter repose sur un `Map` Node.js in-process : il ne persiste pas entre redémarrages et ne fonctionne pas en multi-instances cloud (Vercel multi-region, plusieurs workers). Ces deux patterns datent de l'origine du projet.

**Un `connectToMongoDB()` résiduel a été raté** lors du nettoyage : la route DELETE `api-tokens/[tokenId]` n'a pas été traitée contrairement à ses voisines GET/POST.

**Deux nouvelles routes sans tests** ont été introduites pour l'approbation admin des invités (`GET /api/groups/[id]/tournaments/[tid]/guests` et `PUT /api/groups/[id]/guests/[accessId]`). La route PUT concentre de la logique conditionnelle à 3 branches (approve/reject/revoke) et envoie des emails — elle mérite une couverture.

**La tendance god-components s'aggrave légèrement** : deux nouveaux composants franchissent le seuil des 300 lignes (`PlayerDeckModal.tsx` 309 lignes, `Round.tsx` 304 lignes), et `Tournament.tsx` continue de croître (+22 lignes, 398 au total, 9 `useEffect/fetch` cumulés). Les composants existants signalés depuis mai restent stables et non découpés.

**Un modèle Mongoose orphelin détecté :** `models/Ranking.ts` est défini mais jamais importé ni persisté dans aucune route, service ou repository.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — fuite d'erreur interne | 🟠 Important | `src/lib/api/responses.ts` (l.32) | 🆕 Nouveau |
| 2 | Sécurité — rate limiter in-process | 🟠 Important | `src/lib/auth/rateLimit.ts` | 🆕 Nouveau |
| 3 | Couverture tests — routes invités | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/guests/route.ts`, `app/api/groups/[id]/guests/[accessId]/route.ts` | 🆕 Nouveau |
| 4 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` (l.18) | 🔁 Persistant |
| 5 | Sécurité — audit log dégradé | 🟡 Mineur | `app/api/auth/logout/route.ts` (l.13) | 🆕 Nouveau |
| 6 | Architecture — modèle orphelin | 🟡 Mineur | `models/Ranking.ts` | 🆕 Nouveau |
| 7 | Fetch direct dans composant | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (l.87) | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 10 | God component — croissance | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant ↑ |
| 11 | God component — croissance | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Persistant ↑ |
| 12 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 19 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 20 | Fetch directs — Tournament | 🟡 Mineur | `components/tournament/Tournament.tsx` (9 useEffect/fetch) | 🔁 Persistant ↑ |
| 21 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (8 usages) | 🔁 Persistant |
| 22 | Hook non testé | 🟡 Mineur | `src/hooks/usePlayerHistory.ts`, `src/hooks/useTournamentManagement.ts` | 🆕 Nouveau |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — `checkRateLimit('guest-validate:${getIp(request)}')` ajouté |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts`, importée partout |
| C | `connectToMongoDB()` redondant dans `external/players/route.ts` et `api-tokens/route.ts` (GET/POST) (🟡 Mineur) | ✅ Supprimé dans les deux routes — la route DELETE a été ratée (voir #1) |
| D | Tests manquants pour routes `pin` et `mémo` admin (🟡 Mineur) | ✅ Couverts dans `admin-groups.test.ts` et `admin-users.test.ts` |

---

## 1. Sécurité

### 1.1 `ApiResponse.serverError()` expose les messages d'exception au client (IMPORTANT)

**Fichier :** `src/lib/api/responses.ts` — ligne 32

```typescript
serverError: (err: unknown) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : String(err);
  return NextResponse.json({ error: msg }, { status: 500 }); // ← message interne exposé
},
```

Lorsqu'une exception Mongoose survient (ex: `MongoServerError: E11000 duplicate key error collection: ftl.users`), le message complet — incluant le nom de la collection, les clés en doublon, les valeurs — est renvoyé dans le corps HTTP et visible par n'importe quel client. Cette route est appelée dans 24 gestionnaires d'erreur via `return ApiResponse.serverError(err)`.

**Correction (1 ligne) :**
```typescript
serverError: (err: unknown) => {
  console.error(err); // ou logger structuré
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
},
```

### 1.2 Rate limiter in-process : contournable en multi-instances (IMPORTANT)

**Fichier :** `src/lib/auth/rateLimit.ts` — lignes 1–21

```typescript
const store = new Map<string, Entry>(); // ← state global in-process

export function checkRateLimit(key: string) {
  const now = Date.now(), e = store.get(key);
  // ...
}
```

Le `Map` est local au processus Node.js. En conséquence :
- En déploiement multi-instances (Vercel multi-region, PM2 cluster, Kubernetes) chaque instance a son propre compteur — un attaquant distribue ses requêtes et contourne la limite
- Le compteur est perdu à chaque redémarrage (hot-reload, déploiement, cold start)

Le projet ne protège que 6 endpoints critiques via ce rate limiter (`/api/auth/login`, `/api/auth/forgot-password`, etc.) — tous les contourner simultanément est trivial depuis plusieurs IPs ou instances.

**Solution recommandée :** Remplacer le `Map` par Redis (via `ioredis` ou Upstash pour serverless) avec un sliding window en `INCR` + `EXPIRE`. Upstash a un SDK Next.js natif : `@upstash/ratelimit`.

### 1.3 `ipAddress: 'unknown'` hardcodé dans le logout (MINEUR)

**Fichier :** `app/api/auth/logout/route.ts` — ligne 13

```typescript
await AuditLogRepository.create({
  action: 'LOGOUT',
  ipAddress: 'unknown', // ← hardcodé ; getIp(request) est disponible
  userAgent: request.headers.get('user-agent') ?? ''
});
```

Toutes les autres routes qui créent un audit log utilisent `getIp(request)`. Le logout est précisément l'action la plus utile à tracer par IP pour détecter des sessions révoquées à distance ou des attaques. `getIp` est déjà importé dans le même fichier.

**Correction :** Remplacer `'unknown'` par `getIp(request)`.

---

## 2. Architecture

### 2.1 `connectToMongoDB()` résiduel dans la route DELETE api-tokens (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6 et 18

Le commit `chore(arch): supprimer les connectToMongoDB() redondants dans api-tokens et external players` a supprimé l'appel dans le fichier `api-tokens/route.ts` (routes GET et POST), mais a raté le fichier adjacent `api-tokens/[tokenId]/route.ts` (route DELETE) qui contient le même import et appel redondant.

```typescript
// Ligne 6 — import inutile
import connectToMongoDB from '@/src/lib/db';

// Ligne 18 — appel redondant (GroupRepository appelle sa propre connexion)
await connectToMongoDB();
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
```

**Correction :** Supprimer l'import `connectToMongoDB` (ligne 6) et l'appel `await connectToMongoDB()` (ligne 18).

### 2.2 Modèle Mongoose orphelin — `Ranking.ts` (MINEUR)

**Fichier :** `models/Ranking.ts`

Ce modèle Mongoose définit un schéma complet (`IRanking`, `IRankingEntry`, `IRankingPlayer`) pour stocker les classements de tournoi en base. Il n'a aucun repository associé et n'est **jamais importé** dans aucune route, service, ou repository du projet.

Les rankings sont récupérés depuis l'API Ravensburger via `RavensburgerClient.fetchRank()` et retournés directement sans persistance. Le modèle `Ranking.ts` est soit un artefact d'une version antérieure, soit une feature non implémentée.

**Action recommandée :** Supprimer `models/Ranking.ts` si la persistance locale des rankings n'est pas planifiée.

---

## 3. Couverture de tests

### 3.1 Routes d'approbation des invités sans tests (IMPORTANT)

**Fichiers :**
- `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` — GET : liste les accès en attente d'un tournoi de groupe
- `app/api/groups/[id]/guests/[accessId]/route.ts` — PUT : approuve / rejette / révoque un accès invité

Ces deux routes ont été introduites pour le workflow d'approbation admin des invités (distinct du flux magic link). Elles ne sont pas couvertes par `guest-access.test.ts` qui ne teste que `/api/guest/validate`.

La route PUT est particulièrement critique à tester car elle :
- couvre 3 branches (approve/reject/revoke) avec des transitions d'état différentes
- envoie un email d'approbation lors de l'action `approve`
- vérifie que l'`accessId` appartient bien au groupe demandé

**Cas prioritaires pour `PUT /api/groups/[id]/guests/[accessId]` :**
- Retourne 401 sans session
- Retourne 403 si l'utilisateur n'est pas admin du groupe
- Retourne 400 si `action` n'est pas `approve` / `reject` / `revoke`
- Retourne 403 si l'`accessId` n'appartient pas au groupe `id`
- Approbation : passe le statut à ACCEPTED, envoie l'email si l'utilisateur existe
- Rejet : passe le statut à REJECTED
- Révocation : passe le statut à REVOKED ; retourne 400 si déjà révoqué/expiré/refusé

**Cas prioritaires pour `GET /api/groups/[id]/tournaments/[tid]/guests` :**
- Retourne 401 sans session
- Retourne 403 si pas admin du groupe
- Retourne la liste vide si aucun invité en attente
- Retourne les invités avec username et email enrichis

### 3.2 Hooks complexes sans tests (MINEUR)

**Fichiers :**
- `src/hooks/usePlayerHistory.ts` — hook de fetching GET du parcours d'un joueur
- `src/hooks/useTournamentManagement.ts` — 276 lignes, 6 mutations de tournoi (archiver, ajouter, supprimer)

`usePlayerHistory` est un hook de fetching GET simple (27 lignes) — un test Vitest sur la logique de fetch/error/loading serait minimal mais utile pour documenter le contrat.

`useTournamentManagement` concentre toute la logique d'état de `TournamentsPageClient.tsx`. Avec 276 lignes et des mutations réseau, des tests unitaires qui mockent `fetch` permettraient de valider l'état interne après chaque mutation sans passer par un composant.

---

## 4. Fetch directs dans les composants

### 4.1 `PlayersTab.tsx` — nouvelle dépendance fetch directe (MINEUR)

**Fichier :** `components/tournament/PlayersTab.tsx` — lignes 87–98

L'ajout de la feature inscriptions a introduit deux `fetch` directs dans `PlayersTab.tsx` : un dans un `useEffect` pour récupérer le statut des inscriptions (GET), et un dans un handler de bouton pour déclencher le fetch depuis Ravensburger (POST).

```typescript
// Ligne 87 — GET via useEffect au lieu d'useFetch (pattern existant)
useEffect(() => {
  fetch(`/api/tournaments/${tournamentId}/registrations`)
    .then(r => r.json())
    .then(data => setRegistrationStatus(data))
}, [tournamentId]);
```

Le call GET (ligne 87) pourrait utiliser `useFetch<RegistrationStatus>('/api/tournaments/${tournamentId}/registrations')` conformément au pattern établi. Le POST est une mutation en handler et n'a pas d'équivalent hook générique dans le projet — il reste acceptable tel quel.

### 4.2 `Tournament.tsx` — accumulation continue (MINEUR)

**Fichier :** `components/tournament/Tournament.tsx` — 398 lignes (+22 depuis l'audit du 08/06)

Ce composant cumule désormais **9 `useEffect/fetch` distincts** pour : les conflits utilisateur, la dernière ronde, l'identité de l'utilisateur, le rôle dans le groupe, le statut de merge, les conflits de groupe, les incertitudes, les groupes admin et la résolution du merge.

Chaque nouvelle feature de groupe a ajouté un bloc `useEffect/fetch` sans extraire de hook dédié. La croissance va continuer si ce pattern est maintenu.

**Suggestion :** Extraire un hook `useGroupTournamentContext(groupId, tournamentId)` qui centralise les 5 fetches conditionnés à `groupId`.

---

## 5. God components

Le projet compte désormais **12 composants > 300 lignes** (+2 nouveaux). Les composants existants sont stables (aucune réduction observée).

### 5.1 Nouveaux god components

**`components/round/Round.tsx` — 304 lignes (NOUVEAU)**

Ce composant coordonne : la pagination des matchs via `useRound`, la gestion de 4 modales distinctes (MatchModal, PlayerCommentHistory, PlayerHistoryDrawer, DeckConfirmModal), les filtres de scouting, et la barre de progression.

**Découpage suggéré :** Extraire `RoundModalsCoordinator` qui gère l'état des modales et la logique d'ouverture/fermeture.

**`components/tournament/PlayerDeckModal.tsx` — 309 lignes (NOUVEAU)**

Ce composant combine : sélection d'encres avec state d'édition, affichage onglets (assignation / historique), appel au hook `usePlayerHistory`, envoi de commentaire, et logique de détection de changements.

**Découpage suggéré :** Extraire `DeckAssignmentTab` et `PlayerHistoryTab` comme sous-composants.

### 5.2 God components persistants avec croissance

| Composant | Lignes | Delta | Tendance |
|-----------|-------|-------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | 0 | Stable |
| `components/tournament/Tournament.tsx` | 398 | +22 | ↑ |
| `components/tournament/TournamentsPageClient.tsx` | 375 | 0 | Stable |
| `components/match/MatchModal.tsx` | 357 | +29 | ↑ (bottom sheet mobile) |
| `components/groups/GroupDetail.tsx` | 356 | 0 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | 0 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | 0 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | 0 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | 0 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | 0 | Stable |

---

## 6. Dette TypeScript persistante

### 6.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (5 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages)

Inchangé depuis l'audit du 08/06. Ces `any` typent des pipelines d'agrégation MongoDB. Le type `PipelineStage[]` (disponible depuis Mongoose v7) permettrait de les supprimer :

```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🟠 Important — À corriger dans le sprint en cours

1. **Corriger `ApiResponse.serverError()`** — une ligne : remplacer `msg` par `'Internal server error'` en réponse HTTP, conserver le log serveur. Impact : toutes les 24 routes qui appellent `ApiResponse.serverError(err)`.
2. **Ajouter les tests pour les routes d'approbation des invités** (`guests/route.ts` et `guests/[accessId]/route.ts`) — la route PUT couvre 3 branches avec logique d'état et envoi d'email.
3. **Documenter ou supprimer `models/Ranking.ts`** — décision rapide : le modèle est utilisé ou supprimé.

### 🟡 Mineur — Améliorations au fil de l'eau

4. Corriger `ipAddress: 'unknown'` dans `logout/route.ts` — remplacer par `getIp(request)`.
5. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts` (2 lignes à retirer).
6. Planifier la migration du rate limiter vers Redis/Upstash si le projet scale vers plusieurs instances.
7. Remplacer le `fetch` GET dans `PlayersTab.tsx` par `useFetch`.
8. Ajouter des tests pour `useTournamentManagement` (mutations réseau mockées).
9. Découper `Round.tsx` (304 lignes) et `PlayerDeckModal.tsx` (309 lignes) lors des prochaines évolutions.
10. Extraire un hook `useGroupTournamentContext` pour les 5 fetches conditionnels de `Tournament.tsx`.
11. Typer les pipelines MongoDB avec `PipelineStage[]` (8 `any` dans 2 repositories).
