import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import RoundModel from '@models/Round';
import ScoutingReportModel from '@models/ScoutingReport';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { ScoutingService } from '@/src/services/ScoutingService';
import { createTestUser } from '../test/helpers';

let _counter = 0;
function nextTid() { return 850000 + ++_counter; }
function newOid() { return new mongoose.Types.ObjectId().toString(); }

// ─── upsertMissingPlayersAllExisting — bulkWrite ──────────────────────────────

describe('upsertMissingPlayersAllExisting — bulkWrite', () => {
  it('ajoute les joueurs manquants à un document existant', async () => {
    const tid = nextTid();
    const groupId = newOid();
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: new mongoose.Types.ObjectId(groupId),
      userId: null,
      players: [{ playerId: 1, best_identifier: 'Alice', event_best_identifier: 'alice', pronouns: null, decks: [] }],
    });

    await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tid, [
      { id: 1, best_identifier: 'Alice', pronouns: null, eventBestIdentifier: 'alice' },
      { id: 2, best_identifier: 'Bob', pronouns: null, eventBestIdentifier: 'bob' },
    ]);

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players).toHaveLength(2);
    expect(doc!.players.find((p) => p.playerId === 2)).toBeDefined();
  });

  it('ne duplique pas les joueurs déjà présents', async () => {
    const tid = nextTid();
    const groupId = newOid();
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: new mongoose.Types.ObjectId(groupId),
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', event_best_identifier: 'alice', pronouns: null, decks: [] },
        { playerId: 2, best_identifier: 'Bob', pronouns: null, event_best_identifier: 'bob', decks: [] },
      ],
    });

    await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tid, [
      { id: 1, best_identifier: 'Alice', pronouns: null, eventBestIdentifier: 'alice' },
      { id: 2, best_identifier: 'Bob', pronouns: null, eventBestIdentifier: 'bob' },
    ]);

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players).toHaveLength(2);
    expect(doc!.players.filter((p) => p.playerId === 1)).toHaveLength(1);
  });

  it('ajoute les joueurs manquants à plusieurs documents simultanément (chemin bulkWrite)', async () => {
    const tid = nextTid();
    const groupId1 = newOid();
    const groupId2 = newOid();

    await TournamentPlayersDeckModel.insertMany([
      {
        tournamentId: tid,
        groupId: new mongoose.Types.ObjectId(groupId1),
        userId: null,
        players: [{ playerId: 1, best_identifier: 'Alice', event_best_identifier: 'alice', pronouns: null, decks: [] }],
      },
      {
        tournamentId: tid,
        groupId: new mongoose.Types.ObjectId(groupId2),
        userId: null,
        players: [{ playerId: 2, best_identifier: 'Bob', event_best_identifier: 'bob', pronouns: null, decks: [] }],
      },
    ]);

    await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tid, [
      { id: 1, best_identifier: 'Alice', pronouns: null, eventBestIdentifier: 'alice' },
      { id: 2, best_identifier: 'Bob', pronouns: null, eventBestIdentifier: 'bob' },
      { id: 3, best_identifier: 'Carol', pronouns: null, eventBestIdentifier: 'carol' },
    ]);

    const docs = await TournamentPlayersDeckModel.find({ tournamentId: tid }).lean();
    expect(docs).toHaveLength(2);

    for (const doc of docs) {
      // Chaque doc doit maintenant avoir les 3 joueurs
      expect(doc.players).toHaveLength(3);
      expect(doc.players.find((p) => p.playerId === 3)).toBeDefined();
    }
  });

  it('ne fait rien si tous les joueurs sont déjà présents dans tous les documents', async () => {
    const tid = nextTid();
    const groupId = newOid();
    await TournamentPlayersDeckModel.create({
      tournamentId: tid,
      groupId: new mongoose.Types.ObjectId(groupId),
      userId: null,
      players: [
        { playerId: 1, best_identifier: 'Alice', event_best_identifier: 'alice', pronouns: null, decks: [['Amber', 'Ruby']] },
      ],
    });

    await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tid, [
      { id: 1, best_identifier: 'Alice', pronouns: null, eventBestIdentifier: 'alice' },
    ]);

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    // Le deck d'Alice doit être inchangé — upsertMissing ne touche que les joueurs absents
    expect(doc!.players[0].decks).toEqual([['Amber', 'Ruby']]);
  });

  it('est un no-op si aucun document existant pour ce tournoi', async () => {
    const tid = nextTid();
    // Aucun document — ne doit pas lever d'erreur
    await expect(
      TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tid, [
        { id: 1, best_identifier: 'Alice', pronouns: null, eventBestIdentifier: 'alice' },
      ]),
    ).resolves.not.toThrow();
  });
});

