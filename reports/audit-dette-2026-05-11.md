# Audit de dette technique — 2026-05-11

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude Sonnet 4.6 (audit automatique hebdomadaire)  
**Date :** 2026-05-11

---

## Résumé exécutif

L'audit de la branche `staging` révèle une architecture globalement cohérente avec les principes de CLAUDE.md, mais avec **une violation systémique majeure** : l'absence de repositories pour `User`, `Invitation`, et `AuditLog` entraîne des requêtes Mongoose directes dans 11+ routes API et dans `GroupService`. Cette violation touche les périmètres les plus sensibles (admin, inscription, profil). Par ailleurs, 4 fichiers modèles restent en JavaScript (`.js` / `.mjs`) malgré l'obligation TypeScript strict, et la duplication de la fonction `getAdminSession` dans 4 routes admin augmente le risque de désynchronisation des règles d'authentification. La couverture de tests est très faible : seules 4 suites de tests couvrent partiellement l'auth et le profil utilisateur, laissant sans test la totalité des routes admin, groupes, tournois et rounds. Ces lacunes constituent la dette technique principale à adresser en priorité.

---

## Tableau de synthèse

| # | Catégorie | Fichier(s) concerné(s) | Criticité |
|---|-----------|------------------------|-----------|
| 1 | Violation architecture | `app/api/admin/users/route.ts`, `[id]/route.ts`, `[id]/sessions/route.ts` | 🔴 Critique |
| 2 | Violation architecture | `app/api/admin/invitations/route.ts`, `[id]/route.ts` | 🔴 Critique |
| 3 | Violation architecture | `app/api/admin/stats/route.ts`, `audit-logs/route.ts` | 🔴 Critique |
| 4 | Violation architecture | `app/api/invitations/[token]/route.ts` | 🔴 Critique |
| 5 | Violation architecture | `src/services/GroupService.ts` | 🟠 Important |
| 6 | Redondance | `getAdminSession()` dupliquée dans 4 routes admin | 🟠 Important |
| 7 | Redondance | Regex email dupliquée dans 3 routes | 🟡 Mineur |
| 8 | Dette technique | `models/Round.js`, `Tournament.js`, `TournamentPlayersDeck.js` | 🟠 Important |
| 9 | Dette technique | `models/Ranking.mjs`, `models/utils.mjs` | 🟠 Important |
| 10 | Dette technique | `src/services/RoundService.ts` — `any` injustifié | 🟡 Mineur |
| 11 | Dette technique | `src/repositories/db/TournamentPlayersDeckRepository.ts` — `any` contournable | 🟡 Mineur |
| 12 | Dette technique | `src/lib/db.ts` — `console.log` en production | 🟡 Mineur |
| 13 | Couverture tests | Routes admin (11 routes) — zéro test | 🔴 Critique |
| 14 | Couverture tests | Routes groupes (10 routes) — zéro test | 🟠 Important |
| 15 | Couverture tests | Services `TournamentService`, `RoundService`, `ScoutingService`, `GroupService` | 🟠 Important |
| 16 | Couverture tests | Routes tournois et rounds (5 routes) — zéro test | 🟠 Important |

---

## 1. Violations d'architecture

### 1.1 Requêtes Mongoose directes dans les routes API admin

**Principe violé :** *"Les routes API appellent les services → les services appellent les repositories → les repositories utilisent Mongoose. Accès MongoDB exclusivement via les repositories."*

Les routes du périmètre admin utilisent directement `UserModel`, `InvitationModel`, `AuditLogModel`, `SessionModel` et `GroupModel` alors qu'aucun repository correspondant n'existe pour ces entités.

#### `app/api/admin/users/route.ts`

