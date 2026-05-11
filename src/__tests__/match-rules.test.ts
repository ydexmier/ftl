import { describe, it, expect } from 'vitest';
import { getStatusFromMatch, showScoreFromMatch } from '@/src/domain/rules/matchRules';
import type { Match } from '@/src/types/match';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
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
    winning_player: 42,
    reporting_player: null,
    assigned_judge: null,
    players: [42, 99],
    player_match_relationships: [
      { player_order: 1, player: { id: 42, best_identifier: 'Alice', pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: 42, best_identifier: 'Alice', registration_status: 'CHECKED_IN', matches_won: 1, matches_lost: 0, matches_drawn: 0, total_match_points: 3 } },
      { player_order: 2, player: { id: 99, best_identifier: 'Bob', pronouns: null, game_user_profile_picture_url: null }, user_event_status: { id: 99, best_identifier: 'Bob', registration_status: 'CHECKED_IN', matches_won: 0, matches_lost: 1, matches_drawn: 0, total_match_points: 0 } },
    ],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('getStatusFromMatch', () => {
  it('retourne Draw si games_drawn est non nul', () => {
    const result = getStatusFromMatch(makeMatch({ games_drawn: 1 }));
    expect(result.label).toBe('Draw');
    expect(result.color).toBe('primary');
  });

  it('retourne Score not reported si pas de winning_player', () => {
    const result = getStatusFromMatch(makeMatch({ winning_player: null }));
    expect(result.label).toBe('Score not reported');
    expect(result.color).toBe('warning');
  });

  it('retourne Bye si match_is_bye', () => {
    const result = getStatusFromMatch(makeMatch({ match_is_bye: true }));
    expect(result.label).toBe('Bye');
  });

  it('retourne Loss si match_is_loss', () => {
    const result = getStatusFromMatch(makeMatch({ match_is_loss: true }));
    expect(result.label).toBe('Loss');
  });

  it('retourne Intentional Draw si match_is_intentional_draw', () => {
    const result = getStatusFromMatch(makeMatch({ match_is_intentional_draw: true }));
    expect(result.label).toBe('Intentional Draw');
  });

  it('retourne Unintentional Draw si match_is_unintentional_draw', () => {
    const result = getStatusFromMatch(makeMatch({ match_is_unintentional_draw: true }));
    expect(result.label).toBe('Unintentional Draw');
  });

  it('retourne Conflict in reports si reports_are_in_conflict', () => {
    const result = getStatusFromMatch(makeMatch({ reports_are_in_conflict: true }));
    expect(result.label).toBe('Conflict in reports');
  });

  it('retourne Completed pour status COMPLETE', () => {
    const result = getStatusFromMatch(makeMatch({ status: 'COMPLETE' }));
    expect(result.label).toBe('Completed');
    expect(result.color).toBe('success');
  });

  it('retourne Scheduled pour status SCHEDULED (avec winning_player défini)', () => {
    // Le switch n'est atteint que si winning_player est non-null
    const result = getStatusFromMatch(makeMatch({ status: 'SCHEDULED', winning_player: 42 }));
    expect(result.label).toBe('Scheduled');
  });

  it('retourne In Progress pour status IN_PROGRESS (avec winning_player défini)', () => {
    const result = getStatusFromMatch(makeMatch({ status: 'IN_PROGRESS', winning_player: 42 }));
    expect(result.label).toBe('In Progress');
  });

  it('retourne Unknown status pour un statut inconnu (avec winning_player défini)', () => {
    const result = getStatusFromMatch(makeMatch({ status: 'UNKNOWN' as never, winning_player: 42 }));
    expect(result.label).toBe('Unknown status');
  });
});

describe('showScoreFromMatch', () => {
  it('affiche loser - winner en cas de draw', () => {
    const result = showScoreFromMatch(makeMatch({ games_drawn: 1, games_won_by_winner: 2, games_won_by_loser: 1 }));
    expect(result).toBe('1 - 2');
  });

  it('retourne 0 - 0 si pas de winning_player', () => {
    const result = showScoreFromMatch(makeMatch({ winning_player: null }));
    expect(result).toBe('0 - 0');
  });

  it('affiche winner - loser si le gagnant est le premier joueur', () => {
    const result = showScoreFromMatch(makeMatch({ winning_player: 42, games_won_by_winner: 2, games_won_by_loser: 0 }));
    expect(result).toBe('2 - 0');
  });

  it('affiche loser - winner si le gagnant est le second joueur', () => {
    const result = showScoreFromMatch(makeMatch({ winning_player: 99, games_won_by_winner: 2, games_won_by_loser: 1 }));
    expect(result).toBe('1 - 2');
  });
});
