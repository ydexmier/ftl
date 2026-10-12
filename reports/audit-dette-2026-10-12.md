# Audit de dette technique — 2026-10-12

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-10-12

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, la progression est **exceptionnelle** : les 3 problèmes critiques sont résolus, la couverture de tests admin a bondi de ~40 % à ~90 %, et les problèmes de sécurité signalés sont tous corrigés. 17 routes précédemment non couvertes ont désormais des tests.

**Ce qui a progressé :** rate limiting sur `/api/guest/validate` ajouté immédiatement, `getIp()` centralisé, `connectToMongoDB()` redondants supprimés sur les routes ciblées, routes POST vestigiales sans auth supprimées, `DELETE /api/tournaments/[id]` protégé. La vague de tests admin (juin 2026) est très solide.

**Ce qui stagne :** les god components persistent — 10 composants dépassent encore 300 lignes, et deux nouveaux (PlayerDeckModal, Round) ont franchi le seuil depuis juin. Tournament.tsx (+22 lignes) et MatchModal.tsx (+29 lignes) ont continué à grossir malgré les nouvelles features. La dette TypeScript (`any` dans les pipelines MongoDB) reste inchangée depuis mai 2025.

**Ce qui est nouveau :** `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts` a été manqué lors du nettoyage de juin (seul le fichier parent `route.ts` a été traité). Deux nouvelles routes utilitaires (`/member-groups`, `/admin-groups` sur les tournois) et la route `guests/[accessId]` n'ont pas de tests d'intégration.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — Auth manquante | 🔴 Critique | `app/api/rounds/[roundId]/matchs/route.ts` | 🆕 Nouveau |
| 2 | Sécurité — Exposition sessionId | 🔴 Critique | `src/repositories/db/SessionRepository.ts`, `app/api/admin/users/[id]/sessions/route.ts` | 🆕 Nouveau |
| 3 | Sécurité — ReDoS $regex | 🟠 Important | `src/repositories/db/UserRepository.ts`, `TournamentRepository.ts`, `TournamentPlayersDeckRepository.ts`, `AuditLogRepository.ts`, `RoundRepository.ts` | 🆕 Nouveau |
| 4 | Sécurité — Validation email faible | 🟡 Mineur | `src/services/GroupService.ts` ligne 213 | 🆕 Nouveau |
| 5 | Sécurité — expiresAt non validée | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/external-access/route.ts` ligne 29 | 🆕 Nouveau |
| 6 | Architecture — N+1 query | 🟠 Important | `app/api/admin/groups/route.ts` | 🆕 Nouveau |
| 7 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🆕 Nouveau |
| 8 | Redondance — logique invitation | 🟠 Important | `app/api/admin/invitations/route.ts`, `app/api/admin/access-requests/[id]/route.ts` | 🆕 Nouveau |
| 9 | Redondance — InviteMemberModal dupliqué | 🟡 Mineur | `components/admin/groups/InviteMemberModal.tsx`, `components/groups/InviteMemberModal.tsx` | 🆕 Nouveau |
| 10 | Dette — Validation manquante (username max) | 🟠 Important | `app/api/user/profile/route.ts` | 🆕 Nouveau |
| 11 | God component — aggravé | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Aggravé |
| 12 | God component — aggravé | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes, +29) | 🔁 Aggravé |
| 13 | God component — nouveau | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 14 | God component — nouveau | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 15 | God component — persistant | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 16 | God component — persistant | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 17 | God component — persistant | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 18 | God component — persistant | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 19 | God component — persistant | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 20 | God component — persistant | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 21 | God component — persistant | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 22 | God component — persistant | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 23 | Fetch directs dans les composants | 🟡 Mineur | `components/tournament/Tournament.tsx` (8+ fetch()/useEffect), multiples autres | 🔁 Persistant |
| 24 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (5 usages), `TournamentPlayersDeckRepository.ts` (2 usages) | 🔁 Persistant |
| 25 | Couverture tests | 🟡 Mineur | `tournaments/[id]/admin-groups`, `tournaments/[id]/member-groups`, `groups/[id]/guests/[accessId]`, `admin/users/[id]/groups`, `admin/groups/[id]/invitations/[invId]` | 🔁 Partiellement persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ Corrigé — commit d7a9b76 |
| B | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisé dans `src/lib/auth/getIp.ts` |
| C | `connectToMongoDB()` dans `api-tokens/route.ts` et `external/players/route.ts` (🟡 Mineur) | ✅ Supprimé — commit 18b5adb |
| D | Tests manquants sur routes `pin groupe` et `mémo utilisateur` (🟡 Mineur) | ✅ `admin-groups.test.ts` + `admin-users.test.ts` |
| E | Routes admin non testées (~10 routes) (🟡 Mineur) | ✅ 17 routes couvertes en juin-octobre |
| F | Routes POST vestigiales sans auth (🔴 Critique — non signalé dans l'audit) | ✅ Supprimées — commit 9ef02aa |
| G | `DELETE /api/tournaments/[id]` non protégé (🔴 Critique — non signalé dans l'audit) | ✅ Auth + audit log ajoutés — commit f510749 |

---

## 1. Sécurité

### 1.1 `POST /api/rounds/[roundId]/matchs` sans authentification DB (CRITIQUE)

**Fichier :** `app/api/rounds/[roundId]/matchs/route.ts` — handler POST (lignes 36–45)

Ce handler POST ne fait aucun appel à `getAuthSession(request)`. Il se contente de la vérification HMAC du middleware (Edge Runtime), qui valide uniquement la signature du cookie **sans interroger MongoDB**. Résultat : tout utilisateur possédant un cookie HMAC valide — même pour une session expirée ou révoquée en base — peut appeler ce POST et **écraser n'importe quel document Round** avec des données arbitraires via `RoundRepository.upsert({ id: Number(roundId), ...body })`.

```typescript
// app/api/rounds/[roundId]/matchs/route.ts — aucune auth DB
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { roundId } = await params;
    const body = await request.json();
    const round = await RoundRepository.upsert({ id: Number(roundId), ...body }); // ← aucun contrôle
    return ApiResponse.ok(round);
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
```

**Correction :**
```typescript
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();
  // (si cette route n'est utilisée qu'en admin, utiliser requireAdminSession)
  // ...
}
```

---

### 1.2 Exposition des `sessionId` bruts dans l'API admin sessions (CRITIQUE)

**Fichiers :**
- `src/repositories/db/SessionRepository.ts` — `findByUserId()` retourne les documents complets
- `app/api/admin/users/[id]/sessions/route.ts` — retourne `sessions` tel quel

`SessionRepository.findByUserId()` retourne les documents Session complets, y compris le champ `sessionId` — qui est le **token d'authentification** (identifiant de session signé HMAC). `GET /api/admin/users/{id}/sessions` expose ces tokens à tout administrateur qui consulte les sessions d'un utilisateur. Un administrateur compromis peut extraire le `sessionId` d'un autre utilisateur (y compris d'un SUPERUSER) et usurper son identité sans connaître son mot de passe.

**Correction :** Exclure `sessionId` de la projection dans `findByUserId()` :

```typescript
// SessionRepository.ts
async findByUserId(userId: string) {
  await connectToMongoDB();
  return SessionModel.find({ userId })
    .select('-sessionId')          // ← exclure le token d'auth
    .sort({ lastActivityAt: -1 })
    .lean();
}
```

---

### 1.3 Injection ReDoS via `$regex` non-échappé (IMPORTANT)

**Fichiers :**
- `src/repositories/db/UserRepository.ts` — lignes 10–11 (search), 102–103 (findWithFilters)
- `src/repositories/db/TournamentRepository.ts` — ligne 40 (search)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — ligne 168 (recherche joueurs)
- `src/repositories/db/AuditLogRepository.ts` — lignes 35–36 (filter username, ip)
- `src/repositories/db/RoundRepository.ts` — ligne 101 (recherche matchs)

Les paramètres de recherche sont passés directement dans `{ $regex: userInput, $options: 'i' }` sans échappement. Un attaquant peut soumettre une expression régulière complexe (ex. `(a+)+$`) provoquant une **Catastrophic Backtracking** côté MongoDB (ReDoS), susceptible de saturer le CPU et de rendre le service indisponible.

**Correction :** Ajouter dans `src/lib/validation.ts` :

```typescript
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