```typescript
// Ligne 43-49 — requête directe UserModel
const [users, total] = await Promise.all([
  UserModel.find(query).sort(...).skip(...).limit(...).select(...).lean(),
  UserModel.countDocuments(query),
]);

// Ligne 73-78 — vérifications de doublons
if (await UserModel.findOne({ username: username?.toLowerCase() })) { ... }
if (await UserModel.findOne({ email: email?.toLowerCase() })) { ... }

// Ligne 80-87 — création directe
const user = await UserModel.create({ username, email, passwordHash, role });

// Ligne 88 — récupération admin pour audit
const adminUser = await UserModel.findById(auth.session.userId).select('username').lean();
```

#### `app/api/admin/users/[id]/route.ts`

```typescript
// Ligne 31 — GET utilisateur
const user = await UserModel.findById(id).select('-passwordHash').lean();

// Ligne 34-40 — comptage sessions et logs récents
const [activeSessions, recentLogs] = await Promise.all([
  SessionModel.countDocuments({ userId: user._id, ... }),
  AuditLogModel.find({ userId: user._id }).sort(...).limit(10).lean(),
]);

// Lignes 54, 62, 69, 76, 114, 117 — PATCH et DELETE : multiples findById/findOne
```

#### `app/api/admin/users/[id]/sessions/route.ts`

```typescript
// Appels directs à UserModel.findById() et SessionModel.deleteMany()
```

#### `app/api/admin/stats/route.ts`

```typescript
// Lignes 26-47 — agrégations directes sans repository
AuditLogModel.countDocuments({ action: 'LOGIN_SUCCESS', ... })
AuditLogModel.aggregate([{ $match: ... }, { $group: ... }, ...])
AuditLogModel.find({ action: 'LOGIN_FAIL', ... })
```

#### `app/api/admin/audit-logs/route.ts`

```typescript
// Lignes 38-45 — pagination directe
AuditLogModel.find(filter).sort(...).skip(...).limit(...).lean()
AuditLogModel.countDocuments(filter)
```

#### `app/api/admin/invitations/route.ts`

```typescript
// Lignes 36-44 — listing avec populate et pagination
InvitationModel.find(query).sort(...).populate(...).lean()
InvitationModel.countDocuments(query)

// Lignes 85-91 — vérifications de doublons
UserModel.findOne({ email })
InvitationModel.findOne({ email, status: 'PENDING' })

// Lignes 107-113 — création
InvitationModel.create({ email, token, groupIds, ... })
```

**Suggestion de correction :**

Créer les repositories manquants :

- `src/repositories/db/UserRepository.ts` — méthodes : `findWithFilters(query, page, limit)`, `findById(id)`, `findByUsername(username)`, `findByEmail(email)`, `existsByUsername(username, excludeId?)`, `existsByEmail(email, excludeId?)`, `create(data)`, `update(id, data)`, `delete(id)`
- `src/repositories/db/InvitationRepository.ts` — méthodes : `findWithFilters(query, page, limit)`, `findByToken(token)`, `findPendingByEmail(email)`, `create(data)`, `updateStatus(id, status)`
- `src/repositories/db/AuditLogRepository.ts` — méthodes : `create(data)`, `findWithFilters(filter, page, limit)`, `getStats(dateRanges)`, `getSuspiciousIPs(since, minFailCount)`, `findByUserId(userId, limit)`
- `src/repositories/db/SessionRepository.ts` — méthodes : `countActive(userId)`, `deleteByUserId(userId)`

---

### 1.2 Requêtes Mongoose directes dans la route d'inscription publique

**Fichier :** `app/api/invitations/[token]/route.ts`

```typescript
// GET — lignes 18-27
const invitation = await InvitationModel.findOne({ token }).populate('groupIds', 'name').lean();
await InvitationModel.updateOne({ _id: invitation._id }, { status: 'EXPIRED' });

// POST — lignes 45-96
const invitation = await InvitationModel.findOne({ token });
await UserModel.findOne({ username: username.toLowerCase() })
await UserModel.findOne({ email: invitation.email })
await UserModel.create({ username, email, passwordHash, role: 'USER' })
await GroupModel.updateMany({ _id: { $in: invitation.groupIds } }, { $push: { members: ... } })
```

