# Audit de dette technique — 2026-05-25

**Projet :** Companion Lorcana  
**Branche analysée :** `staging`  
**Auditeur :** Claude (audit automatique hebdomadaire)  
**Date :** 2026-05-25

---

## Résumé exécutif

Comparé à l'audit du 2026-05-19, la progression est **totale sur les problèmes prioritaires** : les 4 items critiques/importants signalés la semaine dernière (rate limiting `forgot-password`, `reset-password`, `invitations/[token]`, bug `DeleteTournamentButton`) sont tous corrigés. La validation déclarative des routes admin (users, groups, feedback, invitations) a été complétée avec 4 nouvelles fonctions dans `validation.ts`. `GroupDetailClient.tsx` a été découpé de 478 à 269 lignes. La couverture de tests atteint son niveau le plus élevé : **1 seule route non testée** sur 75+ (`/api/tournaments/[id]/stats`).

**Un problème d'architecture transversal** est identifié pour la première fois : `getAdminSession`, une primitive d'auth parallèle non documentée dans CLAUDE.md, est utilisée dans 10 routes admin. Elle retourne un objet `{ parsed, session }` différent de `getAuthSession()` (`{ userId, role, sessionId }`), appelle `connectToMongoDB()` directement (hors repository), et coexiste avec deux autres patterns d'auth dans les mêmes routes admin. Ce n'est pas critique fonctionnellement, mais c'est une dette architecturale qui s'aggrave à chaque nouvelle route admin ajoutée.

Le seul nouveau god component (`StatsTab.tsx`, 433 lignes) est fonctionnel mais contient 3 fonctions de construction ECharts qui mériteraient d'être externalisées.

---

## Tableau de synthèse

| # | Catégorie | Criticité | Fichier(s) | État |
|---|-----------|-----------|-----------|------|
| 1 | Architecture | 🟠 Important | `src/lib/auth/getAdminSession.ts` + 10 routes admin | 🆕 Nouveau |
| 2 | Architecture | 🟡 Mineur | `app/api/admin/fetchRound/route.ts`, `fetchTournament/route.ts` | 🆕 Nouveau |
| 3 | God component | 🟡 Mineur | `components/tournament/StatsTab.tsx` (433 lignes) | 🆕 Nouveau |
| 4 | Couverture tests | 🟡 Mineur | `app/api/tournaments/[id]/stats/route.ts` | 🆕 Nouveau |
| 5 | Fetch directs | 🟡 Mineur | `components/tournament/Tournament.tsx` (7 useEffect/fetch) | 🔁 Persistant |
| 6 | God component | 🟡 Mineur | `components/ui/PlayerCommentHistory.tsx` (314 lignes) | 🔁 Persistant |

### Problèmes corrigés depuis l'audit du 2026-05-19

| # | Problème corrigé | Statut |
|---|-----------------|--------|
| A | Rate limiting manquant sur `/api/auth/forgot-password` (🔴 Critique) | ✅ Corrigé |
| B | Rate limiting manquant sur `/api/auth/reset-password/[token]` (🟠 Important) | ✅ Corrigé |
| C | Rate limiting manquant sur `/api/invitations/[token]` (🟠 Important) | ✅ Corrigé |
| D | Bug `(response as any).data` dans `DeleteTournamentButton.tsx` (🟠 Important) | ✅ Corrigé |
| E | Validation déclarative routes admin — users, groups, feedback, invitations (🟠 Important) | ✅ Corrigé — 4 fonctions ajoutées dans `validation.ts` |
| F | `GroupDetailClient.tsx` 478 lignes (🟡 Mineur) | ✅ Découpé → 269 lignes |
| G | Tests manquants `last-round` et `comment-counts` (🟡 Mineur) | ✅ `last-round.test.ts`, `comment-counts.test.ts` ajoutés |

---

## 1. Architecture

### 1.1 `getAdminSession` — primitive d'auth parallèle incohérente (IMPORTANT)

