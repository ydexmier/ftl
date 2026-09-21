# Audit de dette technique — 2026-09-21

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-09-21  
**Référence précédente :** audit du 2026-06-08 (3 mois sans rapport)

---

## Résumé exécutif

Depuis le dernier audit (2026-06-08), **tous les problèmes critiques et importants ont été traités** : rate limiting sur `/api/guest/validate`, centralisation de `getIp()`, suppression des `connectToMongoDB()` redondants dans les routes `api-tokens` et `external/players`, et couverture des routes admin `pin`/`memo`. Des corrections de sécurité supplémentaires ont aussi été déployées (suppression de routes POST vestigiales sans auth, protection de DELETE `/api/tournaments/[id]`).

**Sur les 3 mois écoulés, 4 nouvelles features majeures ont atterri** : tokens d'API externe, inscriptions de tournoi (registrations), approbation/rejet des accès invités, et navigation mobile refonte. Ces features sont globalement bien couvertes en tests, mais **3 routes métier restent sans test d'intégration** (magic-link, guests approve/reject, users/search).

**Une régression d'architecture est identifiée** : le fichier `api-tokens/[tokenId]/route.ts` contient un `connectToMongoDB()` redondant — le même pattern que la correction du 18 juin qui avait supprimé ce problème du fichier parent. Le fichier enfant n'a pas bénéficié de la même correction.

**La prolifération des god components stagne** : le seuil des 300 lignes est désormais dépassé par 12 composants (contre 10 en juin), avec deux nouveaux — `Round.tsx` (304 l.) et `PlayerDeckModal.tsx` (309 l.) — qui ont légèrement franchi le seuil avec les dernières features. Aucun composant existant n'a été découpé.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture — connectToMongoDB | 🟠 Important | `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` | 🆕 Nouveau (régression) |
| 2 | Sécurité — rate limiting | 🟡 Mineur | `app/api/external/tournaments/[id]/players/route.ts` | 🆕 Nouveau |
| 3 | Redondance — fetch direct | 🟡 Mineur | `components/groups/ApiTokensTab.tsx` | 🆕 Nouveau |
| 4 | God component | 🟡 Mineur | `components/round/Round.tsx` (304 lignes) | 🆕 Nouveau |
| 5 | God component | 🟡 Mineur | `components/tournament/PlayerDeckModal.tsx` (309 lignes) | 🆕 Nouveau |
| 6 | Couverture tests | 🟡 Mineur | `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts` | 🆕 Nouveau |
| 7 | Couverture tests | 🟡 Mineur | `app/api/groups/[id]/guests/[accessId]/route.ts` | 🆕 Nouveau |
| 8 | Couverture tests | 🟡 Mineur | `app/api/users/search/route.ts` | 🆕 Nouveau |
| 9 | God component | 🟡 Mineur | `components/admin/groups/GroupDetailClient.tsx` (480 lignes) | 🔁 Persistant |
| 10 | God component | 🟡 Mineur | `components/tournament/Tournament.tsx` (398 lignes, +22) | 🔁 Persistant (croît) |
| 11 | God component | 🟡 Mineur | `components/tournament/TournamentsPageClient.tsx` (375 lignes) | 🔁 Persistant |
| 12 | God component | 🟡 Mineur | `components/match/MatchModal.tsx` (357 lignes) | 🔁 Persistant |
| 13 | God component | 🟡 Mineur | `components/groups/GroupDetail.tsx` (356 lignes) | 🔁 Persistant |
| 14 | God component | 🟡 Mineur | `components/tournament/PlayersTab.tsx` (342 lignes) | 🔁 Persistant |
| 15 | God component | 🟡 Mineur | `components/groups/GroupTournamentScoutingPage.tsx` (334 lignes) | 🔁 Persistant |
| 16 | God component | 🟡 Mineur | `components/groups/GroupTournaments.tsx` (319 lignes) | 🔁 Persistant |
| 17 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (317 lignes) | 🔁 Persistant |
| 18 | God component | 🟡 Mineur | `components/admin/users/UserDetailClient.tsx` (315 lignes) | 🔁 Persistant |
| 19 | Dette TS — any | 🟡 Mineur | `RoundRepository.ts` (4 usages), `TournamentPlayersDeckRepository.ts` (2 pipelines + 1 as any) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-06-08

| # | Problème corrigé | Commit |
|---|-----------------|--------|
| A | Rate limiting sur `/api/guest/validate` (🔴 Critique) | `d7a9b76` |
| B | `getIp()` centralisée dans `src/lib/auth/getIp.ts` (🟡 Mineur) | `d7a9b76` |
| C | `connectToMongoDB()` redondant dans `api-tokens/route.ts` et `external/players/route.ts` (🟡 Mineur) | `18b5adb` |
| D | `validateApiTokenName` centralisée dans `validation.ts` (🟡 Mineur) | `219e7ab` |
| E | Tests admin pin groupe et mémo utilisateur (🟡 Mineur) | `aea6ae7` |
| F | Routes POST vestigiales sans auth supprimées (🟠 Important) | `9ef02aa` |
| G | DELETE `/api/tournaments/[id]` protégée + audit log (🟠 Important) | `f510749` |

