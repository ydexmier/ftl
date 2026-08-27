# Audit de dette technique — 2026-07-06

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-07-06  
**Rapport précédent :** `reports/audit-dette-2026-06-08.md`

---

## Résumé exécutif

Comparé à l'audit du 2026-06-08, **trois problèmes ont été corrigés** : le rate limiting de `/api/guest/validate`, la centralisation de `getIp()` dans `src/lib/auth/getIp.ts`, et les tests des routes `pin`/`memo` admin. La base de couverture de tests atteint **91 % des routes API** (86/95 testées).

**Deux nouveaux problèmes de sécurité sont identifiés :** (1) `serverError()` dans `src/lib/api/responses.ts` expose les messages d'erreur internes bruts de Mongoose en production (chemins de fichiers, noms de collections, contraintes d'index) — corrigeable en 5 lignes ; (2) `GET /api/invitations/[token]` est accessible sans authentification et sans rate limiting, ce qui permet l'énumération de tokens d'invitation par force brute.

**La dette God Component s'aggrave** : 12 composants dépassent 300 lignes (contre 10 lors du dernier audit). `Tournament.tsx` est passé de 376 à 398 lignes, `MatchModal.tsx` de 328 à 357 lignes. `PlayerDeckModal.tsx` (309 L) et `Round.tsx` (304 L) franchissent le seuil pour la première fois.

**Route créée sans test** : `app/api/tournaments/[id]/member-groups/route.ts` (introduite le 2026-06-13) n'a aucun test d'intégration.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Sécurité — fuite message d'erreur | 🔴 Critique | `src/lib/api/responses.ts:33` | 🆕 Nouveau |
| 2 | Sécurité — énumération tokens | 🟠 Important | `app/api/invitations/[token]/route.ts:10` | 🆕 Nouveau |
| 3 | Architecture — Mongoose direct (seed) | 🟠 Important | `app/api/test/seed/route.ts`, `app/api/test/seed/scenarios/route.ts` | 🆕 Nouveau |
| 4 | Architecture — connectToMongoDB redondant | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:18` | 🆕 Nouveau |
| 5 | Validation — format email non validé | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/external-access/route.ts:29` | 🆕 Nouveau |
| 6 | Couverture — route sans test | 🟡 Mineur | `app/api/tournaments/[id]/member-groups/route.ts` | 🆕 Nouveau |
| 7 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 L) | 🔁 Persistant |
| 8 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 L, +22 L) | 🔁 Persistant (aggravé) |
| 9 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 L) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 L, +29 L) | 🔁 Persistant (aggravé) |
| 11 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 L) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 L) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 L) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 L) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 L) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 L) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 L) | 🆕 Nouveau (seuil franchi) |
| 18 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 L) | 🆕 Nouveau (seuil franchi) |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (4 usages), `TournamentPlayersDeckRepository.ts` (3 usages) | 🔁 Persistant |
| 20 | Hooks non testés | 🟡 Mineur | `useDebounce`, `useFetch`, `usePlayerHistory`, `useScrollGuard`, `useTournamentManagement`, `useTournamentStats` | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `POST /api/guest/validate` (🔴 Critique) | ✅ Corrigé — `checkRateLimit('guest-validate:${ip}')` ajouté |
| B | Fonction `getIp()` dupliquée dans 6 fichiers (🟡 Mineur) | ✅ Centralisée dans `src/lib/auth/getIp.ts` |
| C | Routes admin `pin` et `memo` sans tests (🟡 Mineur) | ✅ Testées dans `admin-groups.test.ts` et `admin-users.test.ts` |
| D | `connectToMongoDB()` redondant dans `api-tokens/route.ts` (🟡 Mineur) | ✅ Corrigé — mais une nouvelle instance apparaît dans `[tokenId]/route.ts` |

---

## 1. Sécurité

### 1.1 `serverError()` expose les messages d'erreur internes en production (CRITIQUE)

**Fichier :** `src/lib/api/responses.ts:32-35`

