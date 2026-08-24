# Audit de dette technique — 2026-08-24

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-08-24

---

## Résumé exécutif

Cet audit est le premier depuis le rapport du 2026-08-17. **Aucune des corrections identifiées dans l'audit précédent n'a été appliquée cette semaine.** Les 7 issues portées — dont deux classées 🟠 Important — sont intégralement persistantes : `ApiResponse.serverError()` expose toujours les messages d'exception bruts au client, les tests des routes d'approbation invités sont toujours manquants, et les corrections mineures (`ipAddress`, `connectToMongoDB`, `Ranking.ts`) n'ont pas été traitées.

**Un seul élément nouveau :** la route `GET /api/tournaments/[id]/member-groups` a été introduite (36 lignes, bien protégée par `getAuthSession`), mais sans test d'intégration associé.

**Les god components restent stables** : aucun des 12 composants signalés n'a grandi ni été refactorisé — leurs compteurs sont identiques au pixel près par rapport à la semaine dernière.

**En l'absence de livraisons depuis l'audit précédent**, ce rapport est essentiellement une relance de l'audit 2026-08-17 avec les mises à jour d'état. Les priorités restent inchangées.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — fuite d'erreur interne | 🟠 Important | `src/lib/api/responses.ts` (l.33) | 🔁 Persistant (× 2 audits) |
| 2 | Couverture tests — routes invités | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/guests/route.ts`, `app/api/groups/[id]/guests/[accessId]/route.ts` | 🔁 Persistant (× 2 audits) |
| 3 | Couverture tests — route member-groups | 🟡 Mineur | `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 4 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` (l.18) | 🔁 Persistant (× 2 audits) |
| 5 | Sécurité — audit log dégradé | 🟡 Mineur | `app/api/auth/logout/route.ts` (l.13) | 🔁 Persistant (× 2 audits) |
| 6 | Architecture — modèle orphelin | 🟡 Mineur | `models/Ranking.ts` | 🔁 Persistant (× 2 audits) |
| 7 | Fetch direct dans composant | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (l.87) | 🔁 Persistant (× 2 audits) |
| 8 | Couverture tests — hook complexe | 🟡 Mineur | `src/hooks/useTournamentManagement.ts` (276 lignes) | 🔁 Persistant (× 2 audits) |
| 9 | God component — croissance continue | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, 9 useEffect) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 11 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 19 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🔁 Persistant |
| 20 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🔁 Persistant |
| 21 | Fetch directs — 13 composants | 🟡 Mineur | multiple (voir §4) | 🔁 Persistant |
| 22 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (8 usages), `TournamentPlayersDeckRepository.ts` (6 usages) | 🔁 Persistant |
| 23 | Sécurité — rate limiter in-process | 🟡 Mineur | `src/lib/auth/rateLimit.ts` | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-08-17

Aucun.

---

## 1. Sécurité

### 1.1 `ApiResponse.serverError()` expose les messages d'exception au client (IMPORTANT — PERSISTANT)

**Fichier :** `src/lib/api/responses.ts` — ligne 33

```typescript
serverError: (err: unknown) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : String(err);
  return NextResponse.json({ error: msg }, { status: 500 }); // ← message interne exposé
},
```

Lorsqu'une exception Mongoose survient (ex: `MongoServerError: E11000 duplicate key error collection: ftl.users`), le message complet — incluant le nom de la collection, les clés en doublon, les valeurs — est renvoyé dans le corps HTTP. Cette méthode est utilisée dans les gestionnaires `catch` de 24+ routes.

**Correction (1 ligne) :**
```typescript
return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
```
Le `console.error(err)` existant (ligne 32) conserve le log serveur complet pour le débogage.

### 1.2 `ipAddress: 'unknown'` hardcodé dans le logout (MINEUR — PERSISTANT)

**Fichier :** `app/api/auth/logout/route.ts` — ligne 13

```typescript
await AuditLogRepository.create({
  action: 'LOGOUT',
  ipAddress: 'unknown', // ← hardcodé ; getIp est déjà importé dans ce fichier
  userAgent: request.headers.get('user-agent') ?? ''
});
```

Toutes les autres routes utilisant `AuditLogRepository.create` passent `getIp(request)`. `getIp` est déjà importé dans le fichier.

**Correction :** Remplacer `'unknown'` par `getIp(request)`.

### 1.3 Rate limiter in-process (MINEUR — PERSISTANT)

**Fichier :** `src/lib/auth/rateLimit.ts`

Le `Map` Node.js en mémoire ne persiste pas entre les redémarrages et ne fonctionne pas en déploiement multi-instances. Ce point reste documenté comme dette architecturale à traiter lors d'un passage à une infrastructure distribuée (Redis/Upstash).

---

## 2. Architecture

### 2.1 `connectToMongoDB()` résiduel dans la route DELETE api-tokens (MINEUR — PERSISTANT)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6 et 18

Import inutile (ligne 6) + appel redondant `await connectToMongoDB()` (ligne 18) avant `GroupRepository.isAdmin` et `ApiTokenRepository.revoke`, qui gèrent chacun leur propre connexion.

**Correction :** Supprimer l'import ligne 6 et l'appel ligne 18.

### 2.2 Modèle Mongoose orphelin — `Ranking.ts` (MINEUR — PERSISTANT)

**Fichier :** `models/Ranking.ts`

Ce schéma Mongoose (`IRanking`, `IRankingEntry`, `IRankingPlayer`) n'a ni repository, ni service, ni route qui l'importe ou l'utilise. Les rankings sont récupérés depuis `RavensburgerClient.fetchRank()` et retournés directement sans persistance.

**Action recommandée :** Supprimer le fichier si la persistance des rankings n'est pas prévue.

---

## 3. Couverture de tests

### 3.1 Routes d'approbation des invités sans tests (IMPORTANT — PERSISTANT)

**Fichiers :**
- `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` — GET
- `app/api/groups/[id]/guests/[accessId]/route.ts` — PUT (3 branches : approve/reject/revoke + envoi email)

`src/__tests__/guest-access.test.ts` couvre uniquement `POST /api/guest/validate`. Les deux routes d'administration des accès invités restent sans aucun test.

**Cas prioritaires pour `PUT /api/groups/[id]/guests/[accessId]` :**
- 401 sans session
- 403 si pas admin du groupe
- 400 si `action` invalide (ni approve / reject / revoke)
- 403 si l'`accessId` n'appartient pas au groupe
- approve → statut ACCEPTED + email si utilisateur existant
- reject → statut REJECTED
- revoke → statut REVOKED ; 400 si déjà révoqué/expiré/refusé

**Cas prioritaires pour `GET /api/groups/[id]/tournaments/[tid]/guests` :**
- 401 sans session
- 403 si pas admin du groupe
- Retourne liste vide si aucun invité en attente
- Retourne les invités avec `username` et `email` enrichis

### 3.2 Nouvelle route sans test (MINEUR — NOUVEAU)

**Fichier :** `app/api/tournaments/[id]/member-groups/route.ts` (36 lignes)

Cette route GET récupère les groupes du tournoi dont l'utilisateur authentifié est membre. Elle est bien protégée (`getAuthSession`) mais n'a pas de test d'intégration.

**Cas à couvrir :**
- 401 sans session
- 400 si tournamentId non numérique
- Retourne `{ groups: [] }` si aucun groupe ne contient ce tournoi
- Retourne uniquement les groupes dont l'utilisateur est membre (pas tous les groupes du tournoi)

### 3.3 Hook `useTournamentManagement` sans test (MINEUR — PERSISTANT)

**Fichier :** `src/hooks/useTournamentManagement.ts` — 276 lignes, 6 mutations (archiver, ajouter, supprimer, accepter invitation, quitter groupe)

Tests existants dans `src/__tests__/hooks/` : `useDeckAssignment`, `useMatchState`, `useRound`, `useTournament` — ce hook en est absent.

---

## 4. Fetch directs dans les composants (PERSISTANT)

13 composants effectuent des `fetch()` directs dans `useEffect` au lieu d'utiliser le hook `useFetch` établi. Liste complète :

| Fichier | Ligne | Endpoint | Note |
|--------|-------|----------|------|
| `components/tournament/PlayersTab.tsx` | 87 | `GET .../registrations` | Migrable vers `useFetch` |
| `components/tournament/Tournament.tsx` | 98–121 | 5 endpoints (last-round, me, my-role, merge-status, etc.) | Pattern candidat → hook `useGroupTournamentContext` |
| `components/tournament/ReportsTab.tsx` | 20 | `GET .../reports` | Migrable vers `useFetch` |
| `components/tournament/GuestInviteModal.tsx` | 42 | `GET .../magic-link` | Migrable vers `useFetch` |
| `components/tournament/ConflictResolutionModal.tsx` | 55 | `GET .../comments` | Migrable vers `useFetch` |
| `components/admin/users/AdminMemoModal.tsx` | 25 | `GET .../memo` | Migrable vers `useFetch` |
| `components/admin/users/AddToGroupModal.tsx` | 31 | `GET /api/admin/groups` | Dupliqué avec InvitationSendModal |
| `components/admin/invitations/InvitationSendModal.tsx` | 32 | `GET /api/admin/groups` | Dupliqué avec AddToGroupModal |
| `components/admin/AdminSidebar.tsx` | 106 | `GET /api/admin/badge-counts` | — |
| `components/ui/Layout.tsx` | 35 | `GET /api/user/badge-counts` | — |

`AddToGroupModal` et `InvitationSendModal` dupliquent le même fetch `GET /api/admin/groups` — un hook `useAdminGroups()` mutualiserait les deux.

---

## 5. God components (PERSISTANT — STABLE)

12 composants dépassent 300 lignes. **Aucun delta cette semaine.**

| Composant | Lignes | Delta | Tendance |
|-----------|--------|-------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | 0 | Stable |
| `components/tournament/Tournament.tsx` | 398 | 0 | Stable (mais 9 useEffect) |
| `components/tournament/TournamentsPageClient.tsx` | 375 | 0 | Stable |
| `components/match/MatchModal.tsx` | 357 | 0 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | 0 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | 0 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | 0 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | 0 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | 0 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | 0 | Stable |
| `components/tournament/PlayerDeckModal.tsx` | 309 | 0 | Stable |
| `components/round/Round.tsx` | 304 | 0 | Stable |

---

## 6. Dette TypeScript (PERSISTANT)

### 6.1 `any` dans les pipelines MongoDB

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — 8 usages (`any[]` sur les pipelines d'agrégation)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — 6 usages

Aucune migration vers `PipelineStage[]` (disponible dans Mongoose v7). Ces `any` restent fonctionnellement corrects mais contournent la validation TypeScript.

```typescript
// Remplacement type pour supprimer les `any` :
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🟠 Important — À corriger en priorité

1. **`ApiResponse.serverError()` → message générique** — 1 ligne dans `src/lib/api/responses.ts`.
2. **Tests pour les routes d'approbation invités** — `guests/route.ts` GET + `guests/[accessId]/route.ts` PUT (3 branches, email).

### 🟡 Mineur — À traiter au fil de l'eau

3. **Test pour `GET /api/tournaments/[id]/member-groups`** — 4 cas, route simple.
4. **`ipAddress: 'unknown'` dans `logout/route.ts`** — remplacer par `getIp(request)`.
5. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** (2 lignes).
6. **Supprimer ou documenter `models/Ranking.ts`** — décision d'architecture.
7. **Migrer le `fetch` GET de `PlayersTab.tsx`** vers `useFetch`.
8. **Tests pour `useTournamentManagement`** (mutations réseau mockées).
9. **Découper les god components** lors des prochaines features (priorité : `Tournament.tsx` 9 useEffect).
10. **Migrer les pipelines MongoDB** vers `PipelineStage[]` (suppression de 14 `any`).
11. **Extraire `useAdminGroups()`** pour dédupliquer le fetch de `AddToGroupModal` et `InvitationSendModal`.