// ─── ScoutingService.assignDecks — écritures parallèles ───────────────────────

describe('ScoutingService.assignDecks — écritures parallèles', () => {
  async function seedRound(tid: number, roundId: number, matchId: number, p1Id: number, p2Id: number) {
    return RoundModel.create({
      id: roundId,
      tournamentId: tid,
      results: [{
        id: matchId,
        table_number: 1,
        round_number: 1,
        player_match_relationships: [
          {
            player: { id: p1Id, best_identifier: `P${p1Id}`, pronouns: null },
            user_event_status: { best_identifier: `p${p1Id}` },
          },
          {
            player: { id: p2Id, best_identifier: `P${p2Id}`, pronouns: null },
            user_event_status: { best_identifier: `p${p2Id}` },
          },
        ],
      }],
    });
  }

  it('persiste les decks ET crée les ScoutingReports dans le même appel', async () => {
    const tid = nextTid();
    const roundId = tid;
    const matchId = 1;
    const user = await createTestUser({ username: `sc1-${tid}`, email: `sc1-${tid}@test.com` });
    const scope = { groupId: null, userId: user._id.toString() };

    await seedRound(tid, roundId, matchId, 10, 20);
    await TournamentPlayersDeckModel.create({ tournamentId: tid, groupId: null, userId: user._id, players: [] });

    const assignments = [
      { playerId: 10, decks: [['Amber', 'Ruby'] as [string, string]] },
      { playerId: 20, decks: [['Sapphire', 'Steel'] as [string, string]] },
    ];

    await ScoutingService.assignDecks(roundId, matchId, assignments, scope, { userId: user._id.toString() });

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, userId: user._id }).lean();
    expect(doc!.players).toHaveLength(2);
    expect(doc!.players.find((p) => p.playerId === 10)!.decks).toEqual([['Amber', 'Ruby']]);
    expect(doc!.players.find((p) => p.playerId === 20)!.decks).toEqual([['Sapphire', 'Steel']]);

    const reports = await ScoutingReportModel.find({ tournamentId: tid, userId: user._id }).lean();
    expect(reports).toHaveLength(2);
    expect(reports.map((r) => r.playerId).sort()).toEqual([10, 20]);
  });

  it('n\'enregistre pas de ScoutingReport pour les joueurs dont les decks sont vidés', async () => {
    const tid = nextTid();
    const roundId = tid;
    const matchId = 1;
    const user = await createTestUser({ username: `sc2-${tid}`, email: `sc2-${tid}@test.com` });
    const scope = { groupId: null, userId: user._id.toString() };

    await seedRound(tid, roundId, matchId, 10, 20);
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: null, userId: user._id,
      players: [
        { playerId: 10, best_identifier: 'P10', event_best_identifier: 'p10', pronouns: null, decks: [['Amber', 'Ruby']] },
        { playerId: 20, best_identifier: 'P20', event_best_identifier: 'p20', pronouns: null, decks: [['Sapphire', 'Steel']] },
      ],
    });

    await ScoutingService.assignDecks(
      roundId, matchId,
      [{ playerId: 10, decks: [] }, { playerId: 20, decks: [['Emerald', 'Ruby'] as [string, string]] }],
      scope,
      { userId: user._id.toString() },
    );

    // Seulement playerId 20 a des decks non vides → seulement 1 report
    const reports = await ScoutingReportModel.find({ tournamentId: tid, userId: user._id }).lean();
    expect(reports).toHaveLength(1);
    expect(reports[0].playerId).toBe(20);
  });
});
