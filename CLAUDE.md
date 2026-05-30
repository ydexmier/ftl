# CLAUDE.md — Companion Lorcana

Tu es ingénieur senior permanent de ce projet. Tu connais le codebase en profondeur, tu ne réinventes pas ce qui existe, et tu suis les conventions établies sans les remettre en question sauf si on te le demande explicitement.

---

## Projet

**Companion Lorcana** — Application compagnon pour les tournois Disney Lorcana TCG.

Fonctionnalités principales :
- Récupération des données de tournoi et rondes depuis l'API Ravensburger
- **Scouting** : assignation des combinaisons d'encres (decks) aux joueurs, avec 3 portées (utilisateur / groupe / tournoi)
- **Groupes** : gestion collaborative des tournois, invitation de membres, conflits de decks, accès externes temporaires
- **Conflits** : workflow de résolution PENDING → PENDING_ADMIN → APPROVED/REJECTED/UNCERTAINTY
- **Accès invités temporaires** : invitation externe par email (magic link), cookie `guest_session`, accès restreint au tournoi concerné — l'invité saisit un pseudo et peut assigner des decks et commenter sans compte
- **Système d'invitation** par email pour la création de comptes utilisateurs
- **Demandes d'accès** : formulaire public pour demander un accès (sans invitation directe)
- **Feedback utilisateur** : signalement de bugs et demandes d'améliorations
- **Onboarding** : tour guidé Driver.js pour les nouveaux utilisateurs

---

## Stack technique

### Framework & Runtime
- **Next.js 15.5.18** — App Router exclusivement (pas de Pages Router)
- **React 19** — Server Components par défaut, Client Components uniquement si nécessaire (`'use client'`)
- **TypeScript** — mode strict activé, pas de `any` sauf cas exceptionnel justifié
- **Node.js 22**

### Base de données
- **MongoDB** via **Mongoose v7**
- Connexion singleton dans `src/lib/db.ts` (cache global `__mongoose`)
- Schémas et modèles dans `models/`
- Repositories dans `src/repositories/db/` encapsulent tout accès Mongoose

### Styling
- **Tailwind CSS v4** — design system OKLCH dark (`class="dark"` sur `<html>`)
- **CVA** (class-variance-authority) — variantes de composants
- **clsx** + **tailwind-merge** (via `cn()` dans `components/ui/cn.ts`) — composition de classes
- Pas de CSS modules, pas de styled-components, pas de MUI

### Email
- **Resend** — envoi en production (nécessite un domaine vérifié)
- **Nodemailer** + **Mailpit** — envoi en développement local (mail catcher sur `localhost:1025`)
- **@react-email/components** + **@react-email/render** — templates email en React
- Switch prod/dev automatique via `NODE_ENV` dans `src/lib/email.ts`

### Authentification & Sécurité
- Sessions stockées en MongoDB (`models/Session.ts`), TTL absolu **12h** / inactivité **8h** (dimensionné pour une journée de tournoi)
- Cookie `session` : maxAge **8h**, synchronisé avec la fenêtre d'inactivité DB — les deux horloges sont identiques
- **`SessionGuard`** (`app/providers.tsx`) : poll `/api/auth/refresh` toutes les **4 min** quand l'onglet est actif + `visibilitychange` au retour sur l'onglet → redirect `/login?reason=expired` si session morte
- **`/api/auth/refresh`** : valide la session en DB et ré-émet le cookie avec 8h frais (renouvellement du sliding window côté cookie et côté DB simultanément)
- Le middleware Next.js (Edge Runtime) vérifie uniquement la signature HMAC du cookie — il ne peut pas interroger MongoDB. La vérification DB complète se fait dans `getAuthSession()` (routes API) et `getServerUser()` (Server Components)
- Cookies signés HMAC-SHA256 (`SESSION_SECRET`) via Web Crypto API (`src/lib/auth/cookieSign.ts`)
- Hachage des mots de passe **Argon2id** (`argon2`) — `src/lib/auth/password.ts`
- RBAC : `USER < ADMIN < SUPERUSER` — `src/lib/auth/rbac.ts`
- Rate limiting en mémoire : 5 tentatives / 15min par IP — `src/lib/auth/rateLimit.ts`
- Audit log sur toutes les actions sensibles (`models/AuditLog.ts`, TTL 48h)
- **hCaptcha** sur les endpoints publics (registration, access-request) — `src/lib/hcaptcha.ts`

