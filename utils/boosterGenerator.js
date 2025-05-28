import * as R from 'ramda';
import {rare, foil} from './cardRarity';

const rarityOrder = [
    'Common',
    'Uncommon',
    'Rare',
    'Super_rare',
    'Legendary',
    'Enchanted',
];

const CARD_VARIANT_FOIL = 'foil';
const CARD_VARIANT_NORMAL = 'normal';

// Récupère toutes les cartes d'une rareté donnée avec un ink spécifique exclu
function filterCards(cards, rarity, excludedInks) {
    return cards.filter((card) => {
        const inkOk = card.ink && !excludedInks.has(card.ink); // ← ajout de cette condition
        return card.rarity === rarity && inkOk;
    });
}

// Tirage aléatoire dans un tableau
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBoosters(cards, boosterCount) {
    const boosters = [];

    for (let b = 0; b < boosterCount; b++) {
        const booster = [];

        // --- 6 cartes communes avec ink différentes ---
        let usedInks = new Set();
        for (let i = 0; i < 6; i++) {
            // filtre cartes common et ink pas encore utilisé
            const possibles = filterCards(cards, 'Common', usedInks);
            if (possibles.length === 0) break; // sécurité
            const chosen = pickRandom(possibles);
            booster.push({...chosen, variant: CARD_VARIANT_NORMAL});
            usedInks.add(chosen.ink);
        }

        // --- 3 cartes uncommons avec inks différentes ---
        // reset inks, mais on veut inks différentes pour ces 3
        usedInks = new Set();
        for (let i = 0; i < 3; i++) {
            const possibles = filterCards(cards, 'Uncommon', usedInks);
            if (possibles.length === 0) break;
            const chosen = pickRandom(possibles);
            booster.push({...chosen, variant: CARD_VARIANT_NORMAL});
            usedInks.add(chosen.ink);
        }

        // Carte numero 10 et 11
        let rareCard;
        for (let i = 0; i < 2; i++) {
            let rareLevel = rare(); // 3, 4 ou 5
            let rareRarity = rarityOrder[rareLevel - 1]; // car index 2 = "Rare", etc.

            // Filtrer les cartes avec la rareté exacte
            const rare1Options = cards.filter(
                (card) => card.rarity === rareRarity && rareCard?.id !== card.id
            );
            if (rare1Options.length === 0)
                throw new Error(`Pas de cartes pour rareté ${rareRarity}`);
            rareCard = pickRandom(rare1Options);
            booster.push({...rareCard, variant: CARD_VARIANT_NORMAL});
        }

        // Petit algo pour retrier par rareté
        const orderMap = R.zipObj(rarityOrder, R.range(0, rarityOrder.length));
        const sortByRarity = R.sortBy((obj) => orderMap[obj.rarity]);
        const sortedBooster = sortByRarity(booster) || [];

        // --- Dernière carte déterminée par foil() ---
        const foilLevel = foil(); // valeur entre 1 et 6
        const foilRarity = rarityOrder[foilLevel - 1]; // correspond à l’index dans rarityOrder

        const foilPossible = cards.filter((card) => card.rarity === foilRarity);
        if (foilPossible.length === 0)
            throw new Error(`Aucune carte avec la rareté foil: ${foilRarity}`);

        const foilCard = pickRandom(foilPossible);
        sortedBooster.push({...foilCard, variant: CARD_VARIANT_FOIL});

        boosters.push(sortedBooster);
    }

    return boosters;
}
