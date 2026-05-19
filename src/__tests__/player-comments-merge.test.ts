import { describe, it, expect } from 'vitest';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import TournamentConflictModel from '@models/TournamentConflict';
import { DataMergeService } from '@/src/services/DataMergeService';
import { ConflictService } from '@/src/services/ConflictService';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { createTestUser, createTestGroup } from '../test/helpers';

let _counter = 0;
function nextTid() { return 900000 + ++_counter; }

const BASE_P1 = { playerId: 1, best_identifier: 'Player One', event_best_identifier: 'pseudo1', pronouns: null };

// ─── DataMergeService : migration des commentaires ────────────────────────────

describe('DataMergeService — commentaires', () => {
  it('migre les commentaires perso vers groupe lors d\'un auto-assign (joueur absent du groupe)', async () => {
    const user = await createTestUser({ username: 'mc1', email: 'mc1@test.com' });
    const group = await createTestGroup(user._id, { name: 'mc-grp-1' });
    const tid = nextTid();
    const userId = String(user._id);
    const groupId = String(group._id);

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amber', 'Sapphire']] }],
    });
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: userId, groupId: null, inks: ['Amber', 'Sapphire'], content: 'Note perso' });

    await DataMergeService.mergeUserDataIntoGroup(userId, groupId, tid);

    const perso = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId: null });
    expect(perso).toHaveLength(0);

    const groupe = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId });
    expect(groupe).toHaveLength(1);
    expect(groupe[0].content).toBe('Note perso');
  });

  it('ne migre pas les commentaires si deck différent (conflit créé)', async () => {
    const user = await createTestUser({ username: 'mc2', email: 'mc2@test.com' });
    const group = await createTestGroup(user._id, { name: 'mc-grp-2' });
    const tid = nextTid();
    const userId = String(user._id);
    const groupId = String(group._id);

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amber']] }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: [['Ruby']] }],
    });
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: userId, groupId: null, inks: ['Amber'], content: 'Note perso en conflit' });

    await DataMergeService.mergeUserDataIntoGroup(userId, groupId, tid);

    // Conflit créé
    expect(await TournamentConflictModel.countDocuments({})).toBe(1);
    // Commentaire perso intact
    const perso = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId: null });
    expect(perso).toHaveLength(1);
    // Pas de commentaire groupe
    const groupe = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId });
    expect(groupe).toHaveLength(0);
  });
});

// ─── ConflictService : résolution avec commentaires ──────────────────────────

describe('ConflictService.resolveAdminConflict — commentaires', () => {
  it('APPROVED : migre les commentaires perso du membre, supprime les commentaires groupe existants', async () => {
    const admin = await createTestUser({ username: 'mc3', email: 'mc3@test.com' });
    const user = await createTestUser({ username: 'mc4', email: 'mc4@test.com' });
    const group = await createTestGroup(admin._id, { name: 'mc-grp-3' });
    const tid = nextTid();
    const userId = String(user._id);
    const groupId = String(group._id);

    const [conflict] = await TournamentConflictModel.create([{
      userId: user._id,
      groupId: group._id,
      tournamentId: tid,
      playerId: BASE_P1.playerId,
      playerName: BASE_P1.best_identifier,
      previousInks: [['Ruby']],
      proposedInks: [['Amber']],
      status: 'PENDING_ADMIN',
    }]);

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: [['Ruby']] }],
    });

    // Commentaire existant du groupe (lié aux inks du groupe)
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: String(admin._id), groupId, inks: ['Ruby'], content: 'Commentaire groupe existant' });
    // Commentaire perso du membre (lié aux inks proposées)
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: userId, groupId: null, inks: ['Amber'], content: 'Note du membre' });

    await ConflictService.resolveAdminConflict(String(conflict._id), String(admin._id), 'APPROVED');

    // Commentaires groupe supprimés
    const groupe = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId });
    expect(groupe).toHaveLength(1);
    expect(groupe[0].content).toBe('Note du membre');

    // Commentaire perso migré
    const perso = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId: null });
    expect(perso).toHaveLength(0);
  });

  it('REJECTED : supprime les commentaires perso du membre', async () => {
    const admin = await createTestUser({ username: 'mc5', email: 'mc5@test.com' });
    const user = await createTestUser({ username: 'mc6', email: 'mc6@test.com' });
    const group = await createTestGroup(admin._id, { name: 'mc-grp-4' });
    const tid = nextTid();
    const userId = String(user._id);
    const groupId = String(group._id);

    const [conflict] = await TournamentConflictModel.create([{
      userId: user._id,
      groupId: group._id,
      tournamentId: tid,
      playerId: BASE_P1.playerId,
      playerName: BASE_P1.best_identifier,
      previousInks: [['Ruby']],
      proposedInks: [['Amber']],
      status: 'PENDING_ADMIN',
    }]);

    // Commentaire groupe existant (doit être conservé)
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: String(admin._id), groupId, inks: ['Ruby'], content: 'Note groupe conservée' });
    // Commentaire perso du membre (doit être supprimé)
    await PlayerCommentRepository.create({ tournamentId: tid, playerId: BASE_P1.playerId, authorId: userId, groupId: null, inks: ['Amber'], content: 'Note rejetée' });

    await ConflictService.resolveAdminConflict(String(conflict._id), String(admin._id), 'REJECTED');

    // Commentaires perso supprimés
    const perso = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId: null });
    expect(perso).toHaveLength(0);

    // Commentaires groupe intacts
    const groupe = await PlayerCommentRepository.findByPlayer(tid, BASE_P1.playerId, { groupId });
    expect(groupe).toHaveLength(1);
    expect(groupe[0].content).toBe('Note groupe conservée');
  });
});