### Bibliothèques notables
- **Zustand v5** — gestion d'état client (initialisé dans `app/providers.tsx`)
- **Driver.js v1** — tours guidés onboarding (`components/ui/OnboardingTour.tsx`, `TournamentTour.tsx`)
- **Ramda v0.30** — utilitaires fonctionnels
- **uuid v14** — génération d'identifiants
- **js-cookie** + **cookie** — gestion cookies côté client

### Tests
- **Vitest v4** — runner de tests unitaires et d'intégration
- **MongoDB Memory Server v11** — base de données en mémoire pour les tests d'intégration
- Tests dans `src/__tests__/` (28 fichiers), helpers dans `src/test/`
- Email mocké, `connectToMongoDB` mocké en no-op (mongoose déjà connecté)
- **Playwright v1** — tests E2E navigateur (Chromium uniquement)
  - Config : `playwright.config.ts` — port 3001, DB `ftl_e2e`, workers=1 (DB partagée)
  - Tests dans `e2e/tests/`, fixtures dans `e2e/fixtures/index.ts`
  - Seed endpoints : `POST /api/test/seed` (données de base) + `POST /api/test/seed/scenarios` (GroupTournament + decks + conflits)
  - Bloqués en production (`NODE_ENV === 'production'` → 403) ; `/api/test/` est dans les routes publiques du middleware

### Infrastructure locale
- **Docker Compose** — orchestre MongoDB + Mailpit en local
- Lancer avec `docker compose up -d` avant `npm run dev`

### Icônes
- **Lucide React** — bibliothèque d'icônes unique, pas d'autres librairies d'icônes

---

## Architecture

```
app/                              — Next.js App Router
  (public)/                       — Layout avec header (utilisateurs connectés)
    page.tsx                      — Page d'accueil / dashboard
    profile/                      — Page profil utilisateur
    tournaments/
      page.tsx                    — Liste des tournois
      [tournamentId]/
        page.tsx                  — Détail d'un tournoi (onglets Players, Reports)
        rounds/[roundId]/matchs/[matchId]/page.tsx  — Détail d'un match
    groups/
      page.tsx                    — Liste des groupes de l'utilisateur
      [id]/
        page.tsx                  — Détail d'un groupe
        tournaments/page.tsx      — Tournois du groupe
  admin/                          — Pages admin (ADMIN/SUPERUSER uniquement)
    dashboard/                    — Tableau de bord stats
    users/[id]/                   — Gestion utilisateurs
    invitations/                  — Invitations en masse
    tournaments/[id]/             — Gestion tournois
    audit-logs/                   — Journal d'audit
    feedback/                     — Feedbacks utilisateurs
    access-requests/              — Demandes d'accès
  api/                            — Route handlers (voir section Routes API)
  access-request/                 — Formulaire public de demande d'accès
  guest/[token]/                  — Page d'accueil invité (saisie du pseudo, validation magic link)
  login/                          — Page de connexion
  forgot-password/                — Demande de réinitialisation
  reset-password/[token]/         — Formulaire nouveau mot de passe
  register/[token]/               — Inscription via invitation

components/
  ui/                             — Primitives partagées
    Button.tsx, Input.tsx, Badge.tsx, Alert.tsx, Select.tsx
    Tabs.tsx, Tooltip.tsx, Spinner.tsx
    Ink.tsx, InkButton.tsx, DeckSelection.tsx
    FeedbackWidget.tsx            — Widget flottant de feedback
    HCaptchaWidget.tsx            — Wrapper hCaptcha
    FetchButton.tsx, Layout.tsx
    OnboardingTour.tsx, TournamentTour.tsx, TournamentsTour.tsx
    cn.ts                         — clsx + tailwind-merge
  admin/                          — Composants admin
  tournament/                     — Vues tournoi (PlayersTab, ReportsTab, ConflictResolutionModal…)
  round/                          — Vues ronde (Round, RoundHeader, DeckbuildingRound…)
  match/                          — Vues match (Match, MatchCard, MatchModal)
  groups/                         — Gestion groupes (GroupDetail, InviteMemberModal, AdminConflictModal…)

models/                           — Schémas Mongoose (voir section Modèles)

src/
  __tests__/                      — Tests d'intégration (26 fichiers)
  domain/
    rules/                        — matchRules, roundRules, scoutingRules
    value-objects/                — Ink, MatchStatus, RoundType
  hooks/
    useFetch.ts                   — Hook générique GET avec loading/error
    useTournament.ts              — Tournoi + refreshTournament()
    useRound.ts                   — Matches paginés avec decks
    useDeckAssignment.ts          — État formulaire d'assignation
    useDebounce.ts
  lib/
    api/                          — ApiResponse (responses.ts), apiFetch.ts
    auth/                         — session, cookieSign, password, rbac, rateLimit
                                    getAuthSession.ts, getServerUser.ts, guestSession.ts
    email.ts                      — sendInvitationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendGuestInvitationEmail
    emails/                       — Templates React Email (Invitation, Welcome, PasswordReset, GuestInvitation)
    db.ts                         — Singleton connexion MongoDB
    hcaptcha.ts                   — verifyHcaptcha()
    constants.ts                  — FETCH_ALL_ASYNC
    date.ts, mergeDeep.ts, validation.ts
  repositories/
    db/                           — Accès MongoDB (voir section Repositories)
    external/                     — RavensburgerClient.ts
  services/                       — Orchestration métier (voir section Services)
  test/                           — setup.ts, helpers.ts
  types/                          — Interfaces TypeScript (ink, player, match, round, tournament, group, ranking)
```

