# Audit de dette technique — 2026-06-29

**Projet :** Companion Lorcana
**Branche analysée :** `staging`
**Auditeur :** Claude (audit automatique hebdomadaire)
**Date :** 2026-06-29

---

## Résumé exécutif

**Constat préalable, déterminant pour la lecture de cet audit :** `staging` n'a reçu **aucun commit depuis le 2026-06-13**, soit 16 jours. Les audits du 06-15 (PR #202) et du 06-22 (PR #203) ont chacun été générés sur des branches dédiées **jamais mergées dans `staging`**. Un diff entre `staging` et la branche de la PR #203 (hors `reports/`) est vide : le code analysé aujourd'hui est strictement identique à celui audité il y a une semaine. Chaque point a été revérifié indépendamment (lecture directe des fichiers, pas de recopie) plutôt que recopié, et une recherche ciblée de problèmes non encore détectés a été menée sur les 4 catégories du processus d'audit.

**🔴 La découverte critique du 06-22 reste non corrigée 7 jours plus tard :** un changement de rôle via `PATCH /api/admin/users/[id]` ne révoque toujours pas les sessions actives (vérifié ligne par ligne : seul le handler `DELETE` du même fichier appelle `SessionRepository.deleteByUserId`, pas `PATCH`). Un administrateur rétrogradé conserve ses privilèges jusqu'à 12h.

**🟠 Nouvelle découverte de sécurité :** `POST /api/rounds/[roundId]/matchs` (`app/api/rounds/[roundId]/matchs/route.ts:36-44`) n'effectue **aucune vérification de session** ni validation du corps de requête, contrairement au `GET` du même fichier. N'importe quel utilisateur authentifié (y compris un compte invité `isGuest: true`) peut écraser un document `Round` arbitraire via `RoundRepository.upsert({ id, ...body })` avec un body non validé. La route n'est appelée par aucun composant ni hook du frontend (vérifié — `useRound`, `Match.tsx`, `useDeckAssignment` n'utilisent que le `GET` et les sous-routes `/matchs/[matchId]`) : c'est une route orpheline et non testée, mais exploitable par tout compte enregistré.

**🟠 Process en dégradation :** ce sont maintenant **deux** PR de rapport d'audit consécutives (#202 du 06-15, #203 du 06-22) qui s'accumulent sans être mergées, et cette PR sera la troisième. Le rapport le plus récent réellement visible sur `staging` date du 06-08 — trois semaines — alors que deux audits plus récents et plus complets existent, invisibles pour quiconque consulte `staging` directement. Le risque de divergence (et le risque que SEC-01 reste non corrigé encore plus longtemps) s'aggrave chaque semaine.

**Tout le reste de l'audit du 06-22 est confirmé inchangé** (code identique) : `connectToMongoDB()` toujours redondant dans `api-tokens/[tokenId]/route.ts`, exposition de `sessionId` brut dans `/api/admin/users/[id]/sessions`, les 6 composants à `fetch()` directs au lieu de `useFetch`, les 12 god components (mêmes nombres de lignes au caractère près), les 7 `any` justifiés, l'absence de schéma Zod, et les 5 routes API toujours sans tests.