**Problème :** La réponse HTTP 500 renvoie le message brut de l'exception au client. En production, cela expose des détails internes : chemin de collection MongoDB, nom des index, contraintes d'unicité, voire des chemins de fichiers Node.

```typescript
// src/lib/api/responses.ts — extrait
serverError: (err: unknown) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : String(err); // ← message brut d'exception
  return NextResponse.json({ error: msg }, { status: 500 });    // ← exposé au client
},
```

Exemple de fuite réelle : `MongoServerError: E11000 duplicate key error collection: ftl.users index: username_1 dup key: { username: "alice" }` — révèle le nom de la base de données, de la collection et de l'index.

Cette fonction est appelée par ~50 routes. Le risque est systémique.

**Correction :**
```typescript
serverError: (err: unknown) => {
  console.error(err); // garder le log serveur
  return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
},
```
Si un message spécifique est nécessaire, le passer explicitement en paramètre optionnel.

---

### 1.2 `GET /api/invitations/[token]` sans rate limiting — énumération possible (IMPORTANT)

**Fichier :** `app/api/invitations/[token]/route.ts:10-31`

**Problème :** Ce handler GET est public (pas d'authentification) et retourne l'email associé à un token d'invitation. Il n'a aucun rate limiting par IP. Un attaquant peut bruteforcer des UUIDs pour découvrir des emails enregistrés.

```typescript
// app/api/invitations/[token]/route.ts — aucun checkRateLimit
export async function GET(_request: NextRequest, { params }...) {
  const { token } = await params;
  const invitation = await InvitationRepository.findByTokenWithGroups(token);
  if (!invitation) return ApiResponse.notFound('Invitation invalide ou expirée');
  return ApiResponse.ok({ email: invitation.email, groups: invitation.groups }); // ← email exposé
}
```

Les tokens sont des UUIDs v4 (2^122 combinaisons), donc le risque est limité en pratique. Mais le pattern est incohérent avec le reste du projet.

**Correction :**
```typescript
const ip = getIp(request);
const rl = checkRateLimit(`invite-get:${ip}`);
if (!rl.allowed) return ApiResponse.tooManyRequests('...');
```

---

## 2. Architecture

### 2.1 Requêtes Mongoose directes dans les routes de seed (IMPORTANT)

**Fichiers :**
- `app/api/test/seed/route.ts` — lignes 7-11 (imports modèles), 33-194 (accès directs)
- `app/api/test/seed/scenarios/route.ts` — lignes 4-9 (imports modèles), 27-99 (accès directs)

Ces routes utilisent directement les modèles Mongoose (`UserModel.deleteMany()`, `GroupModel.create()`, `TournamentConflictModel.create()`) en dehors du pattern repository imposé par CLAUDE.md.

Justification partielle : ces routes sont bloquées en production (`NODE_ENV === 'production'` → 403) et servent uniquement aux seeds de test E2E. Elles sont architecturalement incorrectes mais fonctionnellement isolées.

**Recommandation :** Tolérable à court terme car blocsées en prod. À refactoriser lors d'une maintenance E2E : utiliser les repositories existants (UserRepository, GroupRepository, etc.) via des helpers `createTestUser()`, `createTestGroup()` dans `src/test/helpers.ts`.

### 2.2 `connectToMongoDB()` redondant dans la route `[tokenId]` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts:6,18`

```typescript
import connectToMongoDB from '@/src/lib/db'; // ligne 6
...
await connectToMongoDB();                    // ligne 18 — redondant
const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId); // appelle déjà connectToMongoDB
```

**Correction :** Supprimer l'import et l'appel `await connectToMongoDB()`.

---

## 3. Validation

### 3.1 Format email non validé dans `external-access` (MINEUR)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/external-access/route.ts:29-30`

```typescript
const { email, expiresAt } = await request.json();
if (!email) return ApiResponse.badRequest('email requis'); // présence seule vérifiée
// format email non validé : "foo" passerait sans erreur
```

Contrairement aux autres routes qui utilisent `isValidEmail()` de `src/lib/validation.ts`, cette route ne valide que la présence du champ.

**Correction :**
```typescript
import { isValidEmail } from '@/src/lib/validation';
if (!email || !isValidEmail(email)) return ApiResponse.badRequest('Email invalide.');
```

---

## 4. Couverture de tests

### 4.1 Route `member-groups` sans test (MINEUR)

**Fichier :** `app/api/tournaments/[id]/member-groups/route.ts` — créé le 2026-06-13

Cette route retourne les groupes dont l'utilisateur est membre et qui ont le tournoi en question. Elle est utilisée pour afficher le bandeau d'info groupe sur la page tournoi. Elle n'a aucun test d'intégration.

**Cas à couvrir :**
- Retourne la liste des groupes de l'utilisateur contenant ce tournoi
- Retourne tableau vide si aucun groupe n'a ce tournoi
- Retourne 401 si non authentifié

---

## 5. God Components

Le projet compte **12 composants > 300 lignes** (contre 10 lors de l'audit du 2026-06-08). `Tournament.tsx` et `MatchModal.tsx` ont grossi depuis la dernière mesure.

| Composant | Lignes | Variation | Priorité découpage |
|-----------|-------|-----------|-------------------|
| `components/admin/groups/GroupDetailClient.tsx` | **480** | stable | Haute |
| `components/tournament/Tournament.tsx` | **398** | +22 | Haute |
| `components/tournament/TournamentsPageClient.tsx` | **375** | stable | Haute |
| `components/match/MatchModal.tsx` | **357** | +29 | Haute |
| `components/groups/GroupDetail.tsx` | **356** | stable | Moyenne |
| `components/tournament/PlayersTab.tsx` | **342** | stable | Moyenne |
| `components/groups/GroupTournamentScoutingPage.tsx` | **334** | stable | Moyenne |
| `components/groups/GroupTournaments.tsx` | **319** | stable | Faible |
| `components/ui/PlayerCommentHistory.tsx` | **317** | stable | Faible |
| `components/admin/users/UserDetailClient.tsx` | **315** | stable | Faible |
| `components/tournament/PlayerDeckModal.tsx` | **309** | 🆕 seuil | Faible |
| `components/round/Round.tsx` | **304** | 🆕 seuil | Faible |

**Découpage suggéré pour `Tournament.tsx` (398 L) :**
Ce composant gère l'onglet Players, l'onglet Reports, le Sidebar (liste des rondes), et les modales de conflit. Extraire :
- `TournamentSidebar` (liste des rondes, bouton fetch)
- `TournamentHeader` (nom, date, store)
- Déléguer à des hooks locaux `useTournamentConflicts()` pour la gestion de l'état des modales

---

## 6. Dette TypeScript persistante

**Fichiers :** `src/repositories/db/RoundRepository.ts` (lignes 67, 95, 114, 168) et `src/repositories/db/TournamentPlayersDeckRepository.ts` (lignes 142, 163, 224)

Les 7 usages de `any` sont annotés `eslint-disable-next-line @typescript-eslint/no-explicit-any` et concernent exclusivement les pipelines d'agrégation MongoDB. Remplaçables par `PipelineStage[]` depuis `mongoose` :

```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

---

## Récapitulatif des priorités

### 🔴 Critique — À corriger dans le sprint en cours

1. **`serverError()` expose les messages d'erreur internes** — 1 ligne à modifier dans `src/lib/api/responses.ts`, impact immédiat sur toutes les routes.

### 🟠 Important — À traiter ce mois

2. **Rate limiting sur `GET /api/invitations/[token]`** — 4 lignes à ajouter, pattern identique aux autres routes.
3. **Requêtes Mongoose directes dans les seeds E2E** — refactoriser vers les repositories lors d'une maintenance E2E.

### 🟡 Mineur — Backlog qualité

4. Supprimer `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts`.
5. Valider le format email dans `external-access/route.ts`.
6. Ajouter tests pour `member-groups/route.ts`.
7. Découper `Tournament.tsx` (398 L) et `MatchModal.tsx` (357 L) lors des prochaines features.
8. Typer les pipelines MongoDB avec `PipelineStage[]` (7 `any`).
