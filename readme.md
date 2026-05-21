[![Coverage](https://codecov.io/gh/ydexmier/ftl/branch/main/graph/badge.svg)](https://codecov.io/gh/ydexmier/ftl)

# Companion Lorcana

Application compagnon pour les tournois **Disney Lorcana TCG**. Elle permet aux joueurs et organisateurs de suivre les rondes d'un tournoi en temps réel, d'assigner les combinaisons d'encres (decks) aux joueurs adverses, et de partager ces informations au sein d'un groupe.

## Fonctionnalités

- **Scouting** — assignation des combinaisons d'encres (decks) aux joueurs, avec 3 niveaux de portée : personnel / groupe / tournoi
- **Groupes** — collaboration entre joueurs d'un même groupe, invitation de membres, résolution de conflits d'assignation
- **Conflits** — workflow de résolution quand deux portées ont des decks différents pour le même joueur (PENDING → PENDING_ADMIN → APPROVED / REJECTED / UNCERTAINTY)
- **Rondes & matchs** — récupération des données depuis l'API Ravensburger, visualisation paginée des matchs avec les decks associés
- **Système d'invitation** — création de comptes par email avec token sécurisé
- **Demandes d'accès** — formulaire public pour demander un compte sans invitation directe
- **Feedback utilisateur** — signalement de bugs et demandes d'améliorations
- **Onboarding** — tour guidé Driver.js pour les nouveaux utilisateurs
- **Administration** — gestion des utilisateurs, invitations, tournois, audit log, feedbacks, accès

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Base de données | MongoDB 7 via Mongoose v7 |
| Auth | Sessions MongoDB, cookies HMAC-SHA256, Argon2id |
| Email (dev) | Nodemailer + Mailpit |
| Email (prod) | Resend |
| Templates email | React Email |
| État client | Zustand v5 |
| Tests | Vitest v4 + MongoDB Memory Server |
| Infrastructure locale | Docker Compose (MongoDB + Mailpit) |
| Langage | TypeScript strict |
| Runtime | Node.js 22 |

---

## Prérequis

- **Node.js 22** (via `nvm` recommandé)
- **Docker** et **Docker Compose**
- **Git**

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/ydexmier/ftl.git
cd ftl
```

### 2. Installer Node.js 22

```bash
nvm install 22
nvm use 22
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ftl

# Auth — clé HMAC, minimum 32 caractères
SESSION_SECRET=une-cle-secrete-dau-moins-32-caracteres-ici

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email — développement local (Mailpit, lancé via Docker)
SMTP_HOST=localhost
SMTP_PORT=1025

# hCaptcha — clés de test officielles (valides sur localhost)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000

# Récupération async des rondes (true = toutes les pages en parallèle)
NEXT_PUBLIC_USE_ASYNC_FETCH=true
```

> En production, remplacer `SMTP_HOST` / `SMTP_PORT` par `RESEND_API_KEY` et `EMAIL_FROM`.

### 5. Démarrer l'infrastructure Docker

```bash
docker compose up -d
```

Lance MongoDB (port 27017) et Mailpit (port 8025 pour l'UI, 1025 pour SMTP).

### 6. Créer le premier compte administrateur

```bash
node scripts/seed-admin.mjs
```

Le script interactif demande :
1. L'environnement (LOCAL / PREVIEW / PROD)
2. Le login
3. L'email
4. Le mot de passe (minimum 12 caractères, saisi masqué)
5. Le rôle (USER / ADMIN / SUPERUSER)

### 7. Lancer l'application

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## URLs locales

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Application principale |
| `http://localhost:3000/login` | Page de connexion |
| `http://localhost:3000/admin/dashboard` | Tableau de bord admin |
| `http://localhost:3000/admin/users` | Gestion des utilisateurs |
| `http://localhost:3000/admin/invitations` | Invitations en masse |
| `http://localhost:3000/admin/audit-logs` | Journal d'audit |
| `http://localhost:3000/admin/feedback` | Feedbacks utilisateurs |
| `http://localhost:3000/admin/access-requests` | Demandes d'accès en attente |
| `http://localhost:3000/tournaments` | Liste des tournois |
| `http://localhost:3000/groups` | Groupes de l'utilisateur |
| `http://localhost:3000/access-request` | Formulaire public de demande d'accès |
| `http://localhost:8025` | Interface web Mailpit (emails de dev) |
| `mongodb://localhost:27017` | MongoDB (outil externe : MongoDB Compass, etc.) |

---

## Commandes

### Développement

```bash
npm run dev          # Démarrer Next.js en mode développement (port 3000)
npm run build        # Compiler pour la production
npm start            # Démarrer en mode production (après build)
```

### Tests

```bash
npm test             # Lancer tous les tests une fois
npm run test:watch   # Tests en mode watch (relance à chaque modification)
npm run test:coverage # Rapport de couverture de code
```

Les tests couvrent les routes API (`app/api/**`) et la lib (`src/lib/**`).
Ils utilisent MongoDB Memory Server — pas besoin de Docker pour les tests.

### Infrastructure Docker

```bash
docker compose up -d      # Démarrer MongoDB + Mailpit en arrière-plan
docker compose down        # Arrêter les services
docker compose logs -f     # Suivre les logs en temps réel
```

### Initialisation de la base de données

```bash
node scripts/seed-admin.mjs   # Créer un compte utilisateur (interactif)
```

---

## Base de données

**MongoDB 7**, connexion via `mongodb://localhost:27017`, base `ftl`.

### Collections principales

| Collection | Description |
|------------|-------------|
| `users` | Comptes utilisateurs (username, email, role, passwordHash) |
| `sessions` | Sessions actives (TTL 4h inactivité, 12h absolues) |
| `auditlogs` | Journal des actions sensibles (TTL 48h) |
| `tournaments` | Données des tournois Ravensburger |
| `rounds` | Rondes avec les matchs imbriqués |
| `rankings` | Classements des joueurs |
| `tournamentplayersdecks` | Decks assignés par portée (user / groupe / tournoi) |
| `tournamentconflicts` | Conflits d'assignation entre portées |
| `groups` | Groupes d'utilisateurs |
| `groupinvitations` | Invitations à rejoindre un groupe |
| `grouptournaments` | Tournois rattachés à un groupe |
| `invitations` | Invitations de création de compte (token email) |
| `passwordresets` | Tokens de réinitialisation de mot de passe |
| `feedbacks` | Feedbacks et rapports de bugs |
| `accessrequests` | Demandes d'accès publiques |
| `scoutingreports` | Audit trail des assignations de decks |
| `usertournaments` | Tournois suivis par un utilisateur |
| `tournamentexternalaccesses` | Accès externes temporaires à un groupe |

### Connexion avec MongoDB Compass

1. Ouvrir MongoDB Compass
2. Se connecter à `mongodb://localhost:27017`
3. Sélectionner la base `ftl`

---

## Gestion des rôles

L'application utilise un RBAC hiérarchique avec 3 niveaux :

| Rôle | Niveau | Accès |
|------|--------|-------|
| `USER` | 1 | Application standard : tournois, scouting, groupes, profil |
| `ADMIN` | 2 | Tout USER + tableau de bord admin, gestion utilisateurs, invitations, tournois admin, audit log, feedbacks, accès |
| `SUPERUSER` | 3 | Tout ADMIN + accès complet sans restriction |

### Routes protégées par rôle

- `/` et toutes les pages sous `/(public)/` → `USER` minimum (session valide requise)
- `/admin/**` → `ADMIN` ou `SUPERUSER` uniquement — redirection vers `/` sinon
- `/access-request`, `/register/[token]`, `/login`, `/forgot-password` → pages publiques

### Modifier le rôle d'un utilisateur

Via l'interface admin : `http://localhost:3000/admin/users` → cliquer sur un utilisateur → modifier le rôle.

Ou via le script seed pour créer directement un compte avec le rôle voulu :

```bash
node scripts/seed-admin.mjs
```

---

## Architecture

```
app/                     Routes Next.js (App Router)
  (public)/              Pages utilisateurs connectés (layout avec header)
  admin/                 Pages administration
  api/                   Route handlers API
  login/                 Connexion
  register/[token]/      Inscription via invitation
  access-request/        Formulaire public

components/              Composants React
  ui/                    Primitives partagées
  tournament/            Vues tournoi
  round/                 Vues ronde
  match/                 Vues match
  groups/                Gestion groupes

models/                  Schémas Mongoose

src/
  domain/                Règles métier, value objects
  hooks/                 Hooks React (useFetch, useTournament, useRound…)
  lib/                   Auth, email, DB, API helpers
  repositories/db/       Accès MongoDB (une couche, jamais bypassed)
  services/              Orchestration métier
  types/                 Interfaces TypeScript
  __tests__/             Tests d'intégration
```

**Flux d'une requête** : Route API → Service → Repository → Mongoose → MongoDB

---

## Authentification

- Sessions stockées en MongoDB avec double TTL : **4h d'inactivité** / **12h maximum**
- Cookie `session` signé HMAC-SHA256, rechargé toutes les 4 minutes via `SessionGuard`
- Mots de passe hashés **Argon2id** (memoryCost 64MB, timeCost 3, parallelism 4)
- Rate limiting : 5 tentatives de connexion par IP / 15 minutes
- hCaptcha sur les endpoints publics (inscription, demande d'accès)

---

## Récupération des données Ravensburger

L'application consomme l'API publique Ravensburger pour récupérer :
- Les détails d'un tournoi (via son ID numérique)
- Les rondes et leurs matchs (paginés)
- Les classements

Voir [docs/Readme.md](docs/Readme.md) pour les exemples de réponses API.

`NEXT_PUBLIC_USE_ASYNC_FETCH=true` active la récupération de toutes les pages d'une ronde en parallèle (recommandé pour les gros tournois).

---

## Emails en développement

Tous les emails envoyés en développement sont interceptés par **Mailpit** et visibles sur `http://localhost:8025`. Aucun email ne part réellement sur internet.

Emails envoyés par l'application :
- **Invitation** — lien de création de compte
- **Welcome** — confirmation après inscription
- **Réinitialisation de mot de passe**

---

## Variables d'environnement complètes

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ftl

# Multi-environnements (pour seed-admin.mjs)
MONGO_URI_PREVIEW=
MONGO_DB_NAME_PREVIEW=ftl-preview
MONGO_URI_PROD=
MONGO_DB_NAME_PROD=ftl-prod

# Auth
SESSION_SECRET=                          # min. 32 caractères

# URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email dev (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025

# Email prod (Resend)
RESEND_API_KEY=
EMAIL_FROM=no-reply@votredomaine.com

# hCaptcha (clés de test valides en local)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000

# Fetch async des rondes
NEXT_PUBLIC_USE_ASYNC_FETCH=true
```

---

## Déploiement

L'application est déployée sur **Vercel**. Chaque push sur `main` déclenche un déploiement automatique.

En production, configurer les variables d'environnement Vercel avec les valeurs MongoDB Atlas, Resend, et hCaptcha de production.

