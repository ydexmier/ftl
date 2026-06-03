import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import RoundModel from '@models/Round';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';

let _counter = 0;
function nextId() { return 950000 + ++_counter; }
function newOid() { return new mongoose.Types.ObjectId().toString(); }

function makeMatch(id: number, table: number, p1: number, p2?: number) {
  const pmrs = [
    {
      player: { id: p1, best_identifier: `Player${p1}`, pronouns: null },
      user_event_status: { best_identifier: `p${p1}` },
    },
  ];
  if (p2 !== undefined) {
    pmrs.push({
      player: { id: p2, best_identifier: `Player${p2}`, pronouns: null },
      user_event_status: { best_identifier: `p${p2}` },
    });
  }
  return { id, table_number: table, round_number: 1, player_match_relationships: pmrs };
}

async function seedRound(roundId: number, tournamentId: number, matches: ReturnType<typeof makeMatch>[]) {
  return RoundModel.create({ id: roundId, tournamentId, results: matches });
}

// ─── RoundRepository.findMatchesPaginated — aggregation ──────────────────────

describe('findMatchesPaginated — aggregation', () => {
  it('retourne null si la ronde n\'existe pas', async () => {
    const result = await RoundRepository.findMatchesPaginated(999999999, {}, {});
    expect(result).toBeNull();
  });

  it('retourne la première page avec pagination correcte', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
      makeMatch(3, 3, 50, 60),
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { page: 1, perPage: 2 }, {});
    expect(result).not.toBeNull();
    expect(result!.results).toHaveLength(2);
    expect(result!.pagination.total).toBe(3);
    expect(result!.pagination.totalPages).toBe(2);
    expect(result!.pagination.page).toBe(1);
  });

  it('retourne la deuxième page', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
      makeMatch(3, 3, 50, 60),
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { page: 2, perPage: 2 }, {});
    expect(result!.results).toHaveLength(1);
    expect(result!.pagination.page).toBe(2);
    expect(result!.results[0].id).toBe(3);
  });

  it('retourne 0 résultats sur ronde vide', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, []);

    const result = await RoundRepository.findMatchesPaginated(rid, { page: 1, perPage: 10 }, {});
    expect(result!.results).toHaveLength(0);
    expect(result!.pagination.total).toBe(0);
  });

  it('recherche textuelle par nom de joueur', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { search: 'Player10' }, {});
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].id).toBe(1);
    expect(result!.pagination.total).toBe(1);
  });

  it('recherche textuelle insensible à la casse', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { search: 'player10' }, {});
    expect(result!.results).toHaveLength(1);
  });

  it('recherche numérique par numéro de table', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 5, 10, 20),
      makeMatch(2, 12, 30, 40),
      makeMatch(3, 5, 50, 60),
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { search: '5' }, {});
    expect(result!.results).toHaveLength(2);
    expect(result!.results.every((m) => m.table_number === 5)).toBe(true);
  });

  it('la recherche reset la page à 1', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
    ]);

    // page: 3 avec search → doit revenir à page 1
    const result = await RoundRepository.findMatchesPaginated(rid, { page: 3, search: 'Player10' }, {});
    expect(result!.pagination.page).toBe(1);
    expect(result!.results).toHaveLength(1);
  });

  it('excludeOnePlayer filtre les matchs avec moins de 2 joueurs', async () => {
    const rid = nextId();
    const tid = nextId();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),     // 2 joueurs
      makeMatch(2, 2, 30),          // 1 joueur seulement
      makeMatch(3, 3, 50, 60),     // 2 joueurs
    ]);

    const result = await RoundRepository.findMatchesPaginated(rid, { excludeOnePlayer: true }, {});
    expect(result!.results).toHaveLength(2);
    expect(result!.pagination.total).toBe(2);
    expect(result!.results.every((m) => m.player_match_relationships.length >= 2)).toBe(true);
  });

  it('retourne les decks filtrés aux joueurs de la page', async () => {
    const rid = nextId();
    const tid = nextId();
    const groupId = newOid();
    await seedRound(rid, tid, [
      makeMatch(1, 1, 10, 20),
      makeMatch(2, 2, 30, 40),
    ]);
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: new mongoose.Types.ObjectId(groupId),
      userId: null,
      players: [
        { playerId: 10, best_identifier: 'Player10', event_best_identifier: 'p10', pronouns: null, decks: [['Amber', 'Ruby']] },
        { playerId: 20, best_identifier: 'Player20', event_best_identifier: 'p20', pronouns: null, decks: [] },
        { playerId: 30, best_identifier: 'Player30', event_best_identifier: 'p30', pronouns: null, decks: [['Sapphire', 'Steel']] },
        { playerId: 40, best_identifier: 'Player40', event_best_identifier: 'p40', pronouns: null, decks: [] },
      ],
    });

    const result = await RoundRepository.findMatchesPaginated(
      rid,
      { page: 1, perPage: 1 }, // page 1 = match 1 = joueurs 10 et 20
      { groupId },
    );

    // Seulement les joueurs de la page 1 (10 et 20)
    expect(result!.playersDecks!.players).toHaveLength(2);
    expect(result!.playersDecks!.players.map((p) => p.playerId).sort()).toEqual([10, 20]);
  });

  it('retourne lastFetchedAt depuis le document', async () => {
    const rid = nextId();
    const tid = nextId();
    const fetchedAt = new Date('2025-01-15T10:00:00Z');
    await RoundModel.create({ id: rid, tournamentId: tid, results: [makeMatch(1, 1, 10, 20)], lastFetchedAt: fetchedAt });

    const result = await RoundRepository.findMatchesPaginated(rid, {}, {});
    expect(result!.lastFetchedAt).not.toBeNull();
  });
});
