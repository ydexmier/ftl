import { describe, it, expect } from 'vitest';
import { PUT as respondToInvitation } from '../../app/api/groups/invitations/[invId]/route';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import TournamentConflictModel from '@models/TournamentConflict';
import TournamentModel from '@models/Tournament';
import GroupTournamentModel from '@models/GroupTournament';
import GroupInvitationModel from '@models/GroupInvitation';
import { DataMergeService } from '@/src/services/DataMergeService';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

let _counter = 0;
function nextTid() { return 800000 + ++_counter; }

function invParams(invId: string) {
  return { params: Promise.resolve({ invId }) };
}

const BASE_P1 = { playerId: 1, best_identifier: 'Player One', event_best_identifier: 'pseudo1', pronouns: null };
const BASE_P2 = { playerId: 2, best_identifier: 'Player Two', event_best_identifier: 'pseudo2', pronouns: null };

// ─── mergeUserDataIntoGroup ────────────────────────────────────────────────

describe('DataMergeService.mergeUserDataIntoGroup', () => {
  it('ne fait rien si l\'utilisateur n\'a pas de données de deck', async () => {
    const user = await createTestUser({ username: 'dm1', email: 'dm1@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-1' });
    const tid = nextTid();

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
    expect(await TournamentPlayersDeckModel.countDocuments({ groupId: group._id })).toBe(0);
  });

  it('ne fait rien si le deck utilisateur est vide', async () => {
    const user = await createTestUser({ username: 'dm2', email: 'dm2@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-2' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [] }],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
    expect(await TournamentPlayersDeckModel.countDocuments({ groupId: group._id })).toBe(0);
  });

  it('ajoute automatiquement un joueur absent du groupe', async () => {
    const user = await createTestUser({ username: 'dm3', email: 'dm3@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-3' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amber', 'Sapphire']] }],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck).not.toBeNull();
    expect(groupDeck!.players).toHaveLength(1);
    expect(groupDeck!.players[0].playerId).toBe(BASE_P1.playerId);
    expect(groupDeck!.players[0].decks).toEqual([['Amber', 'Sapphire']]);
  });

  it('met à jour automatiquement un joueur sans encres dans le groupe', async () => {
    const user = await createTestUser({ username: 'dm4', email: 'dm4@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-4' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Steel', 'Ruby']] }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: [] }],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Steel', 'Ruby']]);
  });

  it('crée un conflit PENDING si les encres diffèrent', async () => {
    const user = await createTestUser({ username: 'dm5', email: 'dm5@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-5' });
    const tid = nextTid();

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amber', 'Sapphire']] }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: [['Steel', 'Ruby']] }],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    const conflicts = await TournamentConflictModel.find({});
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].status).toBe('PENDING');
    expect(conflicts[0].playerId).toBe(BASE_P1.playerId);
    expect(conflicts[0].previousInks).toEqual([['Steel', 'Ruby']]);
    expect(conflicts[0].proposedInks).toEqual([['Amber', 'Sapphire']]);
    // Group data must not be modified when a conflict is raised
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Steel', 'Ruby']]);
  });

  it('ne crée pas de conflit si les encres sont identiques', async () => {
    const user = await createTestUser({ username: 'dm6', email: 'dm6@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-6' });
    const tid = nextTid();

    const inks = [['Amber', 'Sapphire']];
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [{ ...BASE_P1, decks: inks }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: inks }],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
  });

  it('gère plusieurs joueurs en une passe (auto-ajout + conflit)', async () => {
    const user = await createTestUser({ username: 'dm7', email: 'dm7@test.com' });
    const group = await createTestGroup(user._id, { name: 'dm-grp-7' });
    const tid = nextTid();

    // player1: both have inks, different → conflict
    // player2: group has player but no inks → auto-update
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: user._id, groupId: null,
      players: [
        { ...BASE_P1, decks: [['Amber', 'Sapphire']] },
        { ...BASE_P2, decks: [['Steel', 'Emerald']] },
      ],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [
        { ...BASE_P1, decks: [['Ruby', 'Sapphire']] },
        { ...BASE_P2, decks: [] },
      ],
    });

    await DataMergeService.mergeUserDataIntoGroup(String(user._id), String(group._id), tid);

    const conflicts = await TournamentConflictModel.find({});
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].playerId).toBe(BASE_P1.playerId);

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    const p2 = groupDeck!.players.find((p) => p.playerId === BASE_P2.playerId);
    expect(p2!.decks).toEqual([['Steel', 'Emerald']]);
  });
});