Puis appliquer à tous les `$regex` :
```typescript
// Exemple dans UserRepository.ts
{ username: { $regex: escapeRegex(search), $options: 'i' } }
```

---

### 1.4 Validation email insuffisante dans `GroupService.inviteExternal` (MINEUR)

**Fichier :** `src/services/GroupService.ts` — ligne 213

```typescript
if (!email || !email.includes('@')) throw new Error('Email invalide');
```

Ce test accepte des emails invalides comme `foo@`, `@bar.com`, ou `foo@@bar`. La fonction `isValidEmail()` plus robuste existe déjà dans `src/lib/validation.ts` mais n'est pas utilisée ici.

**Correction :**
```typescript
import { isValidEmail } from '@/src/lib/validation';
if (!email || !isValidEmail(email.trim())) throw new Error('Email invalide');
```

---

### 1.5 `expiresAt` reçue sans validation de date (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/external-access/route.ts` — ligne 29

La valeur `expiresAt` du client est passée directement à `new Date(expiresAt)` sans vérifier que la date résultante est valide ni qu'elle est dans le futur.

**Correction :**
```typescript
const parsed = new Date(expiresAt);
if (isNaN(parsed.getTime())) return ApiResponse.badRequest('expiresAt invalide');
if (parsed < new Date()) return ApiResponse.badRequest('expiresAt doit être dans le futur');
```

