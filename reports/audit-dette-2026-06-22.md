# Audit de dette technique — 2026-06-22

**Projet :** Companion Lorcana
**Branche analysée :** `staging`
**Auditeur :** Claude (audit automatique hebdomadaire)
**Date :** 2026-06-22

---

## Résumé exécutif

**Constat préalable important :** `staging` n'a reçu **aucun commit** depuis le 2026-06-15 (date de création de la PR #202 contenant l'audit de la semaine dernière, restée **non mergée**). Le diff entre `staging` et la branche de cet audit, hors `reports/`, est vide. Le code analysé cette semaine est donc **strictement identique** à celui audité il y a une semaine — cet audit revérifie indépendamment chaque point plutôt que de le recopier, et a permis de découvrir un problème de sécurité qui n'avait pas été identifié auparavant.

**🔴 Nouvelle découverte critique :** un changement de rôle utilisateur (promotion/rétrogradation) via `PATCH /api/admin/users/[id]` **ne révoque pas les sessions actives**. Le rôle est figé dans le cookie signé au moment du login (`signCookie(sessionId, role)`) et relu depuis le cookie — jamais depuis le document `User` à jour — à la fois dans `middleware.ts` (protection des pages `/admin/**`) et dans `getAuthSession()` (protection des routes API). Un administrateur rétrogradé en `USER` conserve donc ses privilèges admin jusqu'à expiration de sa session (jusqu'à 12h) ou révocation manuelle. C'est un défaut de conception RBAC, pas une régression de code récente — mais il n'avait jamais été signalé.

