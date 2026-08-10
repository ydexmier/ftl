# Audit de dette technique — 2026-08-10

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-08-10

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, la progression est **nette sur les 4 items prioritaires** : le rate limiting de `/api/guest/validate` est en place, `getIp()` est centralisé dans `src/lib/auth/getIp.ts` et utilisé partout, les tests des routes admin `pin` et `memo` sont complets (15 cas). Aucun `console.log` ne subsiste en production.

**Régression identifiée :** le `connectToMongoDB()` redondant a bien été retiré du route `/api-tokens/route.ts`, mais un fichier adjacent créé dans la même feature — `/api-tokens/[tokenId]/route.ts` — reproduit exactement le même pattern.

**Deux god components supplémentaires** franchissent le seuil des 300 lignes (`PlayerDeckModal.tsx` 309, `Round.tsx` 304), portant le total à 12. Aucun découpage n'a eu lieu depuis l'audit précédent.

**Dette de test en hausse :** 10 routes API n'ont aucun fichier de test associé — dont la route de gestion des accès invités (`groups/[id]/guests/[accessId]`) qui contient une logique approve/reject/revoke de 60 lignes avec envoi d'email. La route `admin/users/[id]/groups` (ajout direct d'un utilisateur à un groupe) est également sans test.

**Performance :** pattern N+1 identifié dans deux routes (`/admin-groups`, `/member-groups`) qui appellent `GroupRepository.findById` dans une boucle `Promise.all` au lieu d'un `findByIds` unique.

**CLAUDE.md outdated :** 3 nouveaux modèles, 3 nouveaux repositories et 1 nouveau service ne sont pas documentés.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18` | 🆕 Nouveau |
| 2 | Performance — N+1 query | 🟠 Important | `app/api/tournaments/[id]/admin-groups/route.ts`, `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 3 | Tests — guest access approve/reject/revoke | 🟠 Important | `app/api/groups/[id]/guests/[accessId]/route.ts` (60 lignes) | 🆕 Nouveau |
| 4 | Tests — admin add user to group | 🟠 Important | `app/api/admin/users/[id]/groups/route.ts` (24 lignes) | 🆕 Nouveau |
| 5 | Tests — magic-link + guests + my-tournaments | 🟡 Mineur | 3 routes du flux accès invité | 🆕 Nouveau |
| 6 | Tests — admin-groups, member-groups | 🟡 Mineur | 2 routes sidebar tournoi | 🆕 Nouveau |
| 7 | Tests — routes simples sans couverture | 🟡 Mineur | `admin/groups/[id]/invitations/[invId]`, `groups/[id]/invitations/[invId]`, `users/search` | 🆕 Nouveau |
| 8 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 10 | Documentation — CLAUDE.md | 🟡 Mineur | 3 modèles, 3 repositories, 1 service non documentés | 🆕 Nouveau |
| 11 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, 7 fetch directs) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 19 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 20 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 21 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (4 usages), `TournamentPlayersDeckRepository.ts` (3 usages) | 🔁 Persistant |
| 22 | Validation — incohérence de style | 🟡 Mineur | Routes mixant validators centralisés et checks inline | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/guest/validate` (🔴 Critique) | ✅ `checkRateLimit('guest-validate:${getIp(request)}')` en place |
| B | `connectToMongoDB()` redondant dans `api-tokens/route.ts` et `external/.../players/route.ts` (🟡 Mineur) | ✅ Supprimé des deux fichiers |
| C | `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisé dans `src/lib/auth/getIp.ts`, utilisé partout |
| D | Tests manquants pour routes admin `pin` et `memo` (🟡 Mineur) | ✅ 9 cas pour pin/pinned, 6 cas pour memo dans les fichiers test existants |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts`  
**Ligne :** 18

```typescript
// route.ts — extrait
import connectToMongoDB from '@/src/lib/db';  // ligne 6

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);       // appelle connectToMongoDB() en interne
  if (!auth) return ApiResponse.unauthorized();
  // ...
  await connectToMongoDB();                          // ← redondant (ligne 18)
  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId); // appelle aussi connectToMongoDB()
```

Ce fichier adjacent au `/api-tokens/route.ts` (corrigé en juin) reproduit exactement le même pattern. `getAuthSession()` et les repositories gèrent leur propre connexion.

**Correction :** Supprimer `import connectToMongoDB from '@/src/lib/db'` et `await connectToMongoDB()`.

---

## 2. Performance

### 2.1 Pattern N+1 query dans les routes sidebar (IMPORTANT)

**Fichiers :**
- `app/api/tournaments/[id]/admin-groups/route.ts` — lignes 21–35
- `app/api/tournaments/[id]/member-groups/route.ts` — lignes 18–33

Ces deux routes ont une structure identique : elles récupèrent les groupes liés au tournoi, puis pour **chaque** groupe font un appel `GroupRepository.findById()` individuel à l'intérieur d'un `Promise.all`. Avec N groupes, cela génère N+1 requêtes MongoDB (1 pour `findGroupsByTournamentId` + N `findById`).

```typescript
// admin-groups/route.ts — pattern N+1
await Promise.all(
  groupTournaments.map(async (gt) => {
    const groupId = String(gt.groupId);
    const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId); // requête 1 par groupe
    if (isAdmin) {
      const group = await GroupRepository.findById(groupId);             // requête 2 par groupe — N+1 ici
      if (group) adminGroups.push({ groupId, groupName: group.name });
    }
  }),
);
```

**Correction :** Pré-charger tous les groupes en une seule requête `findAll()` ou ajouter un `GroupRepository.findByIds(ids)` batch, puis filtrer en mémoire.

```typescript
// Version corrigée
const groupIds = groupTournaments.map((gt) => String(gt.groupId));