---

## 2. Architecture

### 2.1 Requête N+1 dans `GET /api/admin/groups` (IMPORTANT)

**Fichier :** `app/api/admin/groups/route.ts` — lignes 13–22

```typescript
const groups = await GroupRepository.findAll();                    // 1 requête
const enriched = await Promise.all(
  groups.map(async (g) => {
    const full = await GroupRepository.findById(id);              // N requêtes
    const tournaments = await GroupTournamentRepository.findByGroupId(id); // N requêtes
    // ...
  }),
);
```

Pour 50 groupes, cela génère **101 requêtes MongoDB** au lieu d'une seule aggregation.

**Correction :** Ajouter `findAllWithCounts()` dans `GroupRepository` :
```typescript
async findAllWithCounts() {
  await connectToMongoDB();
  return GroupModel.aggregate([
    { $project: { name: 1, memberCount: { $size: '$members' }, isPinned: 1 } }
  ]);
}
```
Puis obtenir les `tournamentCount` via une seule requête groupée sur `GroupTournamentModel`.

---

### 2.2 `connectToMongoDB()` résiduel dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6, 18

Le commit `18b5adb` a supprimé `connectToMongoDB()` dans `api-tokens/route.ts` (la route parente, GET+POST) mais a manqué le fichier enfant `[tokenId]/route.ts` (DELETE). La même violation réapparaît une route plus bas dans l'arborescence.

```typescript
// AVANT (résiduel) — lignes 6 et 18
import connectToMongoDB from '@/src/lib/db';
// ...
await connectToMongoDB();                    // ← redondant, GroupRepository appelle déjà connectToMongoDB
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
```

**Correction :** Supprimer l'import et l'appel `await connectToMongoDB()` — identique à ce qui a été fait dans les routes voisines.

---

## 3. God components

### 3.1 Vue d'ensemble — 12 composants > 300 lignes

