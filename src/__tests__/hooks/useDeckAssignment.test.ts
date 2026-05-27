// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeckAssignment } from '@/src/hooks/useDeckAssignment';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fakeResult = {
  matchs: [],
  playersDecks: { players: [{ playerId: 10, decks: [['Amber', 'Ruby']] }] },
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

describe('useDeckAssignment', () => {
  it('assignDecks appelle la bonne URL avec roundId et matchId', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeResult));

    const { result } = renderHook(() => useDeckAssignment(42));

    await act(async () => {
      await result.current.assignDecks(7, [{ playerId: 10, decks: [['Amber', 'Ruby']] }]);
    });

    const call = vi.mocked(global.fetch).mock.calls[0];
    expect(call[0]).toBe('/api/rounds/42/matchs/7/assign_deck');
    expect((call[1] as RequestInit).method).toBe('POST');
  });

  it('assignDecks envoie groupId: null quand non fourni', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeResult));

    const { result } = renderHook(() => useDeckAssignment(42));

    await act(async () => {
      await result.current.assignDecks(7, []);
    });

    const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.groupId).toBeNull();
  });

  it('assignDecks inclut groupId dans le body quand fourni', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeResult));

    const { result } = renderHook(() => useDeckAssignment(42, 'group-abc'));

    await act(async () => {
      await result.current.assignDecks(7, []);
    });

    const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.groupId).toBe('group-abc');
  });

  it('assignDecks retourne les données JSON de la réponse', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeResult));

    const { result } = renderHook(() => useDeckAssignment(42));

    let response: typeof fakeResult | undefined;
    await act(async () => {
      response = await result.current.assignDecks(7, [{ playerId: 10, decks: [['Amber', 'Ruby']] }]);
    });

    expect(response?.playersDecks.players[0].playerId).toBe(10);
  });
});
