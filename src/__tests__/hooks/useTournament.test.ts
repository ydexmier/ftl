// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTournament } from '@/src/hooks/useTournament';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fakeTournament = {
  id: 123,
  name: 'Test Tournament',
  event_status: 'ENDED',
  start_datetime: '2026-01-01T10:00:00Z',
  tournament_phases: [],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTournament', () => {
  it('état initial : tournament null et loading true', () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeTournament));

    const { result } = renderHook(() => useTournament(123));

    expect(result.current.tournament).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('après fetch réussi : tournament peuplé et loading false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(fakeTournament));

    const { result } = renderHook(() => useTournament(123));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tournament).not.toBeNull();
    expect(result.current.tournament?.id).toBe(123);
    expect(result.current.tournament?.name).toBe('Test Tournament');
    expect(result.current.error).toBeNull();
  });

  it('erreur API : tournament reste null et loading false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({ error: 'Not found' }, 404),
    );

    const { result } = renderHook(() => useTournament(123));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tournament).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('refreshTournament déclenche un fetch POST vers fetchTournament et met à jour les données', async () => {
    const updatedTournament = { ...fakeTournament, name: 'Updated Tournament' };

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse(fakeTournament))
      .mockResolvedValueOnce(jsonResponse({ datas: updatedTournament }));

    const { result } = renderHook(() => useTournament(123));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshTournament();
    });

    expect(result.current.tournament?.name).toBe('Updated Tournament');

    const calls = vi.mocked(global.fetch).mock.calls;
    const refreshCall = calls[1];
    expect(refreshCall[0]).toBe('/api/tournaments/fetch');
    expect((refreshCall[1] as RequestInit).method).toBe('POST');
    const body = JSON.parse((refreshCall[1] as RequestInit).body as string);
    expect(body.tournamentId).toBe(123);
  });
});
