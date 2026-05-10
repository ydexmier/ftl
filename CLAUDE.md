# CLAUDE.md — Companion Lorcana

Tu es ingénieur senior permanent de ce projet. Tu connais le codebase en profondeur, tu ne réinventes pas ce qui existe, et tu suis les conventions établies sans les remettre en question sauf si on te le demande explicitement.

---

## Projet

**Companion Lorcana** — Application compagnon pour les tournois Disney Lorcana TCG.

Fonctionnalités principales :
- Récupération des données de tournoi depuis l'API Ravensburger
- Scouting : assignation des combinaisons d'encres (decks) aux joueurs pendant les rondes
- Gestion des groupes et des accès
- Système d'invitation par email pour la création de comptes utilisateurs

---

## Stack technique

### Framework & Runtime
- **Next.js 15.5.8** — App Router exclusivement (pas de Pages Router)
- **React 19** — Server Components par défaut, Client Components uniquement si nécessaire (`'use client'`)
- **TypeScript** — mode strict activé, pas de `any` sauf cas exceptionnel justifié
- **Node.js 22**

### Base de données
- **MongoDB** via **Mongoose v7**
- Connexion singleton dans `src/lib/db.ts` (cache global `__mongoose`)
- Les schémas et modèles sont dans `models/`
- Les repositories dans `src/repositories/db/` encapsulent tout accès Mongoose

### Styling
- **Tailwind CSS v4** — design system OKLCH dark (`class="dark"` sur `<html>`)
- **CVA** (class-variance-authority) — variantes de composants
- **clsx** + **tailwind-merge** (via `cn()` dans `components/ui/cn.ts`) — composition de classes
- Pas de CSS modules, pas de styled-components, pas de MUI

### Email
- **Resend** — envoi en production (nécessite un domaine vérifié)
- **Nodemailer** + **Mailpit** — envoi en développement local (mail catcher sur `localhost:1025`)
- **@react-email/components** + **@react-email/render** — templates email en React
- Le switch prod/dev se fait automatiquement via `NODE_ENV` dans `src/lib/email.ts`

### Authentification & Sécurité
- Sessions stockées en MongoDB (`models/Session.ts`), TTL 8h / inactivité 30min
- Cookies signés HMAC-SHA256 (`SESSION_SECRET`) via Web Crypto API (`src/lib/auth/cookieSign.ts`)
- Hachage des mots de passe **Argon2id** (via `argon2`) — `src/lib/auth/password.ts`
- RBAC : `USER < ADMIN < SUPERUSER` — `src/lib/auth/rbac.ts`
- Rate limiting en mémoire : 5 tentatives / 15min par IP — `src/lib/auth/rateLimit.ts`
- Audit log sur toutes les actions sensibles (`models/AuditLog.ts`)

### Tests
- **Vitest** — runner de tests
- **MongoDB Memory Server** — base de données en mémoire pour les tests d'intégration
- Tests dans `src/__tests__/`, helpers dans `src/test/`
- Email mocké, `connectToMongoDB` mocké en no-op (mongoose déjà connecté)

### Infrastructure locale
- **Docker Compose** — orchestre MongoDB + Mailpit en local
- Lancer avec `docker compose up -d` avant `npm run dev`

### Icônes
- **Lucide React** — bibliothèque d'icônes unique, pas d'autres librairies d'icônes

---

## Architecture

```
app/                        — Next.js App Router
  (public)/                 — Layout avec header (utilisateurs connectés)
    profile/                — Page profil utilisateur
    tournaments/            — Pages tournois
    groups/                 — Pages groupes
  admin/                    — Pages admin (ADMIN/SUPERUSER uniquement)
    dashboard/
    users/
    invitations/
    tournaments/
    audit-logs/
  api/                      — Route handlers
    admin/                  — Routes admin protégées
    auth/                   — login, logout, forgot-password, reset-password
    user/                   — profile, password
    groups/                 — CRUD groupes
    invitations/            — Routes publiques d'inscription
    rounds/
    tournaments/
  login/                    — Page de connexion
  forgot-password/          — Demande de réinitialisation
  reset-password/[token]/   — Formulaire nouveau mot de passe
  register/[token]/         — Inscription via invitation

components/
  admin/                    — Composants admin (clients)
  ui/                       — Primitives UI partagées (Button, Input, Badge, Alert, Select…)

models/                     — Schémas Mongoose
  User.ts, Session.ts, AuditLog.ts
  Invitation.ts, PasswordReset.ts
  Group.ts, GroupInvitation.ts, GroupTournament.ts
  Round.js, Tournament.js, TournamentPlayersDeck.js

src/
  __tests__/                — Tests d'intégration
  domain/
    rules/                  — Règles métier (matchRules, roundRules, scoutingRules)
    value-objects/          — Ink, MatchStatus, RoundType
  hooks/                    — Hooks React (useRound, useTournament, useDeckAssignment…)
  lib/
    api/                    — ApiResponse, apiFetch
    auth/                   — session, cookieSign, password, rbac, rateLimit, getAuthSession, getServerUser
    email.ts                — Fonctions d'envoi (sendInvitationEmail, sendWelcomeEmail, sendPasswordResetEmail)
    emails/                 — Templates React Email
    db.ts                   — Singleton connexion MongoDB
    constants.ts, date.ts, mergeDeep.ts
  repositories/
    db/                     — Accès MongoDB (TournamentRepository, GroupRepository, RoundRepository…)
    external/               — API externes (RavensburgerClient)
  services/                 — Orchestration métier (TournamentService, GroupService, RoundService, ScoutingService)
  test/                     — setup.ts, helpers.ts
  types/                    — Interfaces TypeScript
```

---

## Principes d'architecture à respecter

- **Server Components par défaut** — `'use client'` uniquement si interaction utilisateur ou hooks nécessaires
- **Pas de logique métier dans les composants React** — les composants sont purement présentationnels
- **Les routes API** appellent les services → les services appellent les repositories → les repositories utilisent Mongoose
- **Accès MongoDB exclusivement via les repositories** (`src/repositories/db/`) — pas de requêtes Mongoose directes dans les routes ou services
- **`ApiResponse`** (`src/lib/api/responses.ts`) pour toutes les réponses HTTP
- **`getAuthSession(request)`** pour l'auth dans les routes API, **`getServerUser()`** dans les Server Components
- **Types dans `src/types/`**, pas de types inline dans les composants ou routes

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
   - En cas de doute : préférer les tests d'intégration.

**4. Exécuter tous les tests** — s'assurer que les changements n'ont pas cassé les tests existants :
```bash
npm test
```
Tous les tests doivent passer avant de rédiger le commit.

**5. Commit** — message structuré en suivant ce format :
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
SESSION_SECRET=                    # clé HMAC min. 32 chars

# Email - production (Resend)
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev   # remplacer par domaine vérifié en prod
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email - développement local (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## Commandes utiles

```bash
docker compose up -d        # démarrer MongoDB + Mailpit
npm run dev                 # lancer Next.js (port 3000)
npm test                    # tests (run once)
npm run test:watch          # tests en mode watch
npm run test:coverage       # rapport de couverture
```

---

## Ce qu'il ne faut jamais faire

- Jamais de `any` TypeScript sans justification explicite
- Jamais de requêtes Mongoose directes hors des repositories
- Jamais de logique métier dans les composants React
- Jamais de `console.log` laissé en production
- Jamais réécrire de larges portions de code non demandées
- Jamais créer un fichier sans vérifier qu'il n'existe pas déjà
- Jamais committer sans que `npm test` passe à 100%
