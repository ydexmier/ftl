# Documentation d'intégration — API externe Companion Lorcana

## Vue d'ensemble

L'API externe permet à des entités tierces (bots Discord, sites de streaming, outils d'analyse) de récupérer en lecture seule les bicolorités et commentaires des joueurs d'un tournoi.

L'accès est accordé par un administrateur du groupe via l'interface de l'application. Chaque token est limité à un tournoi précis et expire après 30 jours.

---

## Authentification

Chaque requête doit inclure le token dans le header HTTP `Authorization` :

```
Authorization: Bearer <token>
```

Le token est une chaîne hexadécimale de 64 caractères fourni par l'administrateur du groupe.

> **Important :** Le token est affiché une seule fois lors de sa création. Stockez-le immédiatement dans un endroit sécurisé (variable d'environnement, secret de CI/CD). Il ne peut pas être récupéré après coup.

---

## Endpoint

### Récupérer les joueurs d'un tournoi

```
GET /api/external/tournaments/{tournamentId}/players
```

#### Paramètres

| Paramètre | Type | Emplacement | Description |
|-----------|------|-------------|-------------|
| `tournamentId` | `number` | URL | Identifiant numérique du tournoi (ex. `42`) |
| `Authorization` | `string` | Header | `Bearer <token>` |

#### Exemple de requête

```bash
curl -H "Authorization: Bearer a3f8c2d1e4b5f6a7..." \
  https://votre-instance.com/api/external/tournaments/42/players
```

---

## Réponses

### Succès — `200 OK`

```json
{
  "tournamentId": 42,
  "scopeType": "group",
  "generatedAt": "2026-05-27T10:00:00.000Z",
  "players": [
    {
      "id": 456,
      "best_identifier": "NomJoueur",
      "pronouns": "il/lui",
      "event_best_identifier": "NomJoueur#1234",
      "decks": [
        ["Amber", "Sapphire"]
      ],
      "comments": [
        {
          "inks": ["Amber", "Sapphire"],
          "content": "Joue très aggro, attention tour 4",
          "createdAt": "2026-05-27T09:00:00.000Z"
        }
      ]
    },
    {
      "id": 457,
      "best_identifier": "AutreJoueur",
      "pronouns": null,
      "event_best_identifier": "AutreJoueur#5678",
      "decks": [],
      "comments": []
    }
  ]
}
```

#### Description des champs

**Racine**

| Champ | Type | Description |
|-------|------|-------------|
| `tournamentId` | `number` | ID du tournoi interrogé |
| `scopeType` | `"group"` \| `"user"` | Portée des données retournées |
| `generatedAt` | `string (ISO 8601)` | Horodatage de la réponse |
| `players` | `array` | Liste des joueurs du tournoi |

**Objet `player`**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant Ravensburger du joueur |
| `best_identifier` | `string` | Pseudo principal du joueur |
| `pronouns` | `string \| null` | Pronoms déclarés (peut être `null`) |
| `event_best_identifier` | `string` | Identifiant affiché dans l'événement |
| `decks` | `string[][]` | Bicolorités assignées — tableau de combinaisons d'encres. Vide si non scouté |
| `comments` | `array` | Commentaires de scouting sur ce joueur |

**Objet `comment`**

| Champ | Type | Description |
|-------|------|-------------|
| `inks` | `string[]` | Combinaison d'encres concernée par le commentaire |
| `content` | `string` | Texte du commentaire (max 500 caractères) |
| `createdAt` | `string (ISO 8601)` | Date de création du commentaire |

**Valeurs d'encres possibles**

Les encres suivent l'ordre canonique : `Amber`, `Amethyst`, `Emerald`, `Ruby`, `Sapphire`, `Steel`

---

### Erreurs

| Code | Message | Cause |
|------|---------|-------|
| `400` | `ID de tournoi invalide` | L'ID dans l'URL n'est pas un nombre valide |
| `401` | `Bearer token requis` | Header `Authorization` absent ou mal formé |
| `401` | `Token manquant` | Header présent mais token vide après `Bearer ` |
| `401` | `Token invalide ou révoqué` | Token inconnu, mal copié, ou révoqué par l'administrateur |
| `401` | `Token expiré` | Les 30 jours de validité du token sont écoulés |
| `403` | `Ce token ne donne pas accès à ce tournoi` | Le token existe mais a été créé pour un autre tournoi |

#### Format des erreurs

```json
{
  "error": "Description du problème"
}
```

---

## Durée de vie et renouvellement

- **Expiration** : 30 jours après la création
- **Révocation** : un administrateur peut révoquer un token à tout moment depuis l'onglet "Accès API" de la page du tournoi
- **Renouvellement** : il n'existe pas de mécanisme de refresh. Lorsque votre token expire ou est révoqué, contactez l'administrateur du groupe pour qu'il en génère un nouveau

> Anticipez l'expiration en mettant en place une alerte dans votre système avant la date de fin de validité (champ `expiresAt` communiqué par l'administrateur lors de la création).

---

## Bonnes pratiques

**Stockage du token**
Stockez le token dans une variable d'environnement ou un secret de votre système de CI/CD. Ne le commitez jamais en clair dans votre code source.

```bash
# Exemple — variable d'environnement
export LORCANA_API_TOKEN="a3f8c2d1e4b5f6a7..."
```

**Gestion des erreurs**
Votre intégration doit gérer explicitement les codes `401` et `403`. Un `401` avec le message `Token expiré` indique qu'il faut contacter l'administrateur pour un renouvellement.

**Fréquence d'appel**
L'API ne définit pas de rate limiting strict, mais il est conseillé de ne pas dépasser un appel toutes les 30 secondes pour ne pas surcharger le serveur pendant un tournoi actif.

---

## Exemple d'intégration (Node.js)

```javascript
const TOKEN = process.env.LORCANA_API_TOKEN;
const BASE_URL = 'https://votre-instance.com';

async function getPlayers(tournamentId) {
  const res = await fetch(`${BASE_URL}/api/external/tournaments/${tournamentId}/players`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(`[${res.status}] ${error}`);
  }

  return res.json();
}
```

```javascript
const { players, scopeType, generatedAt } = await getPlayers(42);
console.log(`${players.length} joueurs — scope : ${scopeType}`);

for (const player of players) {
  const decks = player.decks.map(d => d.join('/') || '—').join(', ');
  console.log(`${player.best_identifier} : ${decks}`);
}
```
