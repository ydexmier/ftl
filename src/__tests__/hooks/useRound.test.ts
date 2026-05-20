// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRound } from '@/src/hooks/useRound';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const basePaginatedMatches = {
  results: [
    {
      id: 1,
      table_number: 1,
      order: 1,
      status: 'COMPLETE',
      pod_number: null,
      match_is_bye: false,
      match_is_intentional_draw: false,
      match_is_unintentional_draw: false,
      match_is_loss: false,
      reports_are_in_conflict: false,
      games_drawn: null,
      games_won_by_winner: 2,
      games_won_by_loser: 0,
      is_ghost_match: false,
      is_feature_match: false,
      deck_check_started: false,
      deck_check_completed: false,
      time_extension_seconds: 0,
      tournament_round: 1,
      winning_player: 10,
      reporting_player: null,
      assigned_judge: null,
      players: [10, 20],
      player_match_relationships: [],
    },
  ],
  pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 },
  playersDecks: { players: [] },
  lastFetchedAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
};

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { pathname: '/', search: '', href: '/' },
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRound — chargement initial', () => {
  it('loading passe à false après le fetch initial', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(basePaginatedMatches));

    const { result } = renderHook(() => useRound(1, 100));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matchs).toHaveLength(1);
    expect(result.current.matchs[0].id).toBe(1);
  });

  it('error est défini si le fetch échoue', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({ error: 'Non autorisé' }, 403),
    );

    const { result } = renderHook(() => useRound(1, 100));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.matchs).toHaveLength(0);
  });

  it('retourne les données de pagination correctes', async () => {
    const data = {
      ...basePaginatedMatches,
      pagination: { page: 2, perPage: 5, total: 12, totalPages: 3 },
    };
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(data));

    const { result } = renderHook(() => useRound(1, 100, { page: 2, perPage: 5 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.totalPages).toBe(3);
  });
});

describe('useRound — mutation optimiste (onValidateAssignDeck)', () => {
  it('met à jour playersDecks après assignation (optimiste + refetch cohérent)', async () => {
    const updatedDecks = {
      players: [{ playerId: 10, decks: [['Amber', 'Ruby']] }],
    };
    const assignResult = { matchs: basePaginatedMatches.results, playersDecks: updatedDecks };
    const refetchData = { ...basePaginatedMatches, playersDecks: updatedDecks };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse(basePaginatedMatches))
      .mockResolvedValueOnce(jsonResponse(assignResult))
      .mockResolvedValue(jsonResponse(refetchData));

    const { result } = renderHook(() => useRound(1, 100));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const match = result.current.matchs[0];
    await act(async () => { result.current.openMatchModal(match)(); });

    await act(async () => {
      await result.current.onValidateAssignDeck({
        combination1: { playerId: 10, decks: [['Amber', 'Ruby']] },
        combination2: { playerId: 20, decks: [] },
      });
    });

    await waitFor(() => {
      // getPlayerDecksInk retourne un tableau de decks (Deck[] = string[][])
      expect(result.current.getPlayerDecksInk(10)).toEqual([['Amber', 'Ruby']]);
    });
  });

  it('conserve l\'état précédent si l\'assignation échoue', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse(basePaginatedMatches))
      .mockResolvedValueOnce(jsonResponse({ error: 'Conflit' }, 409));

    const { result } = renderHook(() => useRound(1, 100));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const match = result.current.matchs[0];
    await act(async () => { result.current.openMatchModal(match)(); });

    await act(async () => {
      await result.current.onValidateAssignDeck({
        combination1: { playerId: 10, decks: [['Amber']] },
        combination2: { playerId: 20, decks: [] },
      });
    });

    // L'état des decks reste vide (pas de mise à jour si l'API échoue)
    expect(result.current.getPlayerDecksInk(10)).toEqual([]);
  });
});
