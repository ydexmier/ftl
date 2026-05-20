// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchState, matchModalInitialState } from '@/src/hooks/useMatchState';

describe('useMatchState', () => {
  it('initialise avec matchModalInitialState', () => {
    const { result } = renderHook(() => useMatchState());
    const [state] = result.current;
    expect(state).toEqual(matchModalInitialState);
  });

  it('RESET remet l\'état à l\'état initial', () => {
    const { result } = renderHook(() => useMatchState());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SELECT_DECK', combo: 'combination1', deck: ['Amber', 'Ruby'] });
    });
    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'RESET' });
    });

    const [state] = result.current;
    expect(state).toEqual(matchModalInitialState);
  });

  it('SELECT_DECK met à jour les decks de la combinaison ciblée', () => {
    const { result } = renderHook(() => useMatchState());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'SELECT_DECK', combo: 'combination1', deck: ['Amber', 'Ruby'] });
    });

    const [state] = result.current;
    expect(state.combination1.decks).toEqual([['Amber', 'Ruby']]);
    expect(state.combination2.decks).toEqual([]);
  });

  it('ASSIGN_PLAYER assigne les deux joueurs simultanément', () => {
    const { result } = renderHook(() => useMatchState());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'ASSIGN_PLAYER', combo: 'combination1', playerId: 10, otherPlayId: 20 });
    });

    const [state] = result.current;
    expect(state.combination1.playerId).toBe(10);
    expect(state.combination2.playerId).toBe(20);
  });

  it('INITIALIZE_COMBINATION initialise une combinaison sans toucher l\'autre', () => {
    const { result } = renderHook(() => useMatchState());

    act(() => {
      const [, dispatch] = result.current;
      dispatch({ type: 'INITIALIZE_COMBINATION', combo: 'combination1', decks: [['Steel']], playerId: 42 });
    });

    const [state] = result.current;
    expect(state.combination1.decks).toEqual([['Steel']]);
    expect(state.combination1.playerId).toBe(42);
    expect(state.combination2).toEqual(matchModalInitialState.combination2);
  });
});