**Persistant, non corrigé depuis le 06-15 :** `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (ARCH-01 de l'audit précédent) — la PR #202 qui devait le documenter n'a jamais été mergée, et aucun correctif n'a été poussé sur `staging`.

**Nouveau (non détecté par les audits précédents) :** plusieurs composants au-delà de `Tournament.tsx` font des appels `fetch()` directs au lieu de passer par `useFetch` ou un hook dédié — `GroupDetailClient.tsx` (8 occurrences), `GroupTournaments.tsx` (5), `GroupDetail.tsx` (5), `GuestInviteModal.tsx` (4), `PlayerCommentHistory.tsx` (4), `TournamentSearchBar.tsx` (4).

**Stable :** les 12 god components, les 7 `any` justifiés (eslint-disabled) et les 5 routes API sans tests identifiés le 06-15 sont inchangés (code identique).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — rôle non révalidé après changement | 🔴 Critique | `src/lib/auth/getAuthSession.ts`, `middleware.ts`, `app/api/admin/users/[id]/route.ts` | 🆕 Nouveau |
| 2 | Architecture — connectToMongoDB redondant | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🔁 Persistant (depuis 06-15, jamais corrigé) |
| 3 | Sécurité — exposition de `sessionId` brut | 🟠 Important | `app/api/admin/users/[id]/sessions/route.ts`, `src/repositories/db/SessionRepository.ts` | 🆕 Nouveau |
| 4 | Architecture — fetch() direct hors hooks | 🟠 Important | `GroupDetailClient.tsx`, `GroupTournaments.tsx`, `GroupDetail.tsx`, `GuestInviteModal.tsx`, `PlayerCommentHistory.tsx`, `TournamentSearchBar.tsx` | 🆕 Nouveau |
| 5 | Redondance — composant `InkDeck` dupliqué x3 | 🟡 Mineur | `AdminConflictModal.tsx`, `ConflictResolutionModal.tsx`, `UncertaintyModal.tsx` | 🆕 Nouveau |
| 6 | Redondance — pattern "blink" dupliqué | 🟡 Mineur | `MatchModal.tsx`, `PlayerDeckModal.tsx` | 🆕 Nouveau |
| 7 | Logique métier — comparaison de decks locale | 🟡 Mineur | `PlayerDeckModal.tsx` (`sameCombo`) | 🆕 Nouveau |
| 8 | Nommage incohérent — `delete` vs `deleteById` | 🟡 Mineur | `GroupRepository`, `GroupTournamentRepository`, `UserRepository` vs `GroupInvitationRepository` | 🆕 Nouveau |
| 9 | God component — croissant | 🟡 Mineur | `components/tournament/Tournament.tsx` (398L) | 🔁 Persistant (stable depuis 06-15, code inchangé) |
| 10 | God component — croissant | 🟡 Mineur | `components/match/MatchModal.tsx` (357L) | 🔁 Persistant (stable depuis 06-15) |
| 11 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309L) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/round/Round.tsx` (304L) | 🔁 Persistant |
| 13 | God components stables (8 autres) | 🟡 Mineur | voir §3 | 🔁 Persistant |
| 14 | Couverture tests — 5 routes sans tests | 🟡 Mineur | `guest/my-tournaments`, `magic-link`, `guests`, `admin-groups`, `member-groups` | 🔁 Persistant |
| 15 | Dette transversale — absence de schéma de validation déclaratif | 🟡 Mineur | `src/lib/validation.ts` (tout le fichier) | 🔁 Persistant (jamais traité, mentionné depuis plusieurs audits) |
| 16 | Dette TS — `any` justifiés | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` (7 usages) | 🔁 Persistant (justifié) |
| 17 | Process — PR d'audit non mergées s'accumulent | 🟡 Mineur | `reports/` (PR #202 ouverte depuis 7 jours) | 🆕 Observation process |

---

## 1. Sécurité

### 1.1 Changement de rôle non révalidé — privilège persistant après rétrogradation (CRITIQUE)

**Fichiers :** `src/lib/auth/getAuthSession.ts:21-25`, `middleware.ts:34,40-42`, `app/api/admin/users/[id]/route.ts:61`

Le cookie de session signé contient le rôle au format `sessionId|role|signature` (`src/lib/auth/cookieSign.ts:28-32`). Ce rôle est fixé **une seule fois, au login** (`createSession` puis `signCookie`), et n'est ensuite **jamais relu depuis la base** :

```typescript
// src/lib/auth/getAuthSession.ts
export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);     // { sessionId, role } — role vient du COOKIE
  if (!parsed) return null;
  const session = await getSession(parsed.sessionId); // vérifie juste l'existence/expiration
  if (!session) return null;
  return { userId: String(session.userId), role: parsed.role, sessionId: parsed.sessionId };
  //              ^^^^^^^^^^^^^^^^^^^^^^^ rôle du cookie, PAS le rôle actuel du User en base
}
```

`middleware.ts` fait la même chose pour la protection des pages `/admin/**` (ligne 34, `parsed.role !== 'ADMIN'`) — toujours basé sur le cookie.

**Scénario d'exploitation :**
1. Un admin se connecte → reçoit un cookie signé `sessionId|ADMIN|sig`.
2. Un super-utilisateur le rétrograde en `USER` via `PATCH /api/admin/users/[id]` (`updates.role = 'USER'` en base).
3. La session de l'utilisateur rétrogradé n'est **pas révoquée** — `SessionRepository.deleteByUserId` n'est appelé que par l'action explicite *"Révoquer les sessions"* (`DELETE /api/admin/users/[id]/sessions`), jamais automatiquement lors d'un changement de rôle.
4. L'utilisateur rétrogradé continue d'accéder à `/admin/**` et à toutes les routes `requireAdminSession` avec son cookie existant, jusqu'à expiration (fenêtre glissante de 8h, max 12h) ou révocation manuelle.

Le même problème existe en sens inverse pour une attaque interne moins probable : un compte compromis qui a été promu, puis dont la promotion est annulée précipitamment, reste promu tant que sa session vit.

**Correction recommandée — révoquer les sessions automatiquement lors d'un changement de rôle :**

```typescript
// app/api/admin/users/[id]/route.ts — dans PATCH, après la construction de `updates`
if (role !== undefined && role !== user.role) {
  updates.role = role;
}
// ...
const updatedUser = await UserRepository.update(id, updates);

if (role !== undefined && role !== user.role) {
  await SessionRepository.deleteByUserId(id); // force une reconnexion avec le nouveau rôle
}
```

Une alternative plus robuste (mais plus coûteuse) serait de ne plus faire confiance au rôle contenu dans le cookie et de relire `User.role` à chaque requête authentifiée dans `getAuthSession` — cela élimine la fenêtre de désynchronisation sans dépendre d'une révocation explicite à chaque mutation de rôle. Vu le volume de requêtes, la révocation explicite au changement de rôle est le compromis le plus simple à implémenter sans impact de performance.

### 1.2 Exposition de `sessionId` brut dans l'admin (IMPORTANT)

**Fichiers :** `app/api/admin/users/[id]/sessions/route.ts:16-17`, `src/repositories/db/SessionRepository.ts:10-13`

`SessionRepository.findByUserId` retourne les documents `Session` complets (`.lean()`, sans projection), incluant le champ `sessionId` — l'identifiant utilisé comme clé de lookup en base et inscrit dans le cookie signé de l'utilisateur :

```typescript
// src/repositories/db/SessionRepository.ts
async findByUserId(userId: string) {
  await connectToMongoDB();
  return SessionModel.find({ userId }).sort({ lastActivityAt: -1 }).lean(); // pas de .select()
},
```

```typescript
// app/api/admin/users/[id]/sessions/route.ts
const sessions = await SessionRepository.findByUserId(id);
return ApiResponse.ok({ sessions }); // sessionId brut renvoyé tel quel au JSON
```

**Nuance :** ce n'est **pas** une vulnérabilité de prise de contrôle de session directe — `verifyCookie` exige une signature HMAC (`sessionId|role|sig`) calculée avec `SESSION_SECRET`, donc connaître un `sessionId` seul ne permet pas de forger un cookie valide sans connaître le secret. Le risque réel est une violation du principe de minimisation des données : ce champ interne n'apporte aucune valeur à l'UI admin (qui affiche `ipAddress`, `userAgent`, `lastActivityAt`) et élargit inutilement la surface d'exposition (logs, futurs bugs de signature, capture d'écran partagée par un admin, etc.).

**Correction :** projeter les champs nécessaires uniquement.

```typescript
async findByUserId(userId: string) {
  await connectToMongoDB();
  return SessionModel.find({ userId })
    .select('-sessionId')
    .sort({ lastActivityAt: -1 })
    .lean();
},
```

### 1.3 Rate limiting et validation — confirmé inchangé

Vérification indépendante : les 7 routes publiques mutables (`login`, `forgot-password`, `reset-password/[token]`, `access-requests`, `feedback`, `invitations/[token]`, `guest/validate`) ont toutes un rate limiting par IP. Aucune autre route `POST` sans session n'a été trouvée sans protection. `/api/auth/logout` n'a pas de rate limiting mais ne mute pas de données sensibles côté serveur sans session valide (no-op si pas de cookie).

`src/lib/validation.ts` reste 100% manuel (`validateLoginBody`, `validateRegisterBody`, etc., 15 fonctions). Aucune dépendance Zod n'existe dans `package.json`. C'est une dette transversale signalée dans les audits précédents, toujours non traitée — chaque route valide field-by-field sans schéma déclaratif partagé, ce qui rend la cohérence dépendante de la discipline du développeur plutôt que d'un contrat de type vérifié à la compilation.

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant — toujours présent (IMPORTANT, non corrigé)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6 et 18

Identique à la découverte du 06-15 (ARCH-01). La PR #202 contenant cette story n'a jamais été mergée et aucun commit n'a touché ce fichier depuis. Le correctif proposé reste valide :

```typescript
// Supprimer :
import connectToMongoDB from '@/src/lib/db';
// et l'appel :
await connectToMongoDB();
```

### 2.2 Appels `fetch()` directs hors hooks dédiés (IMPORTANT, nouveau)

Le principe CLAUDE.md "appels fetch() directs dans les composants au lieu des hooks dédiés" n'avait été vérifié, jusqu'ici, que sur `Tournament.tsx` (déjà documenté comme god component avec 9 fetch). Un balayage plus large révèle que ce pattern est en fait **répandu** dans le code des composants de groupe :

| Fichier | Occurrences `fetch(` | Détail |
|---------|----------------------|--------|
| `components/admin/groups/GroupDetailClient.tsx` | 8 (lignes 67, 78, 85, 93, 104, 121, 133, 139) | ligne 139 : GET `/api/admin/groups/pinned` sans hook |
| `components/groups/GroupTournaments.tsx` | 5 (lignes 77, 91, 100, 107, 130) | lignes 100/107 : GET conflicts/uncertainties sans hook |
| `components/groups/GroupDetail.tsx` | 5 (lignes 74, 147, 158, 172, 189) | toutes en mutation |
| `components/tournament/GuestInviteModal.tsx` | 4 (lignes 43, 52, 64, 82) | lignes 43/52 : GET direct |
| `components/ui/PlayerCommentHistory.tsx` | 4 (lignes 85, 106, 125, 140) | ligne 85 : GET direct |
| `components/tournament/TournamentSearchBar.tsx` | 4 (lignes 62, 110, 123, 129) | — |

Les appels en mutation (POST/PATCH/DELETE) sont moins problématiques car il n'existe pas d'équivalent générique à `useFetch` pour les mutations dans `src/hooks/`. Les appels **GET** identifiés (pinned groups, conflicts, uncertainties, recherche d'invité, historique de commentaires) devraient en revanche passer par `useFetch<T>(url)`, qui gère déjà loading/error de façon cohérente.

**Recommandation :** ne pas tout migrer d'un coup (risque de régression sur 6 fichiers simultanément) — prioriser `GroupDetailClient.tsx` (le plus chargé, 480 lignes, déjà identifié comme god component) lors de son prochain découpage.

---

## 3. God components — inchangé depuis le 06-15 (code identique)

Toujours **12 composants > 300 lignes**, comptage revérifié ligne par ligne et strictement identique à l'audit précédent (confirmant l'absence de tout commit sur `staging` depuis 7 jours) :

| Composant | Lignes | Tendance |
|-----------|--------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | Stable (pas de nouveau commit pour confirmer/infirmer la tendance de croissance notée le 06-15) |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |
| `components/tournament/PlayerDeckModal.tsx` | 309 | Stable |
| `components/round/Round.tsx` | 304 | Stable |

Les recommandations de découpage de `Tournament.tsx` (extraire `useTournamentContext`) et `MatchModal.tsx` (extraire `PlayerInkSelector`) formulées le 06-15 restent valides — voir stories REFACTO-01/02 reportées.

---

## 4. Redondances

### 4.1 Composant `InkDeck` dupliqué dans 3 modals (MINEUR, nouveau)

**Fichiers :** `components/groups/AdminConflictModal.tsx`, `components/tournament/ConflictResolutionModal.tsx`, `components/groups/UncertaintyModal.tsx`

Chacun définit une fonction locale quasi identique `InkDeck({ decks })` pour afficher une liste de decks (fallback "Aucune encre" si vide). Les trois modals partagent en outre une structure quasi identique (header `AlertTriangle`, grille 2 colonnes version actuelle/proposée, boutons avec état loading par `conflictId`).

**Correction :** extraire un composant partagé `components/ui/InkDeckDisplay.tsx` et envisager un composant de mise en page commun `ConflictModalLayout` si une 4e variante de conflit devait apparaître — pas encore justifié pour 3 occurrences seulement, mais `InkDeck` lui doit être mutualisé dès maintenant (c'est un pur composant d'affichage, sans variation entre les 3 fichiers).

### 4.2 Pattern "blink" dupliqué (MINEUR, nouveau)

**Fichiers :** `components/match/MatchModal.tsx:32-35`, `components/tournament/PlayerDeckModal.tsx:75-85`

Même pattern (state + `setTimeout` 1000ms) pour faire clignoter une zone lors d'une tentative de sélection d'une 3e encre (max 2 autorisées). Copié-collé entre les deux fichiers.

**Correction :** extraire un hook `useBlink(durationMs = 1000)` dans `src/hooks/`, retournant `[isBlinking, triggerBlink]`.

### 4.3 Comparaison de decks locale au lieu de `normalizeInkCombo` (MINEUR, nouveau)

**Fichier :** `components/tournament/PlayerDeckModal.tsx:26-28`

Une fonction locale `sameCombo` compare deux combos d'encres sans passer par `normalizeInkCombo` (`src/domain/value-objects/Ink.ts`), la source de vérité documentée dans CLAUDE.md pour toute comparaison d'encres. Risque : si `sameCombo` ne normalise pas l'ordre, deux combos équivalents mais dans un ordre différent (`['Steel','Amber']` vs `['Amber','Steel']`) pourraient être jugés différents à tort, contrairement à `deduplicateDecks` qui gère bien ce cas.

**Correction :** remplacer `sameCombo` par un appel à `normalizeInkCombo` sur les deux combos avant comparaison, ou réutiliser `deduplicateDecks` si la sémantique le permet.

### 4.4 Nommage incohérent entre repositories (MINEUR, nouveau)

Deux conventions coexistent pour la suppression par ID primaire :
- `delete(id)` — `GroupRepository`, `GroupTournamentRepository`, `UserRepository`
- `deleteById(id)` — `GroupInvitationRepository.ts:71`

**Correction :** renommer `GroupInvitationRepository.deleteById` en `delete` pour s'aligner sur la convention majoritaire (3 repos sur 4).

---

## 5. Dette technique — confirmée inchangée

- **`any` TypeScript (7 usages, justifiés)** : `RoundRepository.ts` (4), `TournamentPlayersDeckRepository.ts` (3), tous avec `eslint-disable-next-line`. Migration vers `PipelineStage[]` (Mongoose v7) toujours possible, non urgente — story TS-01 déjà documentée le 06-15.
- **Aucun fichier `.js` non migré** dans `app/`, `components/`, `src/`, `models/`.
- **`console.error` en production** : présents uniquement dans `app/error.tsx:19`, `app/global-error.tsx:13` (error boundaries — usage légitime) et `src/lib/api/responses.ts:32` (handler générique d'erreur API — usage légitime). Aucun `console.log` de debug oublié détecté.
- **Mongoose direct hors repositories** : confirmé limité aux routes `app/api/test/seed/route.ts` et `app/api/test/seed/scenarios/route.ts` — infrastructure de seed E2E, bloquée en production (`NODE_ENV === 'production'` → 403), tolérée par conception. Aucune autre occurrence dans `app/api/**` ou `src/services/**`.

---

## 6. Process — accumulation de PR d'audit non mergées

La PR #202 (audit du 06-15) est restée ouverte 7 jours sans être mergée ni fermée. Cela crée un risque de divergence croissante entre "ce que dit le dernier rapport mergé sur `staging`" (06-08, désormais daté d'un mois) et "ce qui a réellement été audité" (06-15, plus récent mais invisible pour qui consulte `staging` directement). Recommandation : mergez la PR #202, ou définissez une politique claire (ex. auto-merge des rapports d'audit, qui ne touchent jamais le code applicatif).

---

## Récapitulatif des priorités

### 🔴 Critique — à traiter en premier

1. **Révoquer les sessions actives lors d'un changement de rôle** (`app/api/admin/users/[id]/route.ts`) — ajout de 2-3 lignes, cf. §1.1.

### 🟠 Important — à corriger rapidement

2. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** — toujours en attente depuis le 06-15.
3. **Exclure `sessionId` de la réponse `/api/admin/users/[id]/sessions`** — cf. §1.2.
4. **Migrer les appels GET directs vers `useFetch`** dans `GroupDetailClient.tsx`, `GroupTournaments.tsx`, `GuestInviteModal.tsx`, `PlayerCommentHistory.tsx` — à prioriser lors du prochain découpage de ces god components.

### 🟡 Mineur — amélioration continue

5. Mutualiser `InkDeck` dans un composant partagé (3 fichiers concernés).
6. Extraire `useBlink()` (2 fichiers concernés).
7. Remplacer `sameCombo` par `normalizeInkCombo` dans `PlayerDeckModal.tsx`.
8. Aligner `GroupInvitationRepository.deleteById` → `delete`.
9. Ajouter les tests des 5 routes guest/magic-link/admin-groups/member-groups (reporté du 06-15, toujours non traité).
10. Typer les pipelines MongoDB avec `PipelineStage[]` (reporté du 06-15).
11. Découper `Tournament.tsx` et `MatchModal.tsx` (reporté du 06-15).
12. Merger ou clôturer la PR #202.