Cette route contient également de la **logique métier** (création d'utilisateur, mise à jour des groupes, validation) qui devrait être dans un service (ex. `InvitationService.register(token, username, password)`).

**Suggestion de correction :** Créer `src/services/InvitationService.ts` qui orchestre `UserRepository`, `InvitationRepository` et `GroupRepository`, et réduire la route à un simple appel de service.

---

### 1.3 Requêtes Mongoose directes dans `GroupService`

**Fichier :** `src/services/GroupService.ts`

```typescript
// Ligne 42 — récupération des users pour enrichir les membres
const users = await UserModel.find({ _id: { $in: memberIds } }).select('_id username email').lean();

// Ligne 83 — vérification existence user avant invitation
const invitedUser = await UserModel.findById(invitedUserId).lean();

// Ligne 200 — idem pour accès externe
const invitedUser = await UserModel.findById(invitedUserId).lean();
```

Un service ne doit pas importer de modèles Mongoose directement.

**Suggestion de correction :** Ajouter dans `UserRepository` :
- `findByIds(ids: string[])` — remplace la ligne 42
- `findById(id: string)` — remplace les lignes 83 et 200

---

## 2. Redondances

### 2.1 Fonction `getAdminSession` dupliquée dans 4 routes

La même fonction privée (exactement identique, mot pour mot) est définie localement dans 4 fichiers :

| Fichier | Lignes |
|---------|--------|
| `app/api/admin/users/route.ts` | 12–21 |
| `app/api/admin/users/[id]/route.ts` | 13–22 |
| `app/api/admin/invitations/route.ts` | 13–22 |
| `app/api/admin/invitations/[id]/route.ts` | 13–22 |

```typescript
// Code dupliqué dans les 4 fichiers :
async function getAdminSession(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return null;
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return null;
  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return null;
  return { parsed, session };
}
```

De plus, `app/api/admin/stats/route.ts` et `app/api/admin/audit-logs/route.ts` implémentent une **variante incomplète** (sans vérification de session en base) :

```typescript
// stats/route.ts et audit-logs/route.ts — lignes 10-14
const val = request.cookies.get('session')?.value;
if (!val) return ApiResponse.unauthorized();
const parsed = await verifyCookie(val);
if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return ApiResponse.forbidden('Interdit');
```

Cette variante ne vérifie pas que la session existe encore en base — contrairement à la version complète. C'est une **faille de sécurité potentielle** : un token signé valide mais dont la session a été révoquée en base serait accepté.

**Suggestion de correction :** Créer `src/lib/auth/getAdminSession.ts` exportant la fonction complète, et la remplacer dans tous les fichiers admin. Les routes `stats` et `audit-logs` doivent aussi utiliser cette version.

---

### 2.2 Regex de validation d'email dupliquée

La même regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` est copiée dans :

| Fichier | Ligne |
|---------|-------|
| `app/api/admin/users/route.ts` | 69 |
| `app/api/admin/users/[id]/route.ts` | 68 |
| `app/api/admin/invitations/route.ts` | 80 |

**Suggestion de correction :** Extraire dans `src/lib/validation.ts` :

```typescript
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

---

## 3. Dette technique

### 3.1 Fichiers modèles non migrés en TypeScript

**Principe violé :** *"TypeScript — mode strict activé"*

| Fichier | Lignes | Statut |
|---------|--------|--------|
| `models/Round.js` | 99 | JavaScript — pas de types |
| `models/Tournament.js` | 102 | JavaScript — pas de types |
| `models/TournamentPlayersDeck.js` | 35 | JavaScript — pas de types |
| `models/Ranking.mjs` | — | Module ES JavaScript |
| `models/utils.mjs` | — | Module ES JavaScript |

`Round.js` expose des schémas complexes (`MatchSchema`, `PlayerMatchRelationshipSchema`) sans interfaces TypeScript, ce qui force les usages aval à recourir à `as any` (voir `RoundService.ts`).

**Suggestion de correction :** Migrer en commençant par `Tournament.ts` (le plus utilisé via `TournamentRepository`), puis `Round.ts`, puis `TournamentPlayersDeck.ts`. Définir les interfaces exportées (`ITournament`, `IRound`, `IMatch`, etc.) utilisées par les repositories correspondants.

---

### 3.2 Usage de `any` TypeScript

**Principe violé :** *"Jamais de `any` TypeScript sans justification explicite"*

#### `src/services/RoundService.ts` — lignes 25-27

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const doc = tournament as any;
const allRounds = (doc.tournament_phases ?? []).flatMap((p: any) => p.rounds ?? []);
if (!allRounds.find((r: any) => r.id === roundId)) {
```

La cause racine est que `TournamentRepository.findById()` retourne le document Mongoose brut de `Tournament.js` (JavaScript), sans type. Migrer `Tournament.js` vers TypeScript avec des interfaces appropriées élimine ce `any`.

**Correction directe (sans migration complète) :**

```typescript
interface TournamentRound { id: number }
interface TournamentPhase { rounds?: TournamentRound[] }
interface TournamentDoc { tournament_phases?: TournamentPhase[] }

const doc = tournament as TournamentDoc;
const allRounds = (doc.tournament_phases ?? []).flatMap((p) => p.rounds ?? []);
```

#### `src/repositories/db/TournamentPlayersDeckRepository.ts` — ligne 48

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let doc = await TournamentPlayersDeck.findOne(query) as any;
```

Ce cast est utilisé pour accéder à `.players`, `.markModified()`, `.set()`, `.save()`. La cause est que `TournamentPlayersDeck.js` n'exporte pas d'interface. La migration de `TournamentPlayersDeck.js` → `.ts` et l'usage de `HydratedDocument<ITournamentPlayersDeck>` résout le problème proprement.

---

### 3.3 `console.log` en production

**Principe violé :** *"Jamais de `console.log` laissé en production"*

**Fichier :** `src/lib/db.ts` — ligne 26

```typescript
console.log(`✅ Connecté à MongoDB — ${process.env.MONGO_DB_NAME}`);
```

Ce log s'exécute à chaque connexion MongoDB, y compris en production.

**Suggestion de correction :**

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`✅ Connecté à MongoDB — ${process.env.MONGO_DB_NAME}`);
}
```

---

## 4. Couverture de tests

### 4.1 État actuel

Seules **4 suites de tests** existent dans `src/__tests__/` :

| Fichier de test | Routes couvertes |
|-----------------|-----------------|
| `invitations.test.ts` | `POST /api/admin/invitations` (création) |
| `password-reset.test.ts` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/[token]` |
| `register.test.ts` | `GET /api/invitations/[token]`, `POST /api/invitations/[token]` |
| `user-profile.test.ts` | `PATCH /api/user/profile`, `PATCH /api/user/password` |