// ─── mergeOnGroupJoin via respondToInvitation ─────────────────────────────

describe('DataMergeService.mergeOnGroupJoin (via acceptation d\'invitation)', () => {
  it('auto-assigne les decks utilisateur au groupe lors de l\'acceptation', async () => {
    const admin = await createTestUser({ username: 'dm8', email: 'dm8@test.com' });
    const member = await createTestUser({ username: 'dm9', email: 'dm9@test.com' });
    const group = await createTestGroup(admin._id, { name: 'dm-grp-8' });
    const tid = nextTid();

    await TournamentModel.create({ id: tid, name: `T-${tid}`, event_status: 'ENDED', start_datetime: new Date() });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: admin._id, status: 'ACTIVE' });

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: member._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amethyst', 'Steel']] }],
    });

    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: member._id, invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(200);

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck).not.toBeNull();
    expect(groupDeck!.players).toHaveLength(1);
    expect(groupDeck!.players[0].decks).toEqual([['Amethyst', 'Steel']]);
    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
  });

  it('crée un conflit PENDING si les encres diffèrent lors de l\'acceptation', async () => {
    const admin = await createTestUser({ username: 'dm10', email: 'dm10@test.com' });
    const member = await createTestUser({ username: 'dm11', email: 'dm11@test.com' });
    const group = await createTestGroup(admin._id, { name: 'dm-grp-9' });
    const tid = nextTid();

    await TournamentModel.create({ id: tid, name: `T-${tid}`, event_status: 'ENDED', start_datetime: new Date() });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: admin._id, status: 'ACTIVE' });

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, groupId: group._id, userId: null,
      players: [{ ...BASE_P1, decks: [['Ruby', 'Amber']] }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: member._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Steel', 'Sapphire']] }],
    });

    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: member._id, invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(200);

    const conflicts = await TournamentConflictModel.find({ groupId: group._id });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].status).toBe('PENDING');
    expect(conflicts[0].proposedInks).toEqual([['Steel', 'Sapphire']]);
    expect(conflicts[0].previousInks).toEqual([['Ruby', 'Amber']]);
    // Group inks must remain unchanged
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tid, groupId: group._id, userId: null });
    expect(groupDeck!.players[0].decks).toEqual([['Ruby', 'Amber']]);
  });

  it('ne déclenche pas de merge si le tournoi du groupe est archivé', async () => {
    const admin = await createTestUser({ username: 'dm12', email: 'dm12@test.com' });
    const member = await createTestUser({ username: 'dm13', email: 'dm13@test.com' });
    const group = await createTestGroup(admin._id, { name: 'dm-grp-10' });
    const tid = nextTid();

    await TournamentModel.create({ id: tid, name: `T-${tid}`, event_status: 'ENDED', start_datetime: new Date() });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tid, addedBy: admin._id, status: 'ARCHIVED' });

    await TournamentPlayersDeckModel.create({
      tournamentId: tid, userId: member._id, groupId: null,
      players: [{ ...BASE_P1, decks: [['Amber', 'Steel']] }],
    });

    const inv = await GroupInvitationModel.create({
      groupId: group._id, invitedUserId: member._id, invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('PUT', `/api/groups/invitations/${inv._id}`, { status: 'ACCEPTED' }, cookie);
    const res = await respondToInvitation(req, invParams(String(inv._id)));
    expect(res.status).toBe(200);

    // Archived tournament → no merge → no group deck entry created
    expect(await TournamentPlayersDeckModel.countDocuments({ groupId: group._id })).toBe(0);
    expect(await TournamentConflictModel.countDocuments({})).toBe(0);
  });
});