---

## Modèles Mongoose (`models/`)

| Modèle | Champs clés | Rôle |
|--------|-------------|------|
| **User** | `username`, `email`, `passwordHash`, `role` (USER/ADMIN/SUPERUSER), `onboardingCompletedAt` | Compte utilisateur |
| **Session** | `sessionId`, `userId`, `role`, `expiresAt` (TTL 8h), `lastActivityAt` | Sessions (TTL 30min inactivité) |
| **AuditLog** | `action`, `userId`, `username`, `ipAddress`, `timestamp`, `metadata` | Audit trail (TTL 48h) |
| **Invitation** | `email`, `token`, `groupIds[]`, `status` (PENDING/USED/EXPIRED/CANCELLED), `expiresAt` | Invitations signup |
| **PasswordReset** | `userId`, `token`, `expiresAt`, `usedAt` | Tokens reset mdp |
| **Group** | `name`, `description`, `createdBy`, `members[]` (userId, role, joinedAt, invitedBy) | Groupes utilisateurs |
| **GroupInvitation** | `groupId`, `invitedUserId`, `invitedBy`, `status` (PENDING/ACCEPTED/REJECTED), `expiresAt` | Invitations groupe |
| **GroupTournament** | `groupId`, `tournamentId`, `addedBy`, `status` (ACTIVE/ARCHIVED) | Tournois attachés à un groupe |
| **Tournament** | `id` (number), `name`, `start_datetime`, `store`, `tournament_phases[]`, `gameplay_format` | Données Ravensburger |
| **Round** | `id` (number), `tournamentId`, `results[]` (matches imbriqués), `lastFetchedAt` | Rondes Ravensburger |
| **Ranking** | `id_tournament`, `count`, `total`, `results[]` (classements joueurs) | Classements Ravensburger |
| **TournamentPlayersDeck** | `tournamentId`, `groupId` (nullable), `userId` (nullable), `players[]` | Decks par portée (user/group/tournament) |
| **TournamentConflict** | `userId`, `groupId`, `tournamentId`, `playerId`, `status` (PENDING/PENDING_ADMIN/APPROVED/REJECTED/UNCERTAINTY), `previousInks`, `proposedInks`, `resolvedInks` | Conflits d'assignation de deck |
| **TournamentExternalAccess** | `groupId`, `tournamentId`, `email`, `accessToken` (UUID unique), `invitedBy`, `displayName` (nullable, renseigné à l'acceptation), `status` (PENDING/ACCEPTED/REVOKED/EXPIRED), `expiresAt` (TTL) | Accès invités temporaires par magic link |
| **PlayerComment** | `tournamentId`, `playerId`, `authorId` (nullable), `guestAccessId` (nullable, ref TournamentExternalAccess), `guestDisplayName` (nullable), `groupId`, `inks[]`, `content` | Commentaires sur les joueurs (auteur OU invité) |
| **ScoutingReport** | `userId` (nullable), `guestAccessId` (nullable), `groupId`, `tournamentId`, `playerId`, `createdAt` | Audit trail scouting (utilisateur OU invité) |
| **UserTournament** | `userId`, `tournamentId`, `status` (ACTIVE/ARCHIVED) | Tournois d'un utilisateur |
| **AccessRequest** | `email`, `reason`, `status` (PENDING/APPROVED/REJECTED), `reviewedBy` | Demandes d'accès publiques |
| **Feedback** | `type` (bug/improvement), `title`, `description`, `page`, `userId`, `status` (open/in-progress/done/closed) | Feedbacks utilisateurs |

---

## Repositories (`src/repositories/db/`)

Chaque repository expose des méthodes nommées, pas de classes. Accès Mongoose exclusif ici.

- **TournamentRepository** — `findAll`, `findById`, `findByIds`, `search`, `upsert`, `deleteById`, `mergeAndSave`
- **UserRepository** — `findWithFilters`, `findById`, `findByIds`, `existsByUsername`, `existsByEmail`, `create`, `update`, `updatePassword`, `delete`, `markOnboardingComplete`
- **GroupRepository** — `findById`, `findByMemberId`, `create`, `update`, `delete`, `addMember`, `removeMember`, `updateMemberRole`, `isAdmin`, `isMember`, `addMemberToGroups`
- **RoundRepository** — `findById`, `findByIdWithDecks`, `upsert`, `deleteMany`, `findMatchesPaginated`, `mergeAndSave`
- **TournamentPlayersDeckRepository** — `findByScope`, `assignDecks`, `createOne`, `deleteMany`, `upsertMissingPlayers`, `upsertMissingPlayersAllExisting`, `syncPlayerIdentifiers`
- **GroupTournamentRepository** — `findByGroupId`, `findByTournamentId`, `create`, `updateStatus`, `delete`
- **TournamentConflictRepository** — `findById`, `findPendingForUser`, `findAllPendingAdminByGroup`, `findAllUncertaintyByGroup`, `create`, `createMany`, `updateStatus`
- **TournamentExternalAccessRepository** — `findById`, `findByGroupAndTournament`, `findByAccessToken`, `create`, `setDisplayName` (+ passe status ACCEPTED), `revokeAccess` (status REVOKED), `hasActiveAccessByEmail`
- **PlayerCommentRepository** — `findByPlayer`, `create`, `update`, `delete`, `deleteByGuestAccessId`, `countByPlayers`
- **ScoutingReportRepository** — `findByScope`, `create`, `deleteManyByGuestAccessId`
- **InvitationRepository**, **GroupInvitationRepository**, **SessionRepository**, **AuditLogRepository**, **PasswordResetRepository**, **FeedbackRepository**, **AccessRequestRepository**, **UserTournamentRepository**
- **RavensburgerClient** (`src/repositories/external/`) — `fetchTournament(id)`, `fetchRound(id, page, pageSize)`, `fetchRank(id, page, pageSize)`

---

## Services (`src/services/`)

| Service | Responsabilités |
|---------|----------------|
| **TournamentService** | `fetchAndSave(id)` depuis Ravensburger, `getAll`, `getById`, `delete` (cascade rounds + decks) |
| **GroupService** | CRUD groupes, membres, invitations, tournois de groupe, `acceptGroupInvitation`, `inviteExternal(groupId, tournamentId, email, expiresAt, adminId)` (génère token UUID, envoie magic link), `revokeExternalAccess(accessId, adminId)` |
| **RoundService** | `fetchAndSave(tournamentId, roundId, options, scope)`, `getMatchesPaginated(roundId, options, scope)` |
| **ScoutingService** | `assignDecks(roundId, matchId, assignments, scope, reporter: Reporter)` — assigne et crée `ScoutingReport` ; `Reporter = { userId } | { guestAccessId, guestDisplayName }` — valide via `assertReporter()` |
| **ConflictService** | `getUserPendingConflicts`, `getGroupPendingAdminConflicts`, `getGroupUncertainties`, `resolveMemberConflict`, `resolveAdminConflict` |
| **InvitationService** | `register(token, username, password)` — crée l'user, l'ajoute aux groupes, envoie welcome email |
| **DataMergeService** | `mergeOnGroupJoin(userId, groupId)` — fusionne les decks personnels dans le groupe, crée des conflits si divergence |

---

## Routes API (`app/api/`)

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Login + rate limiting + audit log |
| POST | `/api/auth/logout` | Invalidation session |
| POST | `/api/auth/forgot-password` | Envoi email reset mdp |
| POST | `/api/auth/reset-password/[token]` | Soumission nouveau mdp |
| GET | `/api/auth/me` | Info session courante |

### User
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/PUT | `/api/user/profile` | Profil utilisateur |
| POST | `/api/user/password` | Changement mdp |
| POST | `/api/user/onboarding` | Marquer onboarding terminé |
| GET | `/api/user/tournaments/[id]` | Statut tournoi pour l'utilisateur |

### Groupes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/groups` | Liste / création |
| GET/PUT/DELETE | `/api/groups/[id]` | Détail groupe |
| GET/POST | `/api/groups/[id]/members` | Membres |
| GET/PUT/DELETE | `/api/groups/[id]/members/[userId]` | Gestion membre |
| GET | `/api/groups/[id]/my-role` | Rôle de l'utilisateur dans le groupe |
| GET/POST | `/api/groups/[id]/tournaments` | Tournois du groupe |
| GET/PUT/DELETE | `/api/groups/[id]/tournaments/[tid]` | Tournoi de groupe |
| GET/POST | `/api/groups/[id]/tournaments/[tid]/reports` | Rapports scouting du groupe |
| GET/POST | `/api/groups/[id]/tournaments/[tid]/external-access` | Accès externes (POST : envoie magic link par email) |
| GET/POST | `/api/groups/[id]/conflicts` | Conflits du groupe |
| GET/PUT | `/api/groups/[id]/conflicts/[conflictId]` | Résolution conflit |
| GET | `/api/groups/[id]/uncertainties` | Conflits UNCERTAINTY |
| GET/POST | `/api/groups/invitations` | Invitations groupe |
| GET/PUT | `/api/groups/invitations/[invId]` | Accepter/refuser invitation |
| DELETE | `/api/groups/external-access/[accessId]` | Révoquer un accès invité (admin) |

### Tournois
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/tournaments` | Liste / ajout |
| GET/DELETE | `/api/tournaments/[id]` | Détail / suppression |
| GET | `/api/tournaments/search` | Recherche par nom ou ID |
| POST | `/api/tournaments/fetch` | Import depuis Ravensburger (tout utilisateur authentifié) |
| GET/POST | `/api/tournaments/[id]/players` | Joueurs + decks |
| POST | `/api/tournaments/[id]/players/[playerId]/assign_deck` | Assignation deck (portée tournoi/user) |
| GET/POST | `/api/tournaments/[id]/conflicts` | Conflits du tournoi |
| PUT | `/api/tournaments/[id]/conflicts/[conflictId]` | Résolution conflit |
| POST | `/api/tournaments/[id]/link` | Rattacher à un groupe |

### Rondes & Matchs
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/rounds/fetch` | Import ronde depuis Ravensburger (tout utilisateur authentifié) |
| GET/POST | `/api/rounds/[roundId]/matchs` | Matches paginés avec decks |
| GET/PUT | `/api/rounds/[roundId]/matchs/[matchId]` | Détail match |
| POST | `/api/rounds/[roundId]/matchs/[matchId]/assign_deck` | Assignation deck depuis un match |

### Admin (ADMIN/SUPERUSER)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/admin/users` | Gestion utilisateurs |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Détail utilisateur |
| GET | `/api/admin/users/[id]/sessions` | Sessions d'un utilisateur |
| GET | `/api/admin/users/[id]/reports` | Rapports scouting d'un utilisateur |
| GET/POST | `/api/admin/invitations` | Invitations en masse |
| PUT/DELETE | `/api/admin/invitations/[id]` | Gestion invitation |
| GET/POST | `/api/admin/tournaments` | Tournois en admin |
| POST | `/api/admin/fetchTournament` | Fetch depuis Ravensburger |
| POST | `/api/admin/fetchRound` | Fetch ronde depuis Ravensburger |
| GET/POST | `/api/admin/audit-logs` | Journal d'audit |
| GET/POST | `/api/admin/feedback` | Feedbacks |
| PUT/DELETE | `/api/admin/feedback/[id]` | Gestion feedback |
| GET/POST | `/api/admin/access-requests` | Demandes d'accès |
| PUT/DELETE | `/api/admin/access-requests/[id]` | Traitement demande |
| GET | `/api/admin/groups` | Liste des groupes |
| GET | `/api/admin/stats` | Statistiques dashboard |

### Invités (sans compte)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/guest/validate` | Valider le token magic link, saisir le pseudo, poser le cookie `guest_session` |

### Public
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/invitations/[token]` | Inscription via token d'invitation |
| POST | `/api/access-requests` | Soumission demande d'accès (hCaptcha) |
| POST | `/api/feedback` | Soumission feedback utilisateur |

---

## Middleware (`middleware.ts`)

- **Routes publiques** : `/login`, `/forgot-password`, `/access-request`, `/api/auth/**`, `/api/invitations/[token]`, `/api/access-requests`, `/register/[token]/**`, `/reset-password/[token]/**`, `/guest/**`, `/api/guest/**`
- **Fichiers statiques** : `/_next`, `/favicon.ico`, `/svg`, `/images` — passent sans contrôle
- Sur les routes protégées : vérifie le cookie `session` via HMAC, redirige vers `/login` si absent ou invalide
- Sur `/admin/**` : vérifie que le rôle est ADMIN ou SUPERUSER, sinon redirige vers `/`
- Headers injectés dans les API routes : `x-user-id` (sessionId), `x-user-role` — **NE PAS utiliser directement**, utiliser `getAuthSession(request)` qui relit le cookie et la session MongoDB
- **Cookie `guest_session`** : si le cookie `session` est absent/invalide, le middleware tente `verifyGuestCookie` (HMAC uniquement, compatible Edge Runtime). Si valide, il vérifie que la route est autorisée (`/tournaments/[id]/**`, `/api/rounds/**`, `/api/tournaments/**`) et injecte les headers `x-guest-access-id`, `x-guest-tournament-id`, `x-guest-group-id`. Route non autorisée ou cookie invalide → redirect `/login`.

---

## Patterns clés

### Portées de deck (Three-Scope Storage)
Les decks sont stockés dans `TournamentPlayersDeck` selon 3 portées :
- **Tournoi** : `{ tournamentId, groupId: null, userId: null }` — vue globale du tournoi
- **Groupe** : `{ tournamentId, groupId, userId: null }` — vue partagée du groupe
- **Utilisateur** : `{ tournamentId, groupId: null, userId }` — vue personnelle

`TournamentPlayersDeckRepository.findByScope(tournamentId, scope)` sélectionne la bonne entrée.

### Workflow des conflits
Déclenché quand deux portées ont des decks différents pour le même joueur (ex. à l'entrée d'un utilisateur dans un groupe via `DataMergeService`) :
```
PENDING → (membre) → PENDING_ADMIN (escalade) ou UNCERTAINTY (incertitude signalée)
PENDING_ADMIN → (admin) → APPROVED (decks résolus) ou REJECTED
```

### Fusion des données à l'entrée dans un groupe
`DataMergeService.mergeOnGroupJoin(userId, groupId)` est appelé automatiquement quand un utilisateur accepte une invitation de groupe. Il copie ses decks personnels dans la portée groupe et crée des `TournamentConflict` si les assignations diffèrent de celles déjà présentes dans le groupe.

### Récupération async des rondes
`NEXT_PUBLIC_USE_ASYNC_FETCH=true` active `FETCH_ALL_ASYNC` qui récupère toutes les pages d'une ronde en parallèle (utile pour les gros tournois). Contrôlé dans `src/lib/constants.ts`.

### Assignation de deck depuis la vue match
`POST /api/rounds/[roundId]/matchs/[matchId]/assign_deck` — portée déterminée par les paramètres (`userId`, `groupId` ou ni l'un ni l'autre pour la portée tournoi). Délégue à `ScoutingService.assignDecks`.

### Accès invité (Guest Access)

Flux complet d'un accès invité temporaire :

1. **Admin** invite un externe via `POST /api/groups/[id]/tournaments/[tid]/external-access` avec `{ email, expiresAt }`.
2. **GroupService.inviteExternal** génère un `accessToken` UUID, crée un `TournamentExternalAccess` (status PENDING), envoie un email magic link via `sendGuestInvitationEmail`.
3. **Invité** clique le lien → `app/guest/[token]/page.tsx` — saisit son pseudo (displayName).
4. **`POST /api/guest/validate`** — valide le token (existence, non révoqué, non expiré), valide le displayName (requis, max 50 chars, pas de `|`), appelle `TournamentExternalAccessRepository.setDisplayName` (status → ACCEPTED), pose le cookie `guest_session` httpOnly signé HMAC.
5. **Cookie `guest_session`** format : `accessId|tournamentId|groupId|displayName|sig` (le `|` est interdit dans displayName pour préserver le parsing). MaxAge : 8h (`GUEST_COOKIE_MAX_AGE`).
6. **Middleware** vérifie la signature HMAC (Edge Runtime, sans DB). Headers `x-guest-*` injectés sur les routes autorisées.
7. **Routes API** : `getGuestSession(request)` (`src/lib/auth/guestSession.ts`) relit le cookie ET vérifie en DB que le status est ACCEPTED et non expiré. Retourne `{ accessId, tournamentId, groupId, displayName } | null`.
8. **Portée** : les invités opèrent toujours en portée groupe (`groupId` issu du cookie).
9. **Identité dans les données** : `Reporter = { userId } | { guestAccessId, guestDisplayName }` — validé dans `ScoutingService.assertReporter()`. Le `guestDisplayName` est dénormalisé dans `PlayerComment` pour éviter un populate supplémentaire.
10. **Révocation** : `DELETE /api/groups/external-access/[accessId]` → status REVOKED → `getGuestSession` retourne null → plus d'accès même avec cookie valide.

### Ordre canonique des encres
Les combinaisons d'encres sont toujours stockées et affichées dans l'ordre canonique : **Amber → Amethyst → Emerald → Ruby → Sapphire → Steel** (jaune → violet → vert → rouge → bleu → gris).

- La fonction `normalizeInkCombo(inks: string[])` dans `src/domain/value-objects/Ink.ts` est la source de vérité.
- **À l'écriture** : `TournamentPlayersDeckRepository.assignDecks` normalise chaque deck avant sauvegarde.
- **À la lecture** : `TournamentPlayersDeckRepository.findByScope` normalise défensivement les données retournées (couvre les données historiques non-canoniques).
- **`deduplicateDecks`** (`src/domain/rules/scoutingRules.ts`) fusionne les combos d'ordre inversé (ex. `['Steel', 'Amber']` et `['Amber', 'Steel']` comptent comme un seul).
- Ne jamais utiliser `.sort()` sur un tableau d'encres — toujours passer par `normalizeInkCombo`.

---

## Principes d'architecture

- **Server Components par défaut** — `'use client'` uniquement si interaction utilisateur ou hooks nécessaires
- **Pas de logique métier dans les composants React** — les composants sont purement présentationnels
- **Les routes API** → Services → Repositories → Mongoose (jamais de saut de couche)
- **Accès MongoDB exclusivement via les repositories** (`src/repositories/db/`) — jamais de requêtes Mongoose directes dans les routes ou services
- **`ApiResponse`** (`src/lib/api/responses.ts`) pour toutes les réponses HTTP
- **`getAuthSession(request)`** pour l'auth dans les routes API — relit le cookie + la session MongoDB, retourne `AuthSession | null`
- **`getGuestSession(request)`** pour l'auth invité dans les routes API — relit le cookie `guest_session` + vérifie en DB (status ACCEPTED, non expiré), retourne `{ accessId, tournamentId, groupId, displayName } | null`
- **`requireAdminSession(request)`** pour les routes admin — appelle `getAuthSession` + vérifie le rôle ADMIN, retourne `{ session: AuthSession } | { error: NextResponse }` — usage : `const result = await requireAdminSession(request); if ('error' in result) return result.error; const { session } = result;`
- **`getServerUser()`** dans les Server Components — ne pas utiliser dans les API routes
- **Types dans `src/types/`** — pas de types inline dans les composants ou routes
- **Hooks React** dans `src/hooks/` — `useFetch<T>(url)` est le hook de fetching client standard (pas de React Query)

---

## Règles de développement

### Branches
Toujours créer une nouvelle branche depuis `staging` (origin) avant de commencer :

```bash
git fetch origin
git checkout -b claude/feat/nom-de-la-feature origin/staging   # nouvelle feature
git checkout -b claude/evol/nom-de-l-evolution origin/staging  # évolution/amélioration
git checkout -b claude/bug/description-du-bug origin/staging   # correction de bug
```

### Workflow complet pour chaque développement

**1. Analyser** — lire les fichiers existants avant d'écrire quoi que ce soit. Ne jamais inventer un fichier ou une fonction sans vérifier qu'il n'existe pas déjà.

**2. Développer** — diffs minimaux, suivre les patterns existants, pas d'abstraction prématurée.

**3. Tests** — après chaque développement, déterminer ce qu'il faut tester :
   - **Tests d'intégration** (priorité) : pour toute route API, flux auth, ou logique de service. Utiliser Vitest + MongoDB Memory Server, mocker uniquement l'email et `connectToMongoDB`.
   - **Tests unitaires** : uniquement pour des fonctions pures isolées à logique complexe (ex. règles de validation, calculs métier). Pas de tests unitaires sur des fonctions triviales.
   - **Tests E2E** (Playwright) : pour les parcours multi-étapes impliquant plusieurs pages ou flux UI complets (ex. ajout tournoi au groupe, résolution de conflits, magic link invité). Ne pas dupliquer ce qu'un test d'intégration couvre déjà.
   - En cas de doute entre intégration et E2E : préférer l'intégration (plus rapide, plus stable).

**4. Exécuter tous les tests** :
```bash
npm test            # tests unitaires + intégration (obligatoire avant commit)
npm run test:e2e    # tests E2E — nécessite Docker (MongoDB) + serveur démarrable sur port 3001
```
`npm test` doit passer à 100% avant de rédiger le commit. Les tests E2E sont recommandés pour tout changement touchant des composants UI critiques.

**5. Commit** :
```
type(scope): description courte en français

- détail 1
- détail 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Types : `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

---

## Variables d'environnement

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ftl

# Auth
SESSION_SECRET=                          # clé HMAC min. 32 chars

# Email - production (Resend)
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev         # remplacer par domaine vérifié en prod
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email - développement local (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025

# hCaptcha (dev : clés de test officielles hCaptcha, toujours valides sur localhost)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000

# Fetch des rondes (true = récupération de toutes les pages en parallèle)
NEXT_PUBLIC_USE_ASYNC_FETCH=true
```

---

## Commandes utiles

```bash
docker compose up -d        # démarrer MongoDB + Mailpit
npm run dev                 # lancer Next.js (port 3000)
npm test                    # tests unitaires + intégration (run once)
npm run test:watch          # tests en mode watch
npm run test:coverage       # rapport de couverture
npm run test:e2e            # tests E2E Playwright (port 3001, DB ftl_e2e)
npm run test:e2e:ui         # tests E2E en mode UI interactif (debug)
npm run test:e2e:debug      # tests E2E avec debugger pas-à-pas
```

---

## Tests E2E — Architecture et conventions

### Structure
```
e2e/
  fixtures/
    index.ts          — fixture `seed` + helper `loginAs(page, username, password)`
  tests/
    auth/             — login, session expiry
    scouting/         — assignation de deck depuis la vue match
    guest/            — flux magic link invité
    groups/           — ajout de tournoi, scouting de groupe, conflits
playwright.config.ts  — Chromium, port 3001, DB ftl_e2e, workers=1
```

### Seed endpoints (dev/test uniquement)
| Endpoint | Rôle |
|----------|------|
| `POST /api/test/seed` | Seed de base : 2 users (`e2e_player`/`e2e_admin`, mdp `E2ePassword1!`), 1 groupe `e2e_group`, 1 tournoi (id 9999901), 1 ronde (id 9999901) avec match Alice vs Bob |
| `POST /api/test/seed/scenarios` | Sur-couche : lie le tournoi au groupe, crée les decks de portée groupe (Alice=Ruby+Sapphire, Bob=Emerald+Amber) et utilisateur (Alice=Amber+Steel), crée un conflit PENDING pour Alice et un PENDING_ADMIN pour Bob |

- Toujours appeler `POST /api/test/seed` en premier (via la fixture `seed`).
- Appeler `POST /api/test/seed/scenarios` en `beforeEach` dans les tests qui ont besoin du GroupTournament ou des conflits.
- Les deux endpoints nettoient leurs données avant de les recréer — idempotents.

### Convention `data-testid`
Les composants interactifs exposent des attributs `data-testid` pour les sélecteurs Playwright :

| Attribut | Composant |
|----------|-----------|
| `data-testid="match-card"` | `MatchCard` — carte de match cliquable |
| `data-testid="match-modal"` | `MatchModal` — modal d'assignation depuis la vue ronde |
| `data-testid="ink-selection-combination1/2"` | Section d'encres dans `MatchModal` |
| `data-testid="ink-btn-{amber\|amethyst\|emerald\|ruby\|sapphire\|steel}"` | `InkButton` — utilisé dans `MatchModal` et `PlayerDeckModal` |
| `data-testid="player-deck-modal"` | `PlayerDeckModal` — modal d'assignation depuis la vue scouting groupe |
| `data-testid="conflict-resolution-modal"` | `ConflictResolutionModal` — modal de résolution de conflits utilisateur |

### Règles E2E
- Ne pas ajouter de `data-testid` sur des éléments non-interactifs ou purement décoratifs.
- Toujours scoper les clics sur les ink buttons à leur section parente (`modal.locator('[data-testid="ink-btn-amber"]')`) pour éviter les faux positifs.
- Les tests E2E sont séquentiels (`workers=1`) — ne pas paralléliser.
- La DB `ftl_e2e` est dédiée aux E2E : ne jamais pointer `MONGO_DB_NAME=ftl_e2e` en dehors des tests.

---

## Ce qu'il ne faut jamais faire

- Jamais choisir en silence face à une ambiguïté — toujours demander
- Jamais de `any` TypeScript sans justification explicite
- Jamais de requêtes Mongoose directes hors des repositories
- Jamais de logique métier dans les composants React
- Jamais de `console.log` laissé en production
- Jamais réécrire de larges portions de code non demandées
- Jamais créer un fichier sans vérifier qu'il n'existe pas déjà
- Jamais committer sans que `npm test` passe à 100%
- Jamais lire `x-user-id` / `x-user-role` directement dans les API routes — utiliser `getAuthSession(request)`
- Jamais utiliser `getServerUser()` dans une route API (réservé aux Server Components)
