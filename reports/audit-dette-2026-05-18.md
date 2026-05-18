# Audit de dette technique — 2026-05-18

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-05-18

---

## Résumé exécutif

Comparé à l'audit du 2026-05-16, le sprint écoulé a été **extrêmement productif** : la quasi-totalité des problèmes 🔴 Critique et 🟠 Important signalés ont été corrigés. Les routes auth et user n'utilisent plus Mongoose directement, l'authentification manuelle a disparu des routes API, la migration TypeScript est complète, et cinq nouveaux fichiers de tests couvrent les angles morts critiques (refresh de session, feedback, cookieSign, Ink value-object, assign_deck). Une nouvelle feature majeure a également été livrée (fusion du scouting personnel dans le groupe) avec une architecture irréprochable. La couverture de tests atteint désormais **33 fichiers** pour 6 454 lignes.

Il reste cependant un problème architectural persistant : **cinq Server Components de pages admin et utilisateur accèdent directement aux modèles Mongoose** (`UserModel`, `SessionModel`, `InvitationModel`) en contournant les repositories. Ce pattern n'était pas couvert par l'audit précédent qui focalisait sur les routes API ; il représente la même violation de principe mais dans la couche présentation. Par ailleurs subsistent des problèmes mineurs stables : `fetch()` directs dans 20+ composants, un `as any` résiduel, 3 `console.error`, et l'onboarding sans test.

---

## Tableau de synthèse

| # | Catégorie | Fichier(s) concerné(s) | Criticité | Statut |
|---|-----------|------------------------|-----------|--------|
| 1 | Violation architecture | `app/admin/users/page.tsx`, `app/admin/users/[id]/page.tsx` | 🟠 Important | Nouveau |
| 2 | Violation architecture | `app/admin/invitations/page.tsx` | 🟠 Important | Nouveau |
| 3 | Violation architecture | `app/groups/[id]/page.tsx`, `app/(public)/profile/page.tsx` | 🟠 Important | Nouveau |
| 4 | Violation architecture | `app/api/admin/feedback/route.ts`, `app/api/admin/feedback/[id]/route.ts`, `app/api/user/tournaments/[id]/route.ts` | 🟡 Mineur | Nouveau |
| 5 | Redondance | `fetch()` direct dans 20+ composants React | 🟠 Important | Persistant |
| 6 | Redondance | `countDocuments` pour pagination (vs `.exists()` pour booléens) | 🟡 Mineur | Persistant partiel |
| 7 | Redondance | Nommage incohérent `findWithFilters` vs `findAll` | 🟡 Mineur | Persistant |
| 8 | Dette technique | `as any` dans `DeleteTournamentButton.tsx` | 🟡 Mineur | Nouveau |
| 9 | Dette technique | `console.error` dans 3 fichiers de production | 🟡 Mineur | Persistant (réduit de 4 à 3) |
| 10 | Dette technique | God component `TournamentsPageClient.tsx` (365 lignes, 3 composants inline) | 🟡 Mineur | Persistant (amélioré : 572 → 365) |
| 11 | Couverture tests | `PATCH /api/user/onboarding` — aucun test | 🟡 Mineur | Persistant |
| 12 | Couverture tests | `GET /api/admin/users/[id]/sessions` — non testé | 🟡 Mineur | Persistant |
| 13 | Couverture tests | `GET /api/admin/tournaments` — non testé | 🟡 Mineur | Persistant |
| — | — | **Corrigé : auth manuelle + Mongoose direct dans routes API** | ✅ | Corrigé (16/05) |
| — | — | **Corrigé : Migration TypeScript complète** | ✅ | Corrigé (16/05) |
| — | — | **Corrigé : 10× `as any` dans Tournament.tsx** | ✅ | Corrigé (16/05) |
| — | — | **Corrigé : tests auth/refresh, feedback, cookieSign, Ink, assign_deck** | ✅ | Corrigé (16/05) |

---

## 1. Violations d'architecture

### 1.1 Requêtes Mongoose directes dans les Server Components pages