**Fichier concerné :** `src/lib/auth/getAdminSession.ts`  
**Routes impactées (10) :**
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/users/[id]/reports/route.ts`
- `app/api/admin/badge-counts/route.ts`
- `app/api/admin/stats/route.ts`
- `app/api/admin/invitations/route.ts`
- `app/api/admin/invitations/[id]/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/access-requests/route.ts`
- `app/api/admin/access-requests/[id]/route.ts`

**Problème :** Un helper d'authentification `getAdminSession` a été introduit sans être documenté dans CLAUDE.md et sans alignement avec le pattern `getAuthSession(request)` établi. Il présente trois défauts :

1. **Interface différente de `getAuthSession`** : retourne `{ parsed, session }` au lieu de `{ userId, role, sessionId }`, forçant les routes à écrire `auth.session.userId` au lieu de `auth.userId`.

   ```typescript
   // getAdminSession — interface peu ergonomique
   const auth = await getAdminSession(request);
   const adminUser = await UserRepository.findById(String(auth.session.userId)); // ← auth.session.userId
   
   // getAuthSession — interface canonique
   const auth = await getAuthSession(request);
   const adminUser = await UserRepository.findById(auth.userId); // ← auth.userId
   ```

2. **`connectToMongoDB()` hors repository** : `getAdminSession.ts` appelle `connectToMongoDB()` directement, violant le principe d'architecture qui réserve les connexions DB aux repositories.

   ```typescript
   // src/lib/auth/getAdminSession.ts — appel DB direct
   await connectToMongoDB();  // ← ne devrait pas être là
   const session = await getSession(parsed.sessionId);
   ```

3. **3 patterns d'auth distincts dans les routes admin** : les routes admin utilisent indifféremment :
   - `getAdminSession()` → `{ parsed, session }` (10 routes)
   - `getAuthSession()` + `hasRole()` inline (ex. `admin/feedback/route.ts`, `admin/feedback/[id]/route.ts`)
   - `getAdminAuth()` locale définie dans chaque fichier, retournant `{ auth, error }` (ex. `admin/groups/`, `admin/groups/[id]/members/`, `admin/groups/[id]/tournaments/`)

**Correction recommandée :** Supprimer `getAdminSession` et le remplacer par une fonction utilitaire centralisée qui s'appuie sur `getAuthSession` :

```typescript
// src/lib/auth/getAuthSession.ts — ajouter une surcouche admin
export async function requireAdminSession(
  request: NextRequest,
): Promise<{ session: AuthSession } | { error: NextResponse }> {
  const session = await getAuthSession(request);
  if (!session) return { error: ApiResponse.unauthorized() };
  if (!hasRole(session.role as UserRole, 'ADMIN')) return { error: ApiResponse.forbidden() };
  return { session };
}
```

Toutes les routes admin pourraient alors utiliser :
```typescript
const result = await requireAdminSession(request);
if ('error' in result) return result.error;
const { session } = result; // session.userId, session.role, session.sessionId
```

Cela supprime les 3 `getAdminAuth()` locaux dupliqués dans `admin/groups`, `admin/groups/[id]/members`, `admin/groups/[id]/tournaments`, et normalise tous les patterns.

---

### 1.2 `connectToMongoDB()` redondant dans les routes fetchRound et fetchTournament (MINEUR)

**Fichiers :**
- `app/api/admin/fetchRound/route.ts:15`
- `app/api/admin/fetchTournament/route.ts:14`

**Problème :** Ces routes appellent `connectToMongoDB()` directement avant d'appeler un repository, alors que chaque repository gère sa propre connexion en interne.

```typescript
// fetchRound/route.ts — connectToMongoDB() redondant
await connectToMongoDB();                          // ← redondant
const existing = await RoundRepository.findById(Number(roundId)); // appelle aussi connectToMongoDB()
```

**Impact :** Aucun impact fonctionnel (idempotent grâce au singleton), mais crée un couplage inutile entre la route et l'implémentation interne des repositories, et crée une confusion sur la responsabilité de la connexion.

**Correction :** Supprimer `connectToMongoDB()` et `import connectToMongoDB from '@/src/lib/db'` des deux routes. La connexion est gérée par `RoundRepository.findById()` et `TournamentRepository.findById()`.

---

## 2. God components

### 2.1 `StatsTab.tsx` — 433 lignes (MINEUR)

**Fichier :** `components/tournament/StatsTab.tsx`

Ce nouveau composant (feature "onglet statistiques de tournoi") dépasse le seuil des 300 lignes. Il cumule :
- La construction des 3 options ECharts : `buildDonutOption()`, `buildBarOption()`, `buildHeatmapOption()` — ~90 lignes chacune avec de la logique de formatage riche
- Un appel `fetch()` direct dans `useEffect` au lieu de `useFetch`
- Des calculs de dérivation (`barHeight`, `heatmapSize`, `globalRates`) inline dans le corps du composant

**Découpage suggéré :**
- Extraire les 3 builders ECharts dans `src/lib/charts/tournamentChartOptions.ts` (fonctions pures, facilement testables)
- Extraire le fetch dans un hook `useTournamentStats(tournamentId, groupId)` pour cohérence avec les autres hooks du projet

---

## 3. Couverture de tests

### 3.1 `/api/tournaments/[id]/stats` — seule route non testée (MINEUR)

**Fichier :** `app/api/tournaments/[id]/stats/route.ts`

Cette route est la **seule parmi les 75+ routes de l'application à ne pas avoir de test**. Elle est notable car elle contient de la logique métier directement dans le handler (construction de la matchup matrix, calcul des win rates), ce qui la rend prioritaire par rapport à d'autres routes CRUD.

Cas à couvrir :
- Retourne 401 si non authentifié
- Retourne 403 si `groupId` fourni et non-membre
- Retourne des stats vides pour un tournoi sans données scoutées
- Retourne `inkDistribution` et `matchupMatrix` corrects après avoir assigné des decks et simulé des matchs
- Retourne `scoutingProgress.fullyScouted` correct selon les données

---

## 4. Patterns persistants acceptés

### 4.1 Fetch directs dans `Tournament.tsx` (7 useEffect)

`components/tournament/Tournament.tsx` gère 7 appels `fetch()` directs : `last-round`, `auth/me`, `my-role`, `merge-status`, `conflicts` (user), `conflicts` (groupe), `uncertainties`. Chaque ajout de feature tend à en rajouter un. Un hook `useTournamentContext(tournamentId, groupId)` centraliserait cette logique et faciliterait les tests. Non prioritaire mais à considérer lors de la prochaine refonte de la page tournoi.

### 4.2 `PlayerCommentHistory.tsx` (314 lignes)

Stable depuis 2 audits, à surveiller. Aucune dégradation cette semaine.

---

## Récapitulatif des priorités

### 🟠 Important — À planifier dans les 2 prochains sprints

1. **Unifier les 3 patterns d'auth admin** autour d'un `requireAdminSession()` centralisé — supprimer `getAdminSession.ts` et les `getAdminAuth()` locaux.

### 🟡 Mineur — Opportunités d'amélioration continue

2. Supprimer les `connectToMongoDB()` redondants dans `fetchRound/route.ts` et `fetchTournament/route.ts`.
3. Extraire les builders ECharts de `StatsTab.tsx` vers `src/lib/charts/`.
4. Ajouter tests pour `/api/tournaments/[id]/stats`.
5. Surveiller la croissance de `PlayerCommentHistory.tsx` (314 lignes, stable).
