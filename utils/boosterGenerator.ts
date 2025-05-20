import { rare, foil } from '../utils/cardRarity';

type Card = {
  id: string;
  rarity: string;
  ink: string;
  // ... autres propriétés
};

const rarityOrder = [
  "Common",
  "Uncommon",
  "Rare",
  "Super_rare",
  "Legendary",
  "Enchanted"
];

// Récupère toutes les cartes d'une rareté donnée avec un ink spécifique exclu
function filterCards(
  cards: Card[],
  rarity: string,
  excludedInks: Set<string> = new Set(),
  minimumRarity?: string
): Card[] {
  return cards.filter(card => {
    const meetsRarity = minimumRarity
      ? rarityOrder.indexOf(card.rarity) >= rarityOrder.indexOf(minimumRarity)
      : card.rarity === rarity;

    const inkOk = card.ink && !excludedInks.has(card.ink); // ← ajout de cette condition
    return meetsRarity && inkOk;
  });
}


// Tirage aléatoire dans un tableau
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBoosters(cards: Card[], boosterCount: number): Card[][] {
  const boosters: Card[][] = [];

  for(let b = 0; b < boosterCount; b++) {
    const booster: Card[] = [];

    // --- 6 cartes communes avec ink différentes ---
    let usedInks = new Set<string>();
    for(let i=0; i<6; i++) {
      // filtre cartes common et ink pas encore utilisé
      const possibles = filterCards(cards, "Common", usedInks);
      if(possibles.length === 0) break; // sécurité
      const chosen = pickRandom(possibles);
      booster.push(chosen);
      usedInks.add(chosen.ink);
    }

    // --- 3 cartes uncommons avec inks différentes ---
    // reset inks, mais on veut inks différentes pour ces 3
    usedInks = new Set<string>();
    for(let i=0; i<3; i++) {
      const possibles = filterCards(cards, "Uncommon", usedInks);
      if(possibles.length === 0) break;
      const chosen = pickRandom(possibles);
      booster.push(chosen);
      usedInks.add(chosen.ink);
    }

const rareLevel = rare(); // 3, 4 ou 5
const rareRarity = rarityOrder[rareLevel - 1]; // car index 2 = "Rare", etc.
const rareIndex = rarityOrder.indexOf(rareRarity);

// Filtrer les cartes avec la rareté exacte
const rare1Options = cards.filter(card => card.rarity === rareRarity);
if (rare1Options.length === 0) throw new Error(`Pas de cartes pour rareté ${rareRarity}`);
const rare1 = pickRandom(rare1Options);
booster.push(rare1);

// --- Carte 11 : rare2 ---
// Doit être >= rare1 et <= Legendary
const maxAllowedIndex = rarityOrder.indexOf("Legendary");

const rare2Options = cards.filter(card => {
  const index = rarityOrder.indexOf(card.rarity);
  return index >= rareIndex && index <= maxAllowedIndex;
});

if (rare2Options.length === 0) throw new Error("Pas assez de cartes pour rare2");
const rare2 = pickRandom(rare2Options);
booster.push(rare2);

    // --- Dernière carte déterminée par foil() ---

const foilLevel = foil(); // valeur entre 1 et 6
const foilRarity = rarityOrder[foilLevel - 1]; // correspond à l’index dans rarityOrder

const foilPossible = cards.filter(card => card.rarity === foilRarity);
if (foilPossible.length === 0) throw new Error(`Aucune carte avec la rareté foil: ${foilRarity}`);

const foilCard = pickRandom(foilPossible);
booster.push(foilCard);

    boosters.push(booster);
  }

  return boosters;
}