**Principe violé :** *"Accès MongoDB exclusivement via les repositories (`src/repositories/db/`) — jamais de requêtes Mongoose directes dans les routes ou services."*

Ce principe s'applique également aux Server Components. Les fichiers suivants contournent les repositories en important et requêtant directement les modèles Mongoose.

#### `app/admin/users/page.tsx`

```typescript
// Ligne 2 — import direct
import UserModel from '@models/User';
// Lignes 30-36 — requêtes directes
const users = await UserModel.find(query)
  .skip((page - 1) * limit).limit(limit).lean();
const total = await UserModel.countDocuments(query);
```

**Correction :** Utiliser `UserRepository.findWithFilters({ page, limit, ... })` qui expose déjà cette fonctionnalité.

#### `app/admin/users/[id]/page.tsx`

```typescript
// Lignes 3-5 — imports directs de 3 modèles
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
// Lignes 15-22 — 3 requêtes directes
const user = await UserModel.findById(id).select('-passwordHash').lean();
const sessionCount = await SessionModel.countDocuments({ userId: id, expiresAt: { $gt: new Date() } });
const auditLogs = await AuditLogModel.find({ userId: id }).sort({ timestamp: -1 }).limit(20).lean();
```

**Correction :**
```typescript
const user = await UserRepository.findById(id);
// SessionRepository et AuditLogRepository exposent déjà des méthodes pour ces requêtes
const sessions = await SessionRepository.findActiveByUserId(id);
const logs = await AuditLogRepository.findWithFilters({ userId: id, limit: 20 });
```

#### `app/admin/invitations/page.tsx`

```typescript
// Ligne 2 — import direct
import InvitationModel from '@models/Invitation';
// Lignes 23-31 — requêtes directes avec populate
const rawInvitations = await InvitationModel.find(query)
  .sort({ createdAt: -1 })
  .populate('invitedBy', 'username')
  .populate('groupIds', 'name')
  .lean();
const total = await InvitationModel.countDocuments(query);
```

**Correction :** Ajouter une méthode `InvitationRepository.findWithFiltersPopulated(query)` ou enrichir `findWithFilters` pour supporter la population.

#### `app/groups/[id]/page.tsx`

```typescript
// Ligne 8 — import direct
import UserModel from '@models/User';
// Ligne 27 — requête directe
const memberUsers = await UserModel.find({ _id: { $in: memberIds } })
  .select('_id username email').lean();
```

**Correction :** Utiliser `UserRepository.findByIds(memberIds)` (méthode documentée dans CLAUDE.md).

#### `app/(public)/profile/page.tsx`

```typescript
// Ligne 3 — import direct
import UserModel from '@models/User';
// Ligne 12 — requête directe
const user = await UserModel.findById(auth.userId).select('-passwordHash').lean();
```

**Correction :** Utiliser `UserRepository.findById(auth.userId)`.

---

### 1.2 Import de types depuis les modèles dans les routes API

**Problème :** Les types métier (`FeedbackStatus`, `UserTournamentStatus`) sont importés directement depuis les fichiers de modèles Mongoose dans des routes API, créant un couplage inutile entre la couche API et la couche modèle.

| Fichier | Import | Impact |
|---------|--------|--------|
| `app/api/admin/feedback/route.ts:6` | `import type { FeedbackStatus } from '@models/Feedback'` | Couplage couche API → modèle |
| `app/api/admin/feedback/[id]/route.ts:6` | `import type { FeedbackStatus } from '@models/Feedback'` | Idem |
| `app/api/user/tournaments/[id]/route.ts:5` | `import type { UserTournamentStatus } from '@models/UserTournament'` | Idem |

**Correction :** Déplacer ces types vers `src/types/` (ex. `src/types/feedback.ts`) et importer depuis là. Les routes API ne devraient connaître que les types du domaine, pas les interfaces Mongoose.

```typescript
// src/types/feedback.ts
export type FeedbackStatus = 'open' | 'in-progress' | 'done' | 'closed';
export type FeedbackType = 'bug' | 'improvement';
```

---

## 2. Redondances