### 4.2 Routes API sans tests

**Routes admin (0 tests sur 11 routes) — Criticité 🔴**

| Route | Méthodes |
|-------|----------|
| `app/api/admin/users/route.ts` | GET (liste), POST (créer) |
| `app/api/admin/users/[id]/route.ts` | GET (détail), PATCH (modifier), DELETE |
| `app/api/admin/users/[id]/sessions/route.ts` | DELETE (révoquer sessions) |
| `app/api/admin/stats/route.ts` | GET |
| `app/api/admin/audit-logs/route.ts` | GET |
| `app/api/admin/groups/route.ts` | GET |
| `app/api/admin/tournaments/route.ts` | DELETE |
| `app/api/admin/fetchTournament/route.ts` | POST |
| `app/api/admin/fetchRound/route.ts` | POST |
| `app/api/admin/invitations/route.ts` | GET (listing) |
| `app/api/admin/invitations/[id]/route.ts` | DELETE, POST (renvoyer) |

**Routes groupes (0 tests sur 10 routes) — Criticité 🟠**

| Route | Méthodes |
|-------|----------|
| `app/api/groups/route.ts` | GET, POST |
| `app/api/groups/[id]/route.ts` | GET, PUT, DELETE |
| `app/api/groups/[id]/members/route.ts` | POST |
| `app/api/groups/[id]/members/[userId]/route.ts` | DELETE, PATCH |
| `app/api/groups/[id]/tournaments/route.ts` | GET, POST |
| `app/api/groups/[id]/tournaments/[tid]/route.ts` | GET, DELETE |
| `app/api/groups/[id]/tournaments/[tid]/external-access/route.ts` | GET, POST |
| `app/api/groups/external-access/[accessId]/route.ts` | GET, PATCH |
| `app/api/groups/invitations/route.ts` | GET, POST |
| `app/api/groups/invitations/[invId]/route.ts` | GET, PATCH |