// 1 requête batch au lieu de N
const [adminChecks, groups] = await Promise.all([
  Promise.all(groupIds.map((gid) => GroupRepository.isAdmin(gid, auth.userId))),
  GroupRepository.findByIds(groupIds),
]);

const groupMap = Object.fromEntries(groups.map((g) => [String(g._id), g]));
const adminGroups = groupIds
  .filter((_, i) => adminChecks[i])
  .map((gid) => ({ groupId: gid, groupName: groupMap[gid]?.name ?? '' }))
  .filter((g) => g.groupName);
```

Note : `GroupRepository.findByIds` n'existe pas encore — à créer (analogue à `UserRepository.findByIds`).

---

## 3. Tests manquants

### 3.1 Route accès invités — approve/reject/revoke (IMPORTANT)

**Fichier :** `app/api/groups/[id]/guests/[accessId]/route.ts` (60 lignes)

Cette route contient la logique métier la plus complexe parmi les routes non testées : elle gère 3 actions (approve, reject, revoke) avec des transitions d'état, des guards de statut, et un envoi d'email conditionnel (`sendGuestApprovedEmail`). Aucune couverture de test.

**Cas prioritaires :**
- PUT sans auth → 401
- PUT avec action invalide → 400
- PUT approve sur accès non-PENDING → 400
- PUT approve → status ACCEPTED + email envoyé (mock)
- PUT reject → status REJECTED
- PUT revoke sur accès déjà REVOKED → 400
- PUT revoke → status REVOKED
- Non-admin → 403
- accessId inconnu → 404

### 3.2 Route ajout admin d'un utilisateur à un groupe (IMPORTANT)

**Fichier :** `app/api/admin/users/[id]/groups/route.ts` (24 lignes)

Route POST admin qui ajoute directement un utilisateur à un groupe sans passer par une invitation. Action irréversible (l'admin doit ensuite exclure manuellement le membre). Aucune couverture de test.

**Cas prioritaires :**
- POST sans auth → 401
- POST sans groupId → 400
- POST avec groupId inexistant → 404 (via `NOT_FOUND`)
- POST avec userId inexistant → traitement de l'erreur
- POST valide → membre ajouté au groupe

### 3.3 Flux accès invité — routes restantes (MINEUR)

| Route | Lignes | Cas prioritaires |
|-------|--------|-----------------|
| `app/api/groups/[id]/tournaments/[tid]/guests/route.ts` | 38 | GET sans auth → 401 ; non-admin → 403 ; GET → liste les accès PENDING avec username/email |
| `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | 41 | GET → retourne lien existant ou null ; POST crée/remplace le token UUID ; non-admin → 403 |
| `app/api/guest/my-tournaments/route.ts` | 30 | GET sans auth → 401 ; isGuest avec 0 accès → { tournaments: [] } ; GET avec accès → liste triée avec tournamentName |

### 3.4 Routes sidebar tournoi (MINEUR)

| Route | Lignes | Cas prioritaires |
|-------|--------|-----------------|
| `app/api/tournaments/[id]/admin-groups/route.ts` | 40 | GET → retourne uniquement les groupes où l'user est admin ; user non-admin d'un groupe → absent de la liste |
| `app/api/tournaments/[id]/member-groups/route.ts` | 36 | GET → retourne les groupes où l'user est membre ; non-membre d'un groupe → absent de la liste |

### 3.5 Routes simples (MINEUR)

| Route | Lignes | Note |
|-------|--------|------|
| `app/api/admin/groups/[id]/invitations/[invId]/route.ts` | 24 | DELETE annulation d'invitation groupe PENDING |
| `app/api/groups/[id]/invitations/[invId]/route.ts` | 28 | DELETE annulation par l'admin du groupe |
| `app/api/users/search/route.ts` | 15 | GET recherche utilisateurs — utilisé dans `AddToGroupModal` et `InviteMemberModal` |

---

## 4. God components