### 2.1 Appels `fetch()` directs dans les composants (20+ occurrences) — Persistant

`apiFetch.ts` existe dans `src/lib/api/apiFetch.ts` mais n'est pas utilisé pour les mutations. Les 20+ composants suivants font des appels `fetch()` directs sans gestion unifiée des erreurs ni état de chargement centralisé :

| Composant | Occurrences | Nature |
|-----------|-------------|--------|
| `components/admin/groups/GroupDetailClient.tsx` | 3 | CRUD membres |
| `components/admin/users/UserDetailClient.tsx` | 2 | gestion user |
| `components/admin/users/UserEditModal.tsx` | 1 | update user |
| `components/admin/users/UserCreateModal.tsx` | 1 | création user |
| `components/admin/users/UserDeleteConfirm.tsx` | 1 | suppression user |
| `components/admin/invitations/InvitationsPageClient.tsx` | 2 | cancel/resend |
| `components/admin/invitations/InvitationSendModal.tsx` | 1 | envoi invitation |
| `components/admin/access-requests/AccessRequestsPageClient.tsx` | 2 | approve/reject |
| `components/tournament/TournamentSearchBar.tsx` | 2+ | search, link |
| `components/tournament/PlayerDeckModal.tsx` | 1 | assign deck |
| `components/tournament/ConflictResolutionModal.tsx` | 1 | résolution conflit |
| `components/tournament/DeleteTournamentButton.tsx` | 1 | suppression |
| `components/groups/*` | 5+ | CRUD groupe |
| `components/ui/FeedbackWidget.tsx` | 1 | soumission feedback |
| `components/ui/OnboardingTour.tsx` | 1 | marquer onboarding |

**Impact :** Chaque composant réimplémente sa propre gestion d'erreur (ou ne l'implémente pas), son propre état `loading`, ses propres headers. Une erreur réseau ou un changement d'API nécessite des modifications dans 20+ fichiers.

**Recommandation :** Vérifier que `src/lib/api/apiFetch.ts` est utilisable pour les mutations et le documenter comme standard. Le hook `useFetch` couvre déjà les GET ; un équivalent pour les mutations (`useApiMutation`) serait cohérent avec l'architecture existante.

---

### 2.2 `countDocuments` pour métriques (acceptable) vs existence (optimisable)

Contrairement au rapport précédent, `GroupRepository` utilise maintenant correctement `.exists()` pour les vérifications booléennes. Les `countDocuments` restants dans les repositories concernent des usages légitimes de pagination et métriques :

- `TournamentConflictRepository.ts:70` — `countPendingAdminByGroup()` : métrique d'affichage (badge)
- `TournamentConflictRepository.ts:80` — `countUncertaintyByGroupAndTournament()` : métrique
- `AccessRequestRepository.ts:31,39` — pagination
- `UserRepository.ts:23` — pagination

Ces usages sont corrects. Aucune correction requise.

---

### 2.3 Nommage incohérent dans les repositories — Persistant

| Repository | Méthode recherche/liste | Cohérence |
|------------|------------------------|-----------|
| `InvitationRepository` | `findWithFilters()` | référence |
| `FeedbackRepository` | `findAll()` | ≠ |
| `AccessRequestRepository` | `findWithFilters()` | ✓ |
| `UserRepository` | `findWithFilters()` | ✓ |
| `AuditLogRepository` | `findWithFilters()` | ✓ |

**Recommandation :** Renommer `FeedbackRepository.findAll()` en `findWithFilters()` pour aligner la convention. Priorité basse — à faire lors du prochain refactoring du repository.

---

## 3. Dette technique

### 3.1 `as any` résiduel dans `DeleteTournamentButton.tsx`

**Fichier :** `components/tournament/DeleteTournamentButton.tsx` — **1 occurrence** (ligne 26)

```typescript
onDeleted?.((response as any).data);
```

**Cause :** La réponse de `apiFetch` ou `fetch` n'est pas typée. La callback `onDeleted` attend un tournoi typé mais la réponse est `unknown`.