**Nouveaux problèmes mineurs identifiés cette semaine** (recherche élargie, non couverts par les 3 audits précédents) : logique métier (calcul de matrice de matchups, ~50 lignes) dans la route `app/api/tournaments/[id]/stats/route.ts` au lieu d'un service ; composant `InviteMemberModal` dupliqué entre `components/admin/groups/` et `components/groups/` ; pattern de pagination "fetch all pages" dupliqué entre `RegistrationService` et `RoundService` ; 4 casts `as unknown as` révélant des interfaces incomplètes pour des documents Mongoose peuplés (`.populate()`).

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — rôle non révalidé après changement | 🔴 Critique | `src/lib/auth/getAuthSession.ts`, `middleware.ts`, `app/api/admin/users/[id]/route.ts` | 🔁 Persistant (non corrigé depuis le 06-22) |
| 2 | Sécurité — route sans auth ni validation | 🟠 Important | `app/api/rounds/[roundId]/matchs/route.ts:36-44` | 🆕 Nouveau |
| 3 | Process — PR d'audit non mergées (×2, bientôt ×3) | 🟠 Important | `reports/` — PR #202 (14j), PR #203 (7j) | 🔁 Persistant, aggravé |
| 4 | Architecture — connectToMongoDB redondant | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🔁 Persistant (depuis 06-15) |
| 5 | Sécurité — exposition de `sessionId` brut | 🟠 Important | `app/api/admin/users/[id]/sessions/route.ts`, `SessionRepository.ts` | 🔁 Persistant |
| 6 | Architecture — fetch() direct hors hooks | 🟠 Important | 6 composants (voir §2.2 audit 06-22) | 🔁 Persistant |
| 7 | Architecture — logique métier dans une route API | 🟡 Mineur | `app/api/tournaments/[id]/stats/route.ts:41-93` | 🆕 Nouveau |
| 8 | Redondance — composant `InviteMemberModal` dupliqué | 🟡 Mineur | `components/admin/groups/InviteMemberModal.tsx`, `components/groups/InviteMemberModal.tsx` | 🆕 Nouveau |
| 9 | Redondance — pagination "fetch all pages" dupliquée | 🟡 Mineur | `src/services/RegistrationService.ts`, `src/services/RoundService.ts` | 🆕 Nouveau |
| 10 | Dette TS — casts `as unknown as` sur documents peuplés | 🟡 Mineur | `app/admin/invitations/page.tsx`, `app/register/[token]/page.tsx`, `app/api/tournaments/[id]/players/[playerId]/comments/route.ts`, `RoundRepository.ts`, `TournamentRepository.ts` | 🆕 Nouveau |
| 11 | Sécurité — `GroupMagicLink` non projeté | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts:22,40` | 🆕 Nouveau |
| 12 | Redondance — `InkDeck` dupliqué x3 | 🟡 Mineur | `AdminConflictModal.tsx`, `ConflictResolutionModal.tsx`, `UncertaintyModal.tsx` | 🔁 Persistant |
| 13 | Redondance — pattern "blink" dupliqué | 🟡 Mineur | `MatchModal.tsx`, `PlayerDeckModal.tsx` | 🔁 Persistant |
| 14 | Logique métier — `sameCombo` au lieu de `normalizeInkCombo` | 🟡 Mineur | `PlayerDeckModal.tsx` | 🔁 Persistant |
| 15 | Nommage incohérent — `deleteById` vs `delete` | 🟡 Mineur | `GroupInvitationRepository` | 🔁 Persistant |
| 16 | God components (12, stables) | 🟡 Mineur | voir §4 | 🔁 Persistant (lignes identiques) |
| 17 | Couverture tests — 5 routes sans tests | 🟡 Mineur | `guest/my-tournaments`, `magic-link`, `guests`, `admin-groups`, `member-groups` | 🔁 Persistant |
| 18 | Dette transversale — absence de schéma Zod | 🟡 Mineur | `src/lib/validation.ts` | 🔁 Persistant |
| 19 | Dette TS — `any` justifiés (pipelines Mongo) | 🟡 Mineur | `RoundRepository.ts`, `TournamentPlayersDeckRepository.ts` | 🔁 Persistant (justifié) |

### Problèmes corrigés depuis l'audit du 06-08

Aucun — `staging` n'a reçu aucun commit depuis le 06-13, soit avant la création même de la PR #202. Tous les items de l'audit du 06-08 qui restaient ouverts (rate limiting `guest/validate`, `getIp()` centralisé) avaient déjà été corrigés et confirmés le 06-15 ; rien de nouveau n'a pu être corrigé depuis puisqu'aucun code n'a changé.

---

## 1. Sécurité

### 1.1 Changement de rôle non révalidé — privilège persistant après rétrogradation (CRITIQUE, persistant)

**Fichiers :** `src/lib/auth/getAuthSession.ts`, `middleware.ts:34,40-42`, `app/api/admin/users/[id]/route.ts:61`

Revérifié ligne par ligne ce jour. `app/api/admin/users/[id]/route.ts` :

```typescript
// PATCH — ligne 61 : le rôle est mis à jour en base...
if (role !== undefined) updates.role = role;
// ... mais aucun appel à SessionRepository.deleteByUserId n'a lieu ici.