Le projet compte désormais **12 composants > 300 lignes** (+2 par rapport à l'audit précédent).

### 4.1 Nouveaux composants franchissant le seuil

**`components/tournament/PlayerDeckModal.tsx`** — 309 lignes

Modal d'assignation de deck depuis la vue scouting groupe. Cumule : affichage du joueur (avec historique optionnel), sélection d'encres sur 2 combinaisons, logique de commentaire, transitions d'état loading/saving, et appels API. La section PlayerHistory intégrée à l'intérieur du modal alourdit le tout.

**`components/round/Round.tsx`** — 304 lignes

Composant de vue d'une ronde. Cumule : filtres de matchs (texte, encres, portée), pagination, gestion des decks de match, et rendu de la liste des `MatchCard`. À surveiller lors des prochaines features de filtrage.

### 4.2 God components persistants au-dessus du seuil critique

| Composant | Lignes | Tendance |
|-----------|--------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | Stable (+22 vs audit précédent) |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |

---

## 5. Documentation — CLAUDE.md outdated

Trois modèles, trois repositories et un service sont absents de CLAUDE.md, ce qui peut induire en erreur les développeurs (et les assistants IA) en leur faisant croire que ces abstractions n'existent pas.

**Modèles manquants (`models/`) :**
- `AdminMemo.ts` — mémo privé d'admin sur un utilisateur
- `ApiToken.ts` — tokens d'accès externe (API) pour les groupes/utilisateurs
- `TournamentRegistration.ts` — inscriptions des joueurs à un tournoi (Ravensburger)

**Repositories manquants (`src/repositories/db/`) :**
- `AdminMemoRepository`
- `ApiTokenRepository`
- `TournamentRegistrationRepository`

**Service manquant (`src/services/`) :**
- `RegistrationService` — `fetchAndSave(tournamentId)` (fetch + sauvegarde des inscriptions Ravensburger), `getStatus(tournamentId)` (statut d'import + flag tournamentStarted)

**Routes API manquantes dans CLAUDE.md :**
- `GET /api/user/tournaments/[id]/api-tokens` — liste les tokens API d'un utilisateur pour un tournoi
- `POST /api/user/tournaments/[id]/api-tokens` — crée un token API utilisateur
- `DELETE /api/user/tournaments/[id]/api-tokens/[tokenId]` — révoque un token
- `GET /api/external/tournaments/[id]/players` — accès externe par Bearer token
- `PUT /api/groups/[id]/guests/[accessId]` — approve/reject/revoke d'un accès invité
- `GET /api/groups/[id]/guests/[accessId]` — liste des invités en attente d'un tournoi de groupe
- `GET /api/tournaments/[id]/admin-groups` — groupes où l'user est admin pour ce tournoi
- `GET /api/tournaments/[id]/member-groups` — groupes où l'user est membre pour ce tournoi
- `GET /api/tournaments/[id]/registrations` — statut d'import des inscriptions
- `POST /api/tournaments/[id]/registrations` — déclenche un import des inscriptions Ravensburger

---

## 6. Dette TypeScript persistante

### 6.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

Inchangé depuis l'audit du 2026-06-08. 7 usages dans 2 fichiers :

| Fichier | Lignes | Usages |
|---------|--------|--------|
| `src/repositories/db/RoundRepository.ts` | 67, 95, 114, 168 | 4 |
| `src/repositories/db/TournamentPlayersDeckRepository.ts` | 142, 163, 224 | 3 |

Le typage avec `PipelineStage[]` de Mongoose v7 reste la correction recommandée.

---

## 7. Validation des inputs — incohérence de style

Le projet n'utilise pas Zod. `src/lib/validation.ts` (160 lignes) contient des validators centralisés pour les routes qui les utilisent, mais de nombreuses routes font une validation field-by-field inline sans passer par ce fichier.

**Routes avec validation centralisée (bon pattern) :**
- `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/access-requests`, `POST /api/invitations/[token]`, `POST /api/groups/[id]/tournaments/[tid]/api-tokens`

**Routes avec validation inline (dette) :**
- `PUT /api/user/password/route.ts` — checks directs `newPassword.length`, `currentPassword`
- `PUT /api/player-comments/[commentId]/route.ts` — `content.trim()`, `content.length > 500` inline
- `POST /api/admin/groups/[id]/members/route.ts` — `if (!userId) return ApiResponse.badRequest(...)`

Pas de faille de sécurité identifiée, mais la cohérence de style est compromise.

---

## Récapitulatif des priorités

### 🟠 Important — À corriger dans le prochain sprint

1. **Ajouter des tests pour la route approve/reject/revoke des accès invités** (`groups/[id]/guests/[accessId]`) — logique d'état complexe avec envoi d'email, aucune couverture actuelle.
2. **Ajouter des tests pour la route admin add-user-to-group** (`admin/users/[id]/groups`) — action irréversible sans tests.
3. **Corriger le pattern N+1** dans `admin-groups` et `member-groups` — ajouter `GroupRepository.findByIds` et réécrire les deux routes.

### 🟡 Mineur — Opportunités d'amélioration continue

4. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`.
5. Ajouter tests pour le flux magic-link + guests + my-tournaments (3 routes).
6. Ajouter tests pour admin-groups et member-groups (2 routes).
7. Mettre à jour CLAUDE.md (3 modèles, 3 repositories, 1 service, ~10 routes).
8. Découper `PlayerDeckModal.tsx` (309 lignes) lors de la prochaine feature de scouting.
9. Typer les pipelines MongoDB avec `PipelineStage[]` (7 `any`).