Le projet compte désormais **12 composants > 300 lignes** (contre 10 lors de l'audit du 2026-06-08). Le seuil de 300 lignes est respecté en tant que signal de découpage préventif, pas de règle absolue ; mais l'absence de progression sur les composants stables (GroupDetailClient, GroupDetail, PlayersTab, etc.) confirme qu'aucun effort de découpage n'a été mené depuis mai 2025.

| Composant | Lignes | Δ depuis juin | Tendance |
|-----------|-------|--------------|---------|
| `GroupDetailClient.tsx` (admin) | 480 | = | Stable |
| `Tournament.tsx` | 398 | +22 | 🔴 Croissant |
| `TournamentsPageClient.tsx` | 375 | = | Stable |
| `MatchModal.tsx` | 357 | +29 | 🔴 Croissant |
| `GroupDetail.tsx` | 356 | = | Stable |
| `PlayersTab.tsx` | 342 | = | Stable |
| `GroupTournamentScoutingPage.tsx` | 334 | = | Stable |
| `GroupTournaments.tsx` | 319 | = | Stable |
| `PlayerCommentHistory.tsx` | 317 | = | Stable |
| `UserDetailClient.tsx` (admin) | 315 | = | Stable |
| `PlayerDeckModal.tsx` | 309 | 🆕 | Nouveau |
| `Round.tsx` | 304 | 🆕 | Nouveau |

### 3.2 `Tournament.tsx` — 398 lignes, 32 hooks (AGGRAVÉ)

**Fichier :** `components/tournament/Tournament.tsx`

Ce composant cumule 32 `useEffect`/`useState`/`fetch()` — 8+ appels `fetch()` directs dans des `useEffect`, sans hooks dédiés. Chaque nouvelle feature (bandeau de groupe, bouton merge, détection admin) a ajouté des hooks et des appels fetch inline.

**Exemples de doublons avec des hooks existants :**
```typescript
// Tournament.tsx — lignes 100+
fetch(`/api/tournaments/${id}/last-round`)        // → pourrait être dans useTournament
fetch('/api/auth/me')                              // → pourrait être dans un hook global
fetch(`/api/groups/${groupId}/my-role`)           // → pourrait être dans useGroupRole
```

**Découpage suggéré :**
- Extraire `useTournamentContext(id, groupId)` : centralise les 8 fetches et expose les états dérivés
- `Tournament.tsx` ne devrait contenir que le rendu des onglets et la logique de navigation

### 3.3 `MatchModal.tsx` — 357 lignes (AGGRAVÉ)

**Fichier :** `components/match/MatchModal.tsx`

Converti en bottom sheet mobile (PR #197), le composant a pris 29 lignes supplémentaires de logique de détection tactile et d'animation. La logique de drag/swipe mériterait d'être extraite dans `useScrollGuard` (qui existe déjà dans `src/hooks/useScrollGuard.ts`) ou un hook dédié `useBottomSheet`.

### 3.4 `PlayerDeckModal.tsx` — 309 lignes (NOUVEAU)

**Fichier :** `components/tournament/PlayerDeckModal.tsx`

Nouveau composant introduit pour la vue scouting groupe. Mélange gestion d'état formulaire, appels fetch, affichage du parcours historique du joueur et résolution de conflits. À surveiller pour découpage dès la prochaine feature.

---

## 4. Redondances

### 4.1 Logique d'invitation dupliquée entre deux routes admin (IMPORTANT)

**Fichiers :**
- `app/api/admin/invitations/route.ts` — POST (création d'invitation avec envoi d'email)
- `app/api/admin/access-requests/[id]/route.ts` — PUT (approbation d'une demande d'accès, crée aussi une invitation)

Les deux handlers implémentent indépendamment la séquence : création d'un document `Invitation` en base, envoi d'un email via `sendInvitationEmail`, gestion des erreurs d'envoi. Aucun n'utilise `InvitationService` pour cette partie (le service existe mais est réservé à la consommation des tokens, pas à la création).

**Correction :** Extraire `InvitationService.create(email, groupIds)` qui encapsule la création du document + l'envoi de l'email, et l'appeler depuis les deux routes.

---

### 4.2 `InviteMemberModal` dupliqué en deux composants identiques (MINEUR)

**Fichiers :**
- `components/admin/groups/InviteMemberModal.tsx`
- `components/groups/InviteMemberModal.tsx`

Ces deux fichiers implémentent un formulaire d'invitation de membre (champ email, validation, appel API) avec une logique quasi-identique. La différence est uniquement l'endpoint appelé (`/api/admin/groups/[id]/members` vs `/api/groups/[id]/members`). Un unique composant paramétré (`endpoint` prop) remplacerait les deux.

---

## 5. Dette — Validation manquante

### 5.1 Longueur du username non validée côté API (IMPORTANT)

**Fichier :** `app/api/user/profile/route.ts` — handler PATCH

```typescript
// route.ts — aucune validation de longueur
const { username } = await request.json();
await UserRepository.update(auth.userId, { username: username.trim() });
```

Le modèle Mongoose `User` impose `maxlength: 30` mais la contrainte est silencieuse côté client si le username dépasse 30 caractères (Mongoose tronque ou rejette sans message métier). La validation côté API est absente alors que `validateLoginBody()` dans `src/lib/validation.ts` valide le username à la connexion (1–30 chars).

**Correction :**
```typescript
if (!username || username.trim().length < 1 || username.trim().length > 30) {
  return ApiResponse.badRequest('Le nom doit faire entre 1 et 30 caractères');
}
```

---

## 6. Fetch directs dans les composants (PERSISTANT)

**Problème :** Les composants effectuent des appels `fetch()` directs dans des `useEffect`, sans passer par le hook `useFetch<T>` ou des hooks dédiés. Cela génère de la duplication (gestion de loading/error répétée) et rend les composants difficiles à tester.

**Exemples représentatifs :**

| Fichier | Nb fetch() directs | Commentaire |
|---------|------------------|-------------|
| `components/tournament/Tournament.tsx` | 8+ | Tous les fetches d'initialisation |
| `components/ui/PlayerCommentHistory.tsx` | 4 | GET, POST, PUT, DELETE commentaires |
| `components/groups/GroupTournamentScoutingPage.tsx` | 2 | scouting-stats + players |
| `components/tournament/PlayersTab.tsx` | 3 | players, registrations, POST registrations |
| `components/tournament/ConflictResolutionModal.tsx` | 2 | commentaires + résolution conflit |
| `components/groups/GroupTournaments.tsx` | 5 | merge-status (loop), merge, conflicts, etc. |

Le hook `useFetch<T>(url)` (`src/hooks/useFetch.ts`) existe mais n'est utilisé que dans ~20 % des cas. Les composants admin utilisent systématiquement `fetch()` direct — cohérent entre eux mais divergent du pattern documenté.

**Recommandation :** Traiter par vagues lors des prochains découplages de god components, pas en refactor isolé.

---

## 7. Dette TypeScript — `any` dans les pipelines MongoDB (PERSISTANT)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 67, 95, 114, 168 (4 usages)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142, 163, 224 (3 usages)

Ces 7 usages persistent depuis l'audit du 2026-05-11. Ils sont fonctionnellement corrects (pipelines d'agrégation MongoDB complexes) mais pourraient utiliser le type `PipelineStage` de Mongoose v7 :

```typescript
// Au lieu de :
const pipeline: any[] = [{ $match: ... }];

// Utiliser :
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## 8. Couverture de tests — lacunes persistantes

### 5.1 Routes sans tests depuis plusieurs audits

| Route | Méthode | Raison du retard |
|-------|---------|-----------------|
| `/api/tournaments/[id]/admin-groups` | GET | Route utilitaire simple, faible risque |
| `/api/tournaments/[id]/member-groups` | GET | Nouvelle route (PR #207), similaire à admin-groups |
| `/api/groups/[id]/guests/[accessId]` | PUT | Logique d'approbation/révocation — risque moyen |
| `/api/admin/users/[id]/groups` | POST | Ajout admin d'un user à un groupe |
| `/api/admin/groups/[id]/invitations/[invId]` | DELETE | Annulation d'invitation admin |

La route `guests/[accessId]` mérite une attention particulière : elle gère les transitions de statut `PENDING → ACCEPTED/REJECTED/REVOKED` et envoie un email de notification. La logique est non triviale.

### 5.2 Hooks non testés

| Hook | Lignes | Raison |
|------|-------|--------|
| `useTournamentManagement` | 276 | Nouveau hook (extraction de TournamentsPageClient), logique complexe |
| `useScrollGuard` | ~20 | Hook léger, logique tactile simple |
| `useTournamentStats` | — | Signalé depuis l'audit 2026-06-08 |
| `usePlayerHistory` | — | Signalé depuis l'audit 2026-06-08, logique dans player-history.test.ts |

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger immédiatement

1. **Ajouter `getAuthSession()` dans `POST /api/rounds/[roundId]/matchs`** — route ouverte qui permet l'écrasement arbitraire de données de ronde avec un cookie expiré ou révoqué.
2. **Exclure `sessionId` de `SessionRepository.findByUserId()`** — ajouter `.select('-sessionId')` pour éviter l'exposition des tokens d'auth dans l'API admin sessions.

### 🟠 Important — À traiter dans le sprint en cours

3. **Échapper les entrées `$regex` dans 5 repositories** (`UserRepository`, `TournamentRepository`, `TournamentPlayersDeckRepository`, `AuditLogRepository`, `RoundRepository`) — ajouter `escapeRegex()` dans `src/lib/validation.ts` et l'appliquer.
4. **Corriger la requête N+1 dans `GET /api/admin/groups`** — ajouter `findAllWithCounts()` dans `GroupRepository`.
5. **Valider la longueur du username dans `PATCH /api/user/profile`** — contrainte Mongoose silencieuse, pas de retour métier.
6. **Extraire `InvitationService.create()`** pour dédupliquer la logique d'invitation dupliquée entre deux routes admin.

### 🟡 Mineur — Opportunités d'amélioration continue

7. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts` (5 lignes, trivial).
8. Utiliser `isValidEmail()` dans `GroupService.inviteExternal()` à la place du `includes('@')` insuffisant.
9. Valider `expiresAt` (date valide + future) dans la route d'accès externe.
10. Tests pour `guests/[accessId]` — logique d'approbation/révocation non triviale, risque de régression.
11. Tester `member-groups`, `admin-groups`, `admin/users/[id]/groups`, `admin/groups/[id]/invitations/[invId]`.
12. Typer les pipelines avec `PipelineStage[]` (suppression des 7 `any`).
13. Extraire `useTournamentContext` depuis `Tournament.tsx` lors du prochain refacto.
14. Surveiller `PlayerDeckModal.tsx` et `Round.tsx` dès la prochaine feature (proches de 300 lignes).
15. Tester `useTournamentManagement` et `useTournamentStats`.
