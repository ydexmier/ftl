import { describe, it, expect } from 'vitest';
import {
  getPlayerDecksInk,
  getMatchPlayerInks,
  mergePlayersDecks,
  deduplicateDecks,
} from '@/src/domain/rules/scoutingRules';
import type { PlayersDecksMap, PlayerDecksEntry } from '@/src/domain/rules/scoutingRules';
import type { Deck } from '@/src/types/ink';

const DECK_A = [['Ambre', 'Rubis']];
const DECK_B = [['Saphir', 'Émeraude']];

function makeMap(players: PlayersDecksMap['players']): PlayersDecksMap {
  return { tournamentId: 1, players };
}

describe('getPlayerDecksInk', () => {
  it('retourne les decks d\'un joueur existant', () => {
    const map = makeMap([{ playerId: 1, decks: DECK_A }]);
    expect(getPlayerDecksInk(map, 1)).toEqual(DECK_A);
  });

  it('retourne [] pour un joueur inexistant', () => {
    const map = makeMap([{ playerId: 1, decks: DECK_A }]);
    expect(getPlayerDecksInk(map, 99)).toEqual([]);
  });

  it('retourne [] si le joueur n\'a pas de decks', () => {
    const map = makeMap([{ playerId: 1, decks: [] }]);
    expect(getPlayerDecksInk(map, 1)).toEqual([]);
  });
});

describe('getMatchPlayerInks', () => {
  it('retourne les entrées des deux joueurs s\'ils sont tous deux connus', () => {
    const map = makeMap([
      { playerId: 1, decks: DECK_A },
      { playerId: 2, decks: DECK_B },
    ]);
    const match = { player_match_relationships: [{ player: { id: 1 } }, { player: { id: 2 } }] };
    const result = getMatchPlayerInks(match, map);
    expect(result).toHaveLength(2);
    expect(result![0].playerId).toBe(1);
    expect(result![1].playerId).toBe(2);
  });

  it('filtre les joueurs inconnus de la map', () => {
    const map = makeMap([{ playerId: 1, decks: DECK_A }]);
    const match = { player_match_relationships: [{ player: { id: 1 } }, { player: { id: 99 } }] };
    const result = getMatchPlayerInks(match, map);
    expect(result).toHaveLength(1);
    expect(result![0].playerId).toBe(1);
  });

  it('retourne undefined si aucun joueur n\'est connu', () => {
    const map = makeMap([]);
    const match = { player_match_relationships: [{ player: { id: 1 } }] };
    expect(getMatchPlayerInks(match, map)).toBeUndefined();
  });
});

describe('mergePlayersDecks', () => {
  it('met à jour les decks d\'un joueur existant', () => {
    const current = makeMap([{ playerId: 1, decks: DECK_A }]);
    const updated = makeMap([{ playerId: 1, decks: DECK_B }]);
    const result = mergePlayersDecks(current, updated);
    expect(result.players[0].decks).toEqual(DECK_B);
  });

  it('supprime un joueur si ses decks mis à jour sont vides', () => {
    const current = makeMap([{ playerId: 1, decks: DECK_A }, { playerId: 2, decks: DECK_B }]);
    const updated = makeMap([{ playerId: 1, decks: [] }]);
    const result = mergePlayersDecks(current, updated);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].playerId).toBe(2);
  });

  it('ajoute un nouveau joueur en fin de liste', () => {
    const current = makeMap([{ playerId: 1, decks: DECK_A }]);
    const updated = makeMap([{ playerId: 2, decks: DECK_B }]);
    const result = mergePlayersDecks(current, updated);
    expect(result.players).toHaveLength(2);
    expect(result.players[1].playerId).toBe(2);
  });

  it('retourne current inchangé si players n\'est pas défini', () => {
    const current = { tournamentId: 1 } as unknown as PlayersDecksMap;
    const updated = makeMap([{ playerId: 1, decks: DECK_A }]);
    const result = mergePlayersDecks(current, updated);
    expect(result).toBe(current);
  });

  it('conserve les joueurs non présents dans l\'update', () => {
    const current = makeMap([{ playerId: 1, decks: DECK_A }, { playerId: 2, decks: DECK_B }]);
    const updated = makeMap([{ playerId: 2, decks: [['Acier']] }]);
    const result = mergePlayersDecks(current, updated);
    expect(result.players).toHaveLength(2);
    expect(result.players[0].decks).toEqual(DECK_A);
    expect(result.players[1].decks).toEqual([['Acier']]);
  });
});

describe('deduplicateDecks', () => {
  it('retourne le tableau tel quel si aucun doublon', () => {
    const decks = [['Ambre', 'Rubis'], ['Saphir', 'Émeraude']] as unknown as Deck[];
    expect(deduplicateDecks(decks)).toEqual(decks);
  });

  it('supprime les entrées dupliquées identiques', () => {
    const decks = [['Ambre', 'Rubis'], ['Ambre', 'Rubis']] as unknown as Deck[];
    expect(deduplicateDecks(decks)).toHaveLength(1);
    expect(deduplicateDecks(decks)[0]).toEqual(['Ambre', 'Rubis']);
  });

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(deduplicateDecks([])).toEqual([]);
  });

  it('conserve la première occurrence en cas de doublon', () => {
    const decks = [['Ambre', 'Rubis'], ['Saphir'], ['Ambre', 'Rubis']] as unknown as Deck[];
    const result = deduplicateDecks(decks);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(['Ambre', 'Rubis']);
    expect(result[1]).toEqual(['Saphir']);
  });

  it('ne déduplique pas des entrées d\'ordre différent', () => {
    const decks = [['Ambre', 'Rubis'], ['Rubis', 'Ambre']] as unknown as Deck[];
    expect(deduplicateDecks(decks)).toHaveLength(2);
  });
});