---

## 1. Architecture

### 1.1 `connectToMongoDB()` redondant dans `api-tokens/[tokenId]/route.ts` (IMPORTANT — RÉGRESSION)

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts` — ligne 18

Ce fichier appelle `connectToMongoDB()` directement avant d'invoquer `GroupRepository.isAdmin()` et `ApiTokenRepository.revoke()`, qui gèrent chacun leur propre connexion. C'est la même violation que celle corrigée le 18 juin dans le fichier parent `api-tokens/route.ts` (commit `18b5adb`). Le fichier enfant (suppression par `tokenId`) créé ensuite n'a pas bénéficié de la même correction.

```typescript
// app/api/groups/[id]/tournaments/[tid]/api-tokens/[tokenId]/route.ts
import connectToMongoDB from '@/src/lib/db';  // ← import inutile
// ...
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();
  // ...
  await connectToMongoDB();  // ← redondant, GroupRepository et ApiTokenRepository
                              //   appellent aussi connectToMongoDB() en interne
  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  const revoked = await ApiTokenRepository.revoke(tokenId, auth.userId, { groupId });
```

**Correction :** Supprimer l'import `connectToMongoDB` et l'appel `await connectToMongoDB()`.

```typescript
// Après correction :
import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { ApiResponse } from '@/src/lib/api/responses';
// — pas d'import connectToMongoDB —
```

---

## 2. Sécurité

### 2.1 Absence de rate limiting sur `/api/external/tournaments/[id]/players` (MINEUR)

**Fichier :** `app/api/external/tournaments/[id]/players/route.ts`

Cette route est accessible publiquement (dans `PUBLIC_PREFIXES`) et s'authentifie via un Bearer token. Elle n'a pas de rate limiting, contrairement à toutes les autres routes publiques d'authentification du projet.

**Risque :** Un attaquant peut faire des milliers de requêtes avec des tokens invalides pour tenter de valider des tokens par brute force, ou simplement pour saturer `ApiTokenRepository.findByRawToken` (hachage SHA-256). En pratique le token est 64 hex chars donc le brute force est infaisable, mais le serveur exécute quand même le hash et la requête MongoDB pour chaque tentative.

**Pattern existant à reproduire :**
```typescript
// Ajouter au début de GET :
import { checkRateLimit } from '@/src/lib/auth/rateLimit';
import { getIp } from '@/src/lib/auth/getIp';

const rl = checkRateLimit(`external-api:${getIp(request)}`);
if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de requêtes');
```

---

## 3. Redondances

### 3.1 `fetch()` directs dans `ApiTokensTab.tsx` pour les requêtes GET (MINEUR)

**Fichier :** `components/groups/ApiTokensTab.tsx` — lignes 42, 60, 85

La fonction `fetchTokens` implémente manuellement un cycle loading/error/data via `useState` + `useCallback` + `useEffect`, alors que `useFetch<T>` existe dans `src/hooks/useFetch.ts` et fait exactement cela. Les calls POST et DELETE sont appropriés en fetch direct (mutations), mais le GET initial devrait utiliser le hook.

```typescript
// Actuel :
const fetchTokens = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Erreur lors du chargement');
    setTokens(await res.json());
  } catch {
    setError('Impossible de charger les tokens');
  } finally { setLoading(false); }
}, [baseUrl]);

useEffect(() => { fetchTokens(); }, [fetchTokens]);

