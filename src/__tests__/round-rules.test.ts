import { describe, it, expect } from 'vitest';
import { getRoundName } from '@/src/domain/rules/roundRules';
import type { TournamentPhase } from '@/src/types/tournament';
import type { RoundRef } from '@/src/types/round';

function makeRound(overrides: Partial<RoundRef> = {}): RoundRef {
  return {
    id: 1,
    round_number: 1,
    final_round_in_event: false,
    pairings_status: 'PUBLISHED',
    standings_status: 'PUBLISHED',
    round_type: 'SWISS',
    status: 'COMPLETE',
    ...overrides,
  };
}

function makePhase(overrides: Partial<TournamentPhase> & { rounds?: RoundRef[] } = {}): TournamentPhase {
  return {
    id: 1,
    first_round_type: null,
    status: 'COMPLETE',
    order_in_phases: 1,
    number_of_rounds: 3,
    round_type: 'SWISS',
    rank_required_to_enter_phase: null,
    rounds: overrides.rounds ?? [makeRound()],
    ...overrides,
  };
}

describe('getRoundName', () => {
  it('retourne Round N pour SWISS', () => {
    const phase = makePhase({ round_type: 'SWISS' });
    const round = makeRound({ round_number: 4 });
    expect(getRoundName(phase, round)).toBe('Round 4');
  });

  it('retourne Éliminatoire pour ELIMINATION', () => {
    const phase = makePhase({ round_type: 'ELIMINATION' });
    expect(getRoundName(phase, makeRound())).toBe('Éliminatoire');
  });

  it('retourne Finale pour FINAL', () => {
    const phase = makePhase({ round_type: 'FINAL' });
    expect(getRoundName(phase, makeRound())).toBe('Finale');
  });

  it('retourne Inconnu pour un type inconnu', () => {
    const phase = makePhase({ round_type: 'UNKNOWN' as never });
    expect(getRoundName(phase, makeRound())).toBe('Inconnu');
  });

  it('retourne Top 8 pour RANKED_SINGLE_ELIMINATION — premier round de 3', () => {
    const r1 = makeRound({ id: 10 });
    const r2 = makeRound({ id: 11 });
    const r3 = makeRound({ id: 12 });
    const phase = makePhase({ round_type: 'RANKED_SINGLE_ELIMINATION', rounds: [r1, r2, r3] });
    // index 0 → 2^(3-0) = 8 → Top 8
    expect(getRoundName(phase, r1)).toBe('Top 8');
  });

  it('retourne Top 4 pour RANKED_SINGLE_ELIMINATION — second round de 3', () => {
    const r1 = makeRound({ id: 10 });
    const r2 = makeRound({ id: 11 });
    const r3 = makeRound({ id: 12 });
    const phase = makePhase({ round_type: 'RANKED_SINGLE_ELIMINATION', rounds: [r1, r2, r3] });
    // index 1 → 2^(3-1) = 4 → Top 4
    expect(getRoundName(phase, r2)).toBe('Top 4');
  });

  it('retourne Top 2 pour RANKED_SINGLE_ELIMINATION — dernier round de 3', () => {
    const r1 = makeRound({ id: 10 });
    const r2 = makeRound({ id: 11 });
    const r3 = makeRound({ id: 12 });
    const phase = makePhase({ round_type: 'RANKED_SINGLE_ELIMINATION', rounds: [r1, r2, r3] });
    // index 2 → 2^(3-2) = 2 → Top 2
    expect(getRoundName(phase, r3)).toBe('Top 2');
  });
});