**Routes tournois et rounds (0 tests sur 5 routes) — Criticité 🟠**

| Route | Méthodes |
|-------|----------|
| `app/api/tournaments/route.ts` | GET, POST |
| `app/api/tournaments/[id]/route.ts` | GET, DELETE |
| `app/api/rounds/[roundId]/matchs/route.ts` | GET, POST |
| `app/api/rounds/[roundId]/matchs/[matchId]/route.ts` | GET, POST |
| `app/api/rounds/[roundId]/matchs/[matchId]/assign_deck/route.ts` | POST |

### 4.3 Services sans tests

| Service | Méthodes critiques non testées |
|---------|-------------------------------|
| `TournamentService` | `fetchAndSave()`, `delete()` (cascade) |
| `RoundService` | `fetchAndSave()` (pagination async), `getMatchesPaginated()` |
| `ScoutingService` | `assignDecks()` |
| `GroupService` | Toutes (create, invite, respond, external access) |

**Suggestion de correction — priorité immédiate :**

1. `src/__tests__/admin-users.test.ts` — tester GET /admin/users (pagination, filtres), POST (création, doublons, validation)
2. `src/__tests__/admin-users-detail.test.ts` — tester GET (détail), PATCH (mise à jour, conflits), DELETE (autoprotection)
3. `src/__tests__/groups.test.ts` — tester création, mise à jour, suppression, invitation membres

---

## Plan d'action recommandé

### Sprint 1 — Critique (semaine courante)

1. **Extraire `getAdminSession`** vers `src/lib/auth/getAdminSession.ts` et corriger la variante incomplète dans `stats` et `audit-logs` → sécurité
2. **Créer `UserRepository`** et migrer les 15+ requêtes directes dans les routes admin et `GroupService`
3. **Créer `InvitationRepository`** et migrer les routes admin et la route publique `/invitations/[token]`
4. **Créer `InvitationService`** pour encapsuler la logique métier d'inscription (route `/invitations/[token]`)

### Sprint 2 — Important (sprint suivant)

5. **Créer `AuditLogRepository`** avec méthodes `create`, `findWithFilters`, `getStats`, `getSuspiciousIPs`
6. **Créer `SessionRepository`** avec méthodes `countActive`, `deleteByUserId`
7. **Migrer `models/Tournament.js`** → `models/Tournament.ts` avec interfaces exportées
8. **Migrer `models/Round.js`** → `models/Round.ts` avec interfaces — élimine les `any` de `RoundService`
9. **Écrire les tests admin** — au minimum `admin-users.test.ts`

### Sprint 3 — Qualité (dans 2 sprints)

10. **Migrer `models/TournamentPlayersDeck.js`** → `.ts` — élimine le `any` du repository
11. **Extraire `isValidEmail`** dans `src/lib/validation.ts`
12. **Corriger `console.log`** dans `src/lib/db.ts`
13. **Écrire les tests groupes** et tournois
14. **Écrire les tests services** : `TournamentService`, `GroupService`