**Correction :** Typer la réponse de la requête DELETE ou utiliser une assertion de type avec une interface :
```typescript
interface DeleteResponse { data: Tournament }
const result = await fetch(...) as DeleteResponse;
onDeleted?.(result.data);
```

---

### 3.2 `console.error` en production — Persistant (réduit de 4 à 3)

| Fichier | Ligne | Type | Justification |
|---------|-------|------|--------------|
| `app/global-error.tsx` | 13 | `console.error` | Handler d'erreur Next.js client — acceptable comme dernier recours |
| `app/error.tsx` | 19 | `console.error` | Handler d'erreur Next.js client — acceptable comme dernier recours |
| `src/lib/api/responses.ts` | 32 | `console.error` | Log serveur erreur 500 — le plus justifiable |

**Note :** Les deux handlers d'erreur Next.js (`error.tsx`, `global-error.tsx`) sont un contexte limite où le logging est attendu. `responses.ts:32` sert à tracer les erreurs 500 inattendues côté serveur. Ces 3 occurrences sont moins problématiques que les 4 précédentes (dont 3 étaient dans du code métier). Néanmoins, un service de logging structuré remplacerait avantageusement ces appels en production.

---

### 3.3 God component `TournamentsPageClient.tsx` — Persistant (amélioré)

Le composant est passé de 572 à 365 lignes — la logique d'état a été extraite dans `useTournamentManagement`. Il contient cependant encore 3 composants React définis dans le même fichier :
- `CollapsibleSection` (lignes ~34-80)
- `GroupSubSection` (lignes ~82-177)
- `TournamentsPageClient` (lignes ~179-365)

**Recommandation :** Extraire `CollapsibleSection` et `GroupSubSection` dans leurs propres fichiers `components/tournament/CollapsibleSection.tsx` et `components/tournament/GroupSubSection.tsx`. À faire au prochain refactoring de la page.

---

## 4. Couverture de tests

La couverture a progressé de 27 à 33 fichiers de tests (6 454 lignes). Les lacunes restantes sont mineurs.

### 4.1 `PATCH /api/user/onboarding` — aucun test — Persistant

**Fichier :** `app/api/user/onboarding/route.ts`  
**Statut :** Déjà signalé au 16/05, toujours sans test.

Tests à écrire :
- Requête sans session → 401
- Requête authentifiée → 200, champ `onboardingCompletedAt` renseigné en BDD
- Requête pour un utilisateur dont l'onboarding est déjà marqué → comportement idempotent

### 4.2 `GET /api/admin/users/[id]/sessions` — non testé — Persistant

**Fichier :** `app/api/admin/users/[id]/sessions/route.ts`  
Seul le `DELETE` est couvert par `admin-remaining.test.ts`. Le `GET` (liste des sessions actives d'un utilisateur) n'a aucun test.

### 4.3 `GET /api/admin/tournaments` — non testé — Persistant

**Fichier :** `app/api/admin/tournaments/route.ts`  
Seul le `DELETE` est couvert. Le `GET` (liste des tournois en vue admin) n'a aucun test.

---

## Récapitulatif des priorités

### 🟠 Important — À planifier dans le prochain sprint

1. **Requêtes Mongoose directes dans les Server Components pages** — 5 fichiers impactés. Même violation de principe que les routes API, déjà corrigées au sprint précédent. Correction symétrique attendue.
2. **`fetch()` directs dans 20+ composants** — Persistant. Standardiser sur `apiFetch` ou créer `useApiMutation`.

### 🟡 Mineur — Opportunités d'amélioration continue

3. Déplacer les types `FeedbackStatus`, `UserTournamentStatus` vers `src/types/` (3 fichiers).
4. Supprimer le seul `as any` restant dans `DeleteTournamentButton.tsx`.
5. Ajouter tests `PATCH /api/user/onboarding`, `GET /api/admin/users/[id]/sessions`, `GET /api/admin/tournaments`.
6. Renommer `FeedbackRepository.findAll()` en `findWithFilters()`.
7. Extraire `CollapsibleSection` et `GroupSubSection` de `TournamentsPageClient.tsx`.