// DELETE — ligne 118-121 : seule la suppression du compte révoque les sessions.
await Promise.all([
  UserRepository.delete(id),
  SessionRepository.deleteByUserId(id),
]);
```

Le rôle servant aux contrôles d'accès (`middleware.ts` pour `/admin/**`, `getAuthSession()` pour les routes API) provient exclusivement du cookie signé au login, jamais relu depuis `User.role` en base. Un admin rétrogradé en `USER` garde donc l'accès admin jusqu'à expiration de sa session (jusqu'à 12h) ou révocation manuelle via `DELETE /api/admin/users/[id]/sessions`.

**Correction recommandée (inchangée depuis le 06-22) :**

```typescript
// app/api/admin/users/[id]/route.ts — après la mise à jour réussie de l'utilisateur
if (role !== undefined && role !== user.role) {
  updates.role = role;
}
// ...
const updatedUser = await UserRepository.update(id, updates);

if (role !== undefined && role !== user.role) {
  await SessionRepository.deleteByUserId(id);
}
```

C'est désormais la **3e semaine consécutive** que ce problème critique est documenté sans correction — voir story SEC-01.

### 1.2 `POST /api/rounds/[roundId]/matchs` sans authentification ni validation (IMPORTANT, nouveau)

**Fichier :** `app/api/rounds/[roundId]/matchs/route.ts:36-44`

```typescript
export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { roundId } = await params;
		const body = await request.json();
		const round = await RoundRepository.upsert({ id: Number(roundId), ...body });
		return ApiResponse.ok(round);
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
```

Contrairement au `GET` du même fichier (qui appelle `getAuthSession`), ce `POST` ne vérifie **aucune session** et ne valide **aucun champ** du body avant de le spreader directement dans `RoundRepository.upsert`. Le middleware bloque les requêtes sans cookie de session valide du tout (redirection `/login`), mais n'importe quel **utilisateur authentifié de n'importe quel rôle** — y compris un compte invité (`isGuest: true`) — peut envoyer un body arbitraire pour écraser le document `Round` d'un tournoi quelconque, en contournant entièrement `RoundService.fetchAndSave` (la voie normale de récupération depuis Ravensburger) et toute notion de scope ou de droit d'écriture.

**Recherche d'usage :** cette route n'est appelée par aucun hook ni composant du frontend (`useRound`, `useDeckAssignment`, `Match.tsx` n'utilisent que `GET /matchs` et `/matchs/[matchId]`/`/assign_deck`). C'est une route orpheline, non testée, probablement un reliquat antérieur à l'introduction de `RoundService.fetchAndSave` via `/api/rounds/fetch`.

**Correction recommandée :**
- Si la route est bien obsolète : la supprimer (vérifier d'abord qu'aucun client externe ne l'utilise — elle n'est pas dans `app/api/external/`, donc peu probable).
- Si elle doit être conservée : ajouter `requireAdminSession` (cohérent avec `RoundService.fetchAndSave`, déjà appelée depuis des contextes admin/fetch) et valider le body plutôt que de le spreader.

### 1.3 `GroupMagicLink` retourné sans projection (MINEUR, nouveau)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts:22,40`

`GroupMagicLinkRepository.findByGroupAndTournament` et `.upsert` retournent le document Mongoose complet, renvoyé tel quel par `GET`/`POST`. L'accès est correctement restreint aux admins du groupe (`GroupRepository.isAdmin`), donc ce n'est pas une fuite vers un tiers non autorisé — mais c'est la même classe de problème que SEC-02 (exposition de champs internes non nécessaires à l'UI, ex. `createdBy`, `_id` Mongoose bruts).

**Correction :** projeter explicitement `{ token, isActive, expiresAt }` côté repository ou route.

### 1.4 Rate limiting et validation — confirmé inchangé

Revérification indépendante des 7 routes publiques mutables (`login`, `forgot-password`, `reset-password/[token]`, `access-requests`, `feedback`, `invitations/[token]`, `guest/validate`) : toutes ont un rate limiting par IP. Aucune route `POST` sans session valide n'a été trouvée sans protection en dehors de la route 1.2 ci-dessus (qui exige une session, mais aucun rôle spécifique). `src/lib/validation.ts` reste 100% manuel, aucune dépendance Zod dans `package.json` — dette transversale inchangée, signalée depuis plusieurs audits.

---

## 2. Architecture

### 2.1 `connectToMongoDB()` redondant — toujours présent (IMPORTANT, persistant depuis le 06-15)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — lignes 6 et 18. Confirmé inchangé ce jour (`grep` direct). 3e semaine sans correction, bloqué par la non-fusion de la PR #202.

### 2.2 Logique métier dans une route API — calcul de matrice de matchups (MINEUR, nouveau)

**Fichier :** `app/api/tournaments/[id]/stats/route.ts:41-93`

La route contient ~50 lignes de logique métier : construction d'une `Map` des decks "fully scouted" par joueur, calcul d'une matrice de victoires/défaites croisant tous les matchs de toutes les rondes du tournoi, déduplication symétrique des clés deckA/deckB :

```typescript
// app/api/tournaments/[id]/stats/route.ts — extrait
const fullyScoutedMap = new Map<number, string>();
// ...
type Matchup = { winsA: number; winsB: number };
const matchups = new Map<string, Matchup>();
for (const match of allMatches) { /* ~30 lignes d'agrégation */ }
```

Cela viole le pattern `Route API → Service → Repository` du projet (CLAUDE.md : « pas de logique métier dans les composants » s'applique de façon équivalente aux routes — elles doivent orchestrer, pas calculer). La route sœur `app/api/groups/[id]/tournaments/[tid]/scouting-stats/route.ts` délègue correctement l'intégralité du calcul au repository, ce qui en fait un bon modèle de référence.

**Correction :** extraire le calcul dans `src/domain/rules/` (ex. `computeMatchupMatrix(allMatches, fullyScoutedMap)`, fonction pure testable) ou dans un service dédié `StatsService.getTournamentStats(tournamentId, scope)`.

### 2.3 fetch() directs hors hooks — confirmé inchangé

Les 6 composants identifiés le 06-22 (`GroupDetailClient.tsx`, `GroupTournaments.tsx`, `GroupDetail.tsx`, `GuestInviteModal.tsx`, `PlayerCommentHistory.tsx`, `TournamentSearchBar.tsx`) sont inchangés (code identique, confirmé par le diff vide global).

---

## 3. Redondances

### 3.1 Composant `InviteMemberModal` dupliqué (MINEUR, nouveau)

**Fichiers :** `components/admin/groups/InviteMemberModal.tsx` (122 lignes), `components/groups/InviteMemberModal.tsx` (129 lignes)

Les deux fichiers réimplémentent une logique quasi identique : recherche debouncée via `/api/users/search`, gestion loading/error, structure JSX de la modale d'invitation. Seules différences réelles : l'endpoint cible (admin vs groupe) et le message de succès affiché.

**Correction :** extraire un composant partagé `components/groups/shared/InviteMemberModal.tsx` paramétré par l'URL d'invitation et le message de succès, importé par les deux contextes (admin et groupe).

### 3.2 Pattern de pagination "fetch all pages" dupliqué (MINEUR, nouveau)

**Fichiers :** `src/services/RegistrationService.ts:17-23`, `src/services/RoundService.ts:62-71`

Les deux services réimplémentent le même algorithme pour interroger `RavensburgerClient` : récupérer la page 1, en déduire le nombre de pages restantes, les récupérer en `Promise.all`, puis concaténer les résultats.

**Correction :** extraire un helper générique dans `src/repositories/external/` ou `src/lib/` :

```typescript
async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  pageSize: number,
): Promise<T[]> { /* ... */ }
```

### 3.3 Redondances confirmées inchangées (persistantes)

- `InkDeck` dupliqué dans `AdminConflictModal.tsx`, `ConflictResolutionModal.tsx`, `UncertaintyModal.tsx`.
- Pattern "blink" (state + `setTimeout` 1000ms) dupliqué entre `MatchModal.tsx` et `PlayerDeckModal.tsx`.
- `sameCombo` local dans `PlayerDeckModal.tsx` au lieu de `normalizeInkCombo`.
- `GroupInvitationRepository.deleteById` vs `delete` dans les 3 autres repositories.

`countDocuments() > 0` au lieu de `Model.exists()` : recherche élargie cette semaine — **aucune occurrence trouvée**, le projet utilise déjà `Model.exists()` partout où c'est pertinent ; les `countDocuments()` restants sont des comptages réels (pagination, stats).

---

## 4. God components — inchangé (code identique, recompté ligne par ligne)

| Composant | Lignes | Tendance |
|-----------|--------|---------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | Stable |
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

Les recommandations de découpage formulées le 06-15/06-22 (extraire `useTournamentContext` de `Tournament.tsx`, `PlayerInkSelector` de `MatchModal.tsx`) restent valides — voir stories REFACTO-01/02.

---

## 5. Dette technique

### 5.1 Casts `as unknown as` révélant des interfaces incomplètes (MINEUR, nouveau)

Quatre emplacements distincts des 7 `any` déjà connus (ceux-ci typent des pipelines d'agrégation Mongo, déjà `eslint-disable`d) :

| Fichier | Ligne(s) | Détail |
|---------|----------|--------|
| `app/admin/invitations/page.tsx` | 41-42 | `invitation.groupIds`/`invitedBy` castés `as unknown as { username: string }` après `.populate()` |
| `app/register/[token]/page.tsx` | 41 | Même cast dupliqué |
| `app/api/tournaments/[id]/players/[playerId]/comments/route.ts` | 47 | `(c.authorId as unknown as { _id: string})._id` |
| `src/repositories/db/RoundRepository.ts` | 315 | Cast de document Mongoose pour `mergeArrayById` |
| `src/repositories/db/TournamentRepository.ts` | 47 | Cast équivalent pour `mergeDeep` |

`IInvitation.groupIds` et `IPlayerComment.authorId` sont typés `ObjectId[]`/`ObjectId` dans leurs modèles respectifs, mais une fois `.populate()` appelé ils deviennent des objets peuplés — l'interface ne reflète pas les deux états possibles, forçant ces casts à chaque usage.

**Correction :** créer des types dédiés à l'état peuplé (ex. `PopulatedInvitation` dans `src/types/`, union `ObjectId | { _id: string; username: string }` pour `authorId`) plutôt que des casts au point d'usage — élimine la duplication entre `app/admin/invitations/page.tsx` et `app/register/[token]/page.tsx`.

### 5.2 Confirmé inchangé

- Aucun fichier `.js`/`.jsx` non migré dans `app/`, `components/`, `src/`, `models/`.
- Aucun `console.log` de debug oublié ; les `console.error` restants (`error.tsx`, `global-error.tsx`, `responses.ts`) sont des usages légitimes d'error boundary/handler générique.
- 7 `any` dans `RoundRepository.ts`/`TournamentPlayersDeckRepository.ts`, tous `eslint-disable`d, pour des pipelines MongoDB — migration vers `PipelineStage[]` toujours possible (story TS-01).
- Mongoose direct hors repositories limité à `app/api/test/seed/route.ts` et `app/api/test/seed/scenarios/route.ts` — infrastructure de seed E2E bloquée en production, tolérée par conception.

---

## 6. Process — accumulation de PR d'audit non mergées (s'aggrave)

Les PR #202 (06-15, ouverte depuis 14 jours) et #203 (06-22, ouverte depuis 7 jours) sont toujours ouvertes. Cette PR sera la **troisième** à s'accumuler si rien n'est fait. Conséquences concrètes :
- La découverte critique SEC-01 (changement de rôle) a été identifiée il y a 7 jours et reste non corrigée — non pas par manque de diagnostic, mais parce que le rapport qui la documente n'a jamais été intégré au flux de travail visible.
- Le rapport "officiel" sur `staging` (06-08) est aujourd'hui daté de 3 semaines et ne mentionne ni SEC-01 ni les god components les plus récents.

**Recommandation, réitérée et urgente :** mergez au minimum la PR la plus récente contenant SEC-01 (#203, ou celle-ci), ou définissez une politique d'auto-merge pour les rapports d'audit (ils ne touchent que `reports/`, jamais le code applicatif — le risque de merge est nul).

---

## Récapitulatif des priorités

### 🔴 Critique — à corriger en priorité absolue

1. **Révoquer les sessions actives lors d'un changement de rôle** (`app/api/admin/users/[id]/route.ts`) — 3 semaines sans correction, ~3 lignes à ajouter.

### 🟠 Important — à corriger rapidement

2. **Sécuriser ou supprimer `POST /api/rounds/[roundId]/matchs`** — route orpheline sans auth ni validation, exploitable par tout compte authentifié.
3. **Merger une PR de rapport d'audit** — au minimum celle contenant SEC-01, pour que la correction soit visible et priorisée.
4. Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts` — en attente depuis le 06-15.
5. Exclure `sessionId` de la réponse `/api/admin/users/[id]/sessions`.
6. Migrer les appels GET directs vers `useFetch` dans les 6 composants identifiés.

### 🟡 Mineur — amélioration continue

7. Extraire la logique de calcul de matchups de `stats/route.ts` vers un service/domaine.
8. Mutualiser `InviteMemberModal` (admin vs groupe).
9. Extraire `fetchAllPages()` partagé entre `RegistrationService` et `RoundService`.
10. Typer les documents Mongoose peuplés pour éliminer les casts `as unknown as`.
11. Mutualiser `InkDeck`, extraire `useBlink()`, remplacer `sameCombo` par `normalizeInkCombo`, aligner `deleteById` → `delete`.
12. Ajouter les tests des 5 routes sans couverture (reporté depuis le 06-15).
13. Typer les pipelines MongoDB avec `PipelineStage[]`.
14. Découper `Tournament.tsx` et `MatchModal.tsx`.
