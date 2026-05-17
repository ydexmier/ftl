import { describe, it, expect } from 'vitest';
import {
  matchModalReducer,
  matchModalInitialState,
  type MatchModalState,
} from '@/src/hooks/useMatchState';
import { countConflictsByTournament } from '@/src/domain/rules/conflictRules';
import { mergeTournamentsWithoutDuplicates } from '@/src/domain/rules/tournamentRules';

// ─── matchModalReducer ────────────────────────────────────────────────────────

describe('matchModalReducer', () => {
  it('RESET retourne etat initial', () => {
    const modified: MatchModalState = {
      combination1: { decks: [['Ambre', 'Rubis']], playerId: 1 },
      combination2: { decks: [['Saphir']], playerId: 2 },
    };
    const result = matchModalReducer(modified, { type: 'RESET' });
    expect(result).toEqual(matchModalInitialState);
  });

  it('SELECT_INK ajoute une encre si absente', () => {
    const state = matchModalReducer(matchModalInitialState, {
      type: 'SELECT_INK',
      combo: 'combination1',
      ink: 'Ambre',
    });
    expect(state.combination1.decks).toEqual([['Ambre']]);
  });

  it('SELECT_INK retire une encre deja selectionnee', () => {
    const state: MatchModalState = {
      combination1: { decks: [['Ambre', 'Rubis']], playerId: null },
      combination2: { decks: [], playerId: null },
    };
    const result = matchModalReducer(state, {
      type: 'SELECT_INK',
      combo: 'combination1',
      ink: 'Ambre',
    });
    expect(result.combination1.decks).toEqual([['Rubis']]);
  });

  it('SELECT_DECK remplace le deck', () => {
    const result = matchModalReducer(matchModalInitialState, {
      type: 'SELECT_DECK',
      combo: 'combination2',
      deck: ['Saphir', 'Emeraude'],
    });
    expect(result.combination2.decks).toEqual([['Saphir', 'Emeraude']]);
  });

  it('ASSIGN_PLAYER assigne les deux joueurs en miroir depuis combination1', () => {
    const result = matchModalReducer(matchModalInitialState, {
      type: 'ASSIGN_PLAYER',
      combo: 'combination1',
      playerId: 10,
      otherPlayId: 20,
    });
    expect(result.combination1.playerId).toBe(10);
    expect(result.combination2.playerId).toBe(20);
  });

  it('ASSIGN_PLAYER depuis combination2 inverse correctement', () => {
    const result = matchModalReducer(matchModalInitialState, {
      type: 'ASSIGN_PLAYER',
      combo: 'combination2',
      playerId: 5,
      otherPlayId: 6,
    });
    expect(result.combination2.playerId).toBe(5);
    expect(result.combination1.playerId).toBe(6);
  });

  it('COPY_DECKS copie les decks de combination1 vers combination2', () => {
    const state: MatchModalState = {
      combination1: { decks: [['Ambre', 'Acier']], playerId: null },
      combination2: { decks: [], playerId: null },
    };
    const result = matchModalReducer(state, { type: 'COPY_DECKS', combo: 'combination1' });
    expect(result.combination2.decks).toEqual([['Ambre', 'Acier']]);
    expect(result.combination1.decks).toEqual([['Ambre', 'Acier']]);
  });

  it('INITIALIZE_COMBINATION initialise une combinaison sans toucher l\'autre', () => {
    const result = matchModalReducer(matchModalInitialState, {
      type: 'INITIALIZE_COMBINATION',
      combo: 'combination2',
      decks: [['Rubis', 'Saphir']],
      playerId: 42,
    });
    expect(result.combination2).toEqual({ decks: [['Rubis', 'Saphir']], playerId: 42 });
    expect(result.combination1).toEqual(matchModalInitialState.combination1);
  });
});

// ─── countConflictsByTournament ───────────────────────────────────────────────

describe('countConflictsByTournament', () => {
  it('retourne un objet vide pour un tableau vide', () => {
    expect(countConflictsByTournament([])).toEqual({});
  });

  it('compte un seul conflit par tournoi', () => {
    expect(countConflictsByTournament([{ tournamentId: 1 }])).toEqual({ 1: 1 });
  });

  it('agregge plusieurs conflits pour le meme tournoi', () => {
    const conflicts = [
      { tournamentId: 1 },
      { tournamentId: 1 },
      { tournamentId: 2 },
    ];
    expect(countConflictsByTournament(conflicts)).toEqual({ 1: 2, 2: 1 });
  });

  it('gere plusieurs tournois independants', () => {
    const conflicts = [
      { tournamentId: 10 },
      { tournamentId: 20 },
      { tournamentId: 30 },
    ];
    expect(countConflictsByTournament(conflicts)).toEqual({ 10: 1, 20: 1, 30: 1 });
  });
});

// ─── mergeTournamentsWithoutDuplicates ────────────────────────────────────────

describe('mergeTournamentsWithoutDuplicates', () => {
  it('retourne existing inchange si incoming ne contient que des doublons', () => {
    const existing = [{ id: 1 }, { id: 2 }];
    const result = mergeTournamentsWithoutDuplicates(existing, [{ id: 1 }]);
    expect(result).toBe(existing);
  });

  it('place les nouveaux tournois en tete', () => {
    const existing = [{ id: 1 }];
    const incoming = [{ id: 2 }, { id: 3 }];
    const result = mergeTournamentsWithoutDuplicates(existing, incoming);
    expect(result.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it('filtre les doublons dans incoming', () => {
    const existing = [{ id: 1 }, { id: 2 }];
    const incoming = [{ id: 2 }, { id: 3 }];
    const result = mergeTournamentsWithoutDuplicates(existing, incoming);
    expect(result.map((t) => t.id)).toEqual([3, 1, 2]);
  });

  it('retourne tous les incoming si existing est vide', () => {
    const result = mergeTournamentsWithoutDuplicates([], [{ id: 5 }, { id: 6 }]);
    expect(result.map((t) => t.id)).toEqual([5, 6]);
  });

  it('retourne existing si incoming est vide', () => {
    const existing = [{ id: 1 }];
    const result = mergeTournamentsWithoutDuplicates(existing, []);
    expect(result).toBe(existing);
  });
});