// Avec useFetch :
const { data, loading, error } = useFetch<ApiToken[]>(baseUrl);
useEffect(() => { if (data) setTokens(data); }, [data]);
```

Note : le hook `useFetch` ne supporte pas le rechargement impératif après mutation. Il faudrait soit étendre `useFetch` avec un `refresh()`, soit accepter ce pattern pour les composants mutants. Ce point est à trancher avant de corriger.

---

## 4. God components

Le projet compte désormais **12 composants > 300 lignes** (contre 10 en juin). Les deux nouveaux sont des composants de feature qui ont légèrement franchi le seuil avec les dernières évolutions.

### 4.1 Nouveaux (depuis juin 2026)

| Composant | Lignes | Cause probable |
|-----------|-------|---------------|
| `components/round/Round.tsx` | 304 | Ajout filtre multi-sélection + barre de progression + fade-out |
| `components/tournament/PlayerDeckModal.tsx` | 309 | Ajout onglet historique + recherche pseudo adversaire |

### 4.2 Persistants — stables ou légèrement croissants

| Composant | Lignes | Tendance vs juin |
|-----------|-------|-----------------|
| `components/admin/groups/GroupDetailClient.tsx` | 480 | Stable |
| `components/tournament/Tournament.tsx` | 398 | +22 (croît) |
| `components/tournament/TournamentsPageClient.tsx` | 375 | Stable |
| `components/match/MatchModal.tsx` | 357 | Stable |
| `components/groups/GroupDetail.tsx` | 356 | Stable |
| `components/tournament/PlayersTab.tsx` | 342 | Stable |
| `components/groups/GroupTournamentScoutingPage.tsx` | 334 | Stable |
| `components/groups/GroupTournaments.tsx` | 319 | Stable |
| `components/ui/PlayerCommentHistory.tsx` | 317 | Stable |
| `components/admin/users/UserDetailClient.tsx` | 315 | Stable |

`Tournament.tsx` à 398 lignes est le composant persistant qui grossit le plus vite. À surveiller : si la tendance continue, il atteindra 450 lignes au prochain cycle de features majeures.

---

## 5. Couverture de tests

### 5.1 Routes sans test d'intégration (MINEUR)

Trois routes créées lors des dernières features n'ont pas de tests.

#### `GET + POST /api/groups/[id]/tournaments/[tid]/magic-link`

**Fichier :** `app/api/groups/[id]/tournaments/[tid]/magic-link/route.ts`

Cette route gère la génération du token UUID pour le magic link. La logique inclut la vérification que le tournoi appartient bien au groupe (`GroupTournamentRepository.hasAccess`) et l'upsert du lien existant. Cas prioritaires :

- `GET` sans auth → 401
- `GET` par non-admin du groupe → 403
- `GET` par admin → 200 avec le lien actif ou `link: null`
- `POST` sans auth → 401
- `POST` par non-admin → 403
- `POST` sur tournoi qui n'appartient pas au groupe → 404
- `POST` → crée/réactive le lien, `GroupMagicLinkModel` contient 1 seul doc actif

#### `PUT /api/groups/[id]/guests/[accessId]`

**Fichier :** `app/api/groups/[id]/guests/[accessId]/route.ts`

Cette route gère approve/reject/revoke des accès invités avec envoi d'email au statut ACCEPTED. Cas prioritaires :

- Sans auth → 401
- Non-admin → 403
- `action: 'approve'` sur un accès PENDING → 200, statut ACCEPTED, email envoyé
- `action: 'approve'` sur un accès déjà ACCEPTED → 400
- `action: 'reject'` sur PENDING → 200, statut REJECTED
- `action: 'revoke'` sur ACCEPTED → 200, statut REVOKED
- `action: 'revoke'` sur REVOKED → 400

#### `GET /api/users/search`

**Fichier :** `app/api/users/search/route.ts`

Recherche d'utilisateurs pour l'ajout de membres à un groupe. Validations inline (requête < 3 chars). Cas prioritaires :

- Sans auth → 401
- Requête < 3 chars → 400
- Requête ≥ 3 chars → 200, tableau filtré (max 10 résultats)
- Pas de fuite : vérifier que `passwordHash` n'est pas dans la réponse

---

## 6. Dette TypeScript persistante

### 6.1 `any` dans les pipelines MongoDB (MINEUR — JUSTIFIABLE)

**Fichiers :**
- `src/repositories/db/RoundRepository.ts` — lignes 95, 114, 168 (3 `any[]`)
- `src/repositories/db/TournamentPlayersDeckRepository.ts` — lignes 142 (`as any`), 163, 224 (2 `any[]`)

Ces `any` sont des pipelines d'agrégation MongoDB. Le type `PipelineStage` (Mongoose v7) permettrait de les éliminer :

```typescript
import type { PipelineStage } from 'mongoose';
const pipeline: PipelineStage[] = [{ $match: ... }];
```

Le `as any` ligne 142 de `TournamentPlayersDeckRepository.ts` est utilisé pour contourner un problème de typage dans une opération `bulkWrite` avec `$push`. Ce cast reste acceptable mais pourrait être remplacé par un type plus précis.

---

## Récapitulatif des priorités

### 🟠 Important — Corriger dans le prochain sprint

1. **Supprimer `connectToMongoDB()` dans `api-tokens/[tokenId]/route.ts`** — régression de la correction du 18 juin, 2 lignes à supprimer.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Ajouter rate limiting sur `/api/external/tournaments/[id]/players` — 5 lignes, pattern identique.
3. Écrire tests pour magic-link GET/POST, guests PUT, users/search GET.
4. Clarifier `useFetch` vs `fetch` direct pour les composants mutants (`ApiTokensTab.tsx`).
5. Typer les pipelines MongoDB avec `PipelineStage[]`.
6. Décomposer `GroupDetailClient.tsx` (480 l.) et surveiller `Tournament.tsx` (398 l., croît).
