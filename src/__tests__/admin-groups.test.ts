import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { GET as getPinned } from '../../app/api/admin/groups/pinned/route';
import { POST as pinGroup, DELETE as unpinGroup } from '../../app/api/admin/groups/[id]/pin/route';
import { GET as listGroups, POST as createGroup } from '../../app/api/admin/groups/route';
import { GET as getGroup, PATCH as updateGroup, DELETE as deleteGroup } from '../../app/api/admin/groups/[id]/route';
import { POST as inviteMember } from '../../app/api/admin/groups/[id]/members/route';
import { PATCH as updateRole, DELETE as removeMember } from '../../app/api/admin/groups/[id]/members/[uid]/route';
import { POST as addTournament } from '../../app/api/admin/groups/[id]/tournaments/route';
import { DELETE as removeTournament } from '../../app/api/admin/groups/[id]/tournaments/[tid]/route';
import { GET as getMergeStatus } from '../../app/api/groups/[id]/tournaments/[tid]/merge-status/route';
import { POST as triggerMerge } from '../../app/api/groups/[id]/tournaments/[tid]/merge/route';
import { POST as adminMergeMember } from '../../app/api/admin/groups/[id]/members/[uid]/merge-tournament/route';
import { POST as groupAdminMergeMember } from '../../app/api/groups/[id]/members/[userId]/merge-tournament/route';
import GroupModel from '@models/Group';
import GroupInvitationModel from '@models/GroupInvitation';
import GroupTournamentModel from '@models/GroupTournament';
import TournamentModel from '@models/Tournament';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import TournamentConflictModel from '@models/TournamentConflict';
import UserTournamentModel from '@models/UserTournament';
import { createTestUser, createAdminUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function groupParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
function memberParams(id: string, uid: string) {
  return { params: Promise.resolve({ id, uid }) };
}
function memberUserIdParams(id: string, userId: string) {
  return { params: Promise.resolve({ id, userId }) };
}
function tournamentParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}

async function createTestTournament(overrides: Partial<{ id: number; name: string; start_datetime: Date }> = {}) {
  const id = overrides.id ?? Math.floor(Math.random() * 900000) + 100000;
  return TournamentModel.create({
    id,
    name: overrides.name ?? `Tournoi ${id}`,
    start_datetime: overrides.start_datetime ?? new Date('2020-01-01'),
    end_datetime: null,
    description: '',
    full_header_image_url: '',
    timer_end_datetime: null,
    timer_paused_at_datetime: null,
    timer_is_running: false,
    registered_user_count: 0,
    full_address: '',
    latitude: 0,
    longitude: 0,
    game_type: '',
    event_status: 'COMPLETE',
    event_format: '',
    event_type: '',
    rules_enforcement_level: '',
    store: { id: 1, name: '', full_address: '', administrative_area_level_1_short: '', country: '', website: '', latitude: 0, longitude: 0 },
    settings: { id: 1, decklist_status: '', event_lifecycle_status: '', show_registration_button: false, round_duration_in_minutes: 50, payment_in_store: false, payment_on_spicerack: false, maximum_number_of_game_wins_per_match: 2, maximum_number_of_draws_per_match: null, checkin_methods: [], stripe_price_id: null },
    tournament_phases: [],
    gameplay_format: { id: '1', name: '', description: '' },
    cost_in_cents: 0,
    currency: 'EUR',
    capacity: 0,
    number_of_days: 1,
    url: null,
    timezone: null,
  });
}

// ─── GET /api/admin/groups ────────────────────────────────────────────────────

describe('GET /api/admin/groups', () => {
  it('retourne 403 pour un USER', async () => {
    const user = await createTestUser({ username: 'ag-list-user1', email: 'ag-list-user1@example.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await listGroups(req);
    expect(res.status).toBe(403);
  });

  it('retourne la liste enrichie pour un ADMIN', async () => {
    const admin = await createAdminUser({ username: 'ag-list-admin1', email: 'ag-list-admin1@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    await createTestGroup(admin._id, { name: 'ag-listed-group' });

    const req = makeRequest('GET', '/api/admin/groups', undefined, cookie);
    const res = await listGroups(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.groups)).toBe(true);
    const found = data.groups.find((g: { name: string }) => g.name === 'ag-listed-group');
    expect(found).toBeDefined();
    expect(found.memberCount).toBe(1);
    expect(found.tournamentCount).toBe(0);
  });
});

// ─── POST /api/admin/groups — validation ─────────────────────────────────────

describe('POST /api/admin/groups — validation', () => {
  it('retourne 400 si le nom est absent ou vide', async () => {
    const admin = await createAdminUser({ username: 'ag-val-admin', email: 'ag-val-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('POST', '/api/admin/groups', { name: '', description: '' }, cookie);
    const res = await createGroup(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le nom dépasse 100 caractères', async () => {
    const admin = await createAdminUser({ username: 'ag-val-admin2', email: 'ag-val-admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('POST', '/api/admin/groups', { name: 'a'.repeat(101) }, cookie);
    const res = await createGroup(req);
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/admin/groups ───────────────────────────────────────────────────

describe('POST /api/admin/groups', () => {
  it('crée un groupe et retourne 201', async () => {
    const admin = await createAdminUser({ username: 'ag-create-admin', email: 'ag-create-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');

    const req = makeRequest('POST', '/api/admin/groups', { name: 'ag-new-group', description: 'desc' }, cookie);
    const res = await createGroup(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe('ag-new-group');
    const inDb = await GroupModel.findOne({ name: 'ag-new-group' });
    expect(inDb).not.toBeNull();
  });

  it('retourne 400 si le nom est déjà pris', async () => {
    const admin = await createAdminUser({ username: 'ag-create-admin2', email: 'ag-create-admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    await createTestGroup(admin._id, { name: 'ag-taken-name' });

    const req = makeRequest('POST', '/api/admin/groups', { name: 'ag-taken-name' }, cookie);
    const res = await createGroup(req);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/admin/groups/[id] ──────────────────────────────────────────────

describe('GET /api/admin/groups/[id]', () => {
  it('retourne le détail du groupe avec membres et tournois', async () => {
    const admin = await createAdminUser({ username: 'ag-detail-admin', email: 'ag-detail-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-detail-group' });
    const tournament = await createTestTournament({ name: 'AG Detail Tournoi' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('GET', `/api/admin/groups/${group._id}`, undefined, cookie);
    const res = await getGroup(req, groupParams(String(group._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('ag-detail-group');
    expect(data.members).toHaveLength(1);
    expect(data.members[0].username).toBe('ag-detail-admin');
    expect(data.tournaments).toHaveLength(1);
    expect(data.tournaments[0].tournamentId).toBe(tournament.id);
  });

  it('retourne 404 pour un id inconnu', async () => {
    const admin = await createAdminUser({ username: 'ag-detail-admin2', email: 'ag-detail-admin2@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = new mongoose.Types.ObjectId();

    const req = makeRequest('GET', `/api/admin/groups/${fakeId}`, undefined, cookie);
    const res = await getGroup(req, groupParams(String(fakeId)));
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/admin/groups/[id] ────────────────────────────────────────────

describe('PATCH /api/admin/groups/[id]', () => {
  it('met à jour le nom du groupe', async () => {
    const admin = await createAdminUser({ username: 'ag-patch-admin', email: 'ag-patch-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-patch-before' });

    const req = makeRequest('PATCH', `/api/admin/groups/${group._id}`, { name: 'ag-patch-after' }, cookie);
    const res = await updateGroup(req, groupParams(String(group._id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('ag-patch-after');
  });
});

// ─── PATCH /api/admin/groups/[id] — non-membre autorisé ─────────────────────

describe('PATCH /api/admin/groups/[id] — non-membre autorisé', () => {
  it('retourne 200 même si le système ADMIN n\'est pas membre du groupe', async () => {
    const owner = await createAdminUser({ username: 'ag-patch-owner', email: 'ag-patch-owner@example.com' });
    const sysAdmin = await createAdminUser({ username: 'ag-patch-sysadmin', email: 'ag-patch-sysadmin@example.com' });
    const group = await createTestGroup(owner._id, { name: 'ag-patch-nonmember-group' });
    const cookie = await createAuthCookie(sysAdmin._id, 'ADMIN');

    const req = makeRequest('PATCH', `/api/admin/groups/${group._id}`, { name: 'ag-patch-nonmember-group' }, cookie);
    const res = await updateGroup(req, groupParams(String(group._id)));
    expect(res.status).toBe(200);
  });
});

// ─── DELETE /api/admin/groups/[id] ───────────────────────────────────────────

describe('DELETE /api/admin/groups/[id]', () => {
  it('supprime le groupe sans tournois et cascade les données', async () => {
    const admin = await createAdminUser({ username: 'ag-del-admin', email: 'ag-del-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-delete-group' });
    await GroupInvitationModel.create({
      groupId: group._id,
      invitedUserId: admin._id,
      invitedBy: admin._id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const req = makeRequest('DELETE', `/api/admin/groups/${group._id}`, undefined, cookie);
    const res = await deleteGroup(req, groupParams(String(group._id)));

    expect(res.status).toBe(200);
    expect(await GroupModel.findById(group._id)).toBeNull();
    expect(await GroupInvitationModel.findOne({ groupId: group._id })).toBeNull();
  });

  it('refuse la suppression si un tournoi est encore actif', async () => {
    const admin = await createAdminUser({ username: 'ag-del-active-admin', email: 'ag-del-active-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-delete-active-group' });
    const tournament = await createTestTournament({ start_datetime: new Date() }); // aujourd'hui → J+3 pas encore atteint
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('DELETE', `/api/admin/groups/${group._id}`, undefined, cookie);
    const res = await deleteGroup(req, groupParams(String(group._id)));
    expect(res.status).toBe(409);
  });

  it('supprime avec cascade quand tous les tournois sont terminés (J+3)', async () => {
    const admin = await createAdminUser({ username: 'ag-del-done-admin', email: 'ag-del-done-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-delete-done-group' });
    const tournament = await createTestTournament({ start_datetime: new Date('2020-01-01') });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({ tournamentId: tournament.id, groupId: group._id, userId: null, players: [] });
    await TournamentConflictModel.create({ groupId: group._id, userId: admin._id, tournamentId: tournament.id, playerId: 1, playerName: 'p', status: 'PENDING', previousInks: [], proposedInks: [] });

    const req = makeRequest('DELETE', `/api/admin/groups/${group._id}`, undefined, cookie);
    const res = await deleteGroup(req, groupParams(String(group._id)));

    expect(res.status).toBe(200);
    expect(await GroupModel.findById(group._id)).toBeNull();
    expect(await GroupTournamentModel.findOne({ groupId: group._id })).toBeNull();
    expect(await TournamentPlayersDeckModel.findOne({ groupId: group._id })).toBeNull();
    expect(await TournamentConflictModel.findOne({ groupId: group._id })).toBeNull();
  });
});

// ─── POST /api/admin/groups/[id]/members ─────────────────────────────────────

describe('POST /api/admin/groups/[id]/members', () => {
  it('crée une invitation pour l\'utilisateur cible', async () => {
    const admin = await createAdminUser({ username: 'ag-inv-admin', email: 'ag-inv-admin@example.com' });
    const user = await createTestUser({ username: 'ag-inv-user', email: 'ag-inv-user@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-inv-group' });

    const req = makeRequest('POST', `/api/admin/groups/${group._id}/members`, { userId: String(user._id) }, cookie);
    const res = await inviteMember(req, groupParams(String(group._id)));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(String(data.invitedUserId)).toBe(String(user._id));
    const inv = await GroupInvitationModel.findOne({ groupId: group._id, invitedUserId: user._id });
    expect(inv).not.toBeNull();
  });

  it('retourne 400 si l\'utilisateur est déjà membre', async () => {
    const admin = await createAdminUser({ username: 'ag-inv-already-admin', email: 'ag-inv-already-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-inv-already-group' });

    const req = makeRequest('POST', `/api/admin/groups/${group._id}/members`, { userId: String(admin._id) }, cookie);
    const res = await inviteMember(req, groupParams(String(group._id)));
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/admin/groups/[id]/members/[uid] ──────────────────────────────

describe('PATCH /api/admin/groups/[id]/members/[uid]', () => {
  it('change le rôle d\'un membre en ADMIN', async () => {
    const admin = await createAdminUser({ username: 'ag-role-admin', email: 'ag-role-admin@example.com' });
    const user = await createTestUser({ username: 'ag-role-user', email: 'ag-role-user@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-role-group' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });

    const req = makeRequest('PATCH', `/api/admin/groups/${group._id}/members/${user._id}`, { role: 'ADMIN' }, cookie);
    const res = await updateRole(req, memberParams(String(group._id), String(user._id)));

    expect(res.status).toBe(200);
    const updated = await GroupModel.findById(group._id);
    const member = updated!.members.find((m) => String(m.userId) === String(user._id));
    expect(member?.role).toBe('ADMIN');
  });

  it('retourne 400 si on essaie de retirer le seul admin', async () => {
    const admin = await createAdminUser({ username: 'ag-last-admin', email: 'ag-last-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-last-admin-group' });

    const req = makeRequest('PATCH', `/api/admin/groups/${group._id}/members/${admin._id}`, { role: 'MEMBER' }, cookie);
    const res = await updateRole(req, memberParams(String(group._id), String(admin._id)));
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/admin/groups/[id]/members/[uid] ─────────────────────────────

describe('DELETE /api/admin/groups/[id]/members/[uid]', () => {
  it('retire un membre du groupe', async () => {
    const admin = await createAdminUser({ username: 'ag-rem-admin', email: 'ag-rem-admin@example.com' });
    const user = await createTestUser({ username: 'ag-rem-user', email: 'ag-rem-user@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-rem-group' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });

    const req = makeRequest('DELETE', `/api/admin/groups/${group._id}/members/${user._id}`, undefined, cookie);
    const res = await removeMember(req, memberParams(String(group._id), String(user._id)));

    expect(res.status).toBe(200);
    const updated = await GroupModel.findById(group._id);
    expect(updated!.members.some((m) => String(m.userId) === String(user._id))).toBe(false);
  });
});

// ─── POST /api/admin/groups/[id]/tournaments ─────────────────────────────────

describe('POST /api/admin/groups/[id]/tournaments', () => {
  it('lie un tournoi sans merge automatique — les données solo restent intactes', async () => {
    const admin = await createAdminUser({ username: 'ag-tour-admin', email: 'ag-tour-admin@example.com' });
    const user = await createTestUser({ username: 'ag-tour-user', email: 'ag-tour-user@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-tour-group' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tournament = await createTestTournament({ name: 'AG Tour Merge' });

    // Scouting solo du user pour ce tournoi
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id,
      groupId: null,
      userId: user._id,
      players: [{ playerId: 1, best_identifier: 'Player A', event_best_identifier: '', pronouns: null, decks: [['Ambre', 'Rubis']] }],
    });
    await UserTournamentModel.create({ userId: user._id, tournamentId: tournament.id, status: 'ACTIVE' });

    const req = makeRequest('POST', `/api/admin/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    const res = await addTournament(req, groupParams(String(group._id)));

    expect(res.status).toBe(201);

    // Pas de merge automatique : le scope groupe ne doit PAS exister
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, groupId: group._id, userId: null });
    expect(groupDeck).toBeNull();

    // Le UserTournament doit toujours exister (pas supprimé automatiquement)
    const ut = await UserTournamentModel.findOne({ userId: user._id, tournamentId: tournament.id });
    expect(ut).not.toBeNull();
  });

  it('retourne 400 si le tournoi est déjà dans le groupe', async () => {
    const admin = await createAdminUser({ username: 'ag-tour-dup-admin', email: 'ag-tour-dup-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-tour-dup-group' });
    const tournament = await createTestTournament({ name: 'AG Tour Dup' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('POST', `/api/admin/groups/${group._id}/tournaments`, { tournamentId: tournament.id }, cookie);
    const res = await addTournament(req, groupParams(String(group._id)));
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/admin/groups/[id]/tournaments/[tid] ─────────────────────────

describe('DELETE /api/admin/groups/[id]/tournaments/[tid]', () => {
  it('retire un tournoi du groupe', async () => {
    const admin = await createAdminUser({ username: 'ag-tour-del-admin', email: 'ag-tour-del-admin@example.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id, { name: 'ag-tour-del-group' });
    const tournament = await createTestTournament({ name: 'AG Tour Del' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const req = makeRequest('DELETE', `/api/admin/groups/${group._id}/tournaments/${tournament.id}`, undefined, cookie);
    const res = await removeTournament(req, tournamentParams(String(group._id), String(tournament.id)));

    expect(res.status).toBe(200);
    expect(await GroupTournamentModel.findOne({ groupId: group._id, tournamentId: tournament.id })).toBeNull();
  });
});

// ─── Rejoindre un groupe ne déclenche plus le merge automatique ───────────────

describe('respondToInvitation : pas de merge automatique à l\'acceptation', () => {
  it('le UserTournament reste intact quand un user rejoint un groupe', async () => {
    const admin = await createAdminUser({ username: 'ag-join-admin', email: 'ag-join-admin@example.com' });
    const user = await createTestUser({ username: 'ag-join-user', email: 'ag-join-user@example.com' });
    const group = await createTestGroup(admin._id, { name: 'ag-join-group' });
    const tournament = await createTestTournament({ name: 'AG Join Tournoi' });

    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id,
      groupId: null,
      userId: user._id,
      players: [{ playerId: 1, best_identifier: 'Player A', event_best_identifier: '', pronouns: null, decks: [['Ambre', 'Rubis']] }],
    });
    await UserTournamentModel.create({ userId: user._id, tournamentId: tournament.id, status: 'ACTIVE' });

    const { GroupService } = await import('../../src/services/GroupService');
    const { GroupInvitationRepository } = await import('../../src/repositories/db/GroupInvitationRepository');

    await GroupInvitationRepository.create(String(group._id), String(user._id), String(admin._id));
    const inv = await GroupInvitationModel.findOne({ groupId: group._id, invitedUserId: user._id });
    await GroupService.respondToInvitation(String(inv!._id), String(user._id), 'ACCEPTED');

    // Pas de merge auto : UserTournament doit toujours exister
    const ut = await UserTournamentModel.findOne({ userId: user._id, tournamentId: tournament.id });
    expect(ut).not.toBeNull();

    // Données solo non mergées dans le groupe
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, groupId: group._id, userId: null });
    expect(groupDeck).toBeNull();
  });
});

// ─── GET /api/groups/[id]/tournaments/[tid]/merge-status ─────────────────────

describe('GET /api/groups/[id]/tournaments/[tid]/merge-status', () => {
  function mergeStatusParams(id: string, tid: string) {
    return { params: Promise.resolve({ id, tid }) };
  }

  it('retourne hasPendingPersonalData: true si l\'user a du scouting solo', async () => {
    const admin = await createAdminUser({ username: 'ms-admin', email: 'ms-admin@example.com' });
    const user = await createTestUser({ username: 'ms-user', email: 'ms-user@example.com' });
    const group = await createTestGroup(admin._id, { name: 'ms-group' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tournament = await createTestTournament({ name: 'MS Tournoi' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id,
      groupId: null,
      userId: user._id,
      players: [{ playerId: 1, best_identifier: 'Player A', event_best_identifier: '', pronouns: null, decks: [['Ambre', 'Rubis']] }],
    });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tournament.id}/merge-status`, undefined, cookie);
    const res = await getMergeStatus(req, mergeStatusParams(String(group._id), String(tournament.id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hasPendingPersonalData).toBe(true);
  });

  it('retourne hasPendingPersonalData: false si l\'user n\'a pas de scouting solo', async () => {
    const admin = await createAdminUser({ username: 'ms-admin2', email: 'ms-admin2@example.com' });
    const user = await createTestUser({ username: 'ms-user2', email: 'ms-user2@example.com' });
    const group = await createTestGroup(admin._id, { name: 'ms-group2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tournament = await createTestTournament({ name: 'MS Tournoi2' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tournament.id}/merge-status`, undefined, cookie);
    const res = await getMergeStatus(req, mergeStatusParams(String(group._id), String(tournament.id)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hasPendingPersonalData).toBe(false);
  });

  it('retourne 403 si l\'user n\'est pas membre du groupe', async () => {
    const admin = await createAdminUser({ username: 'ms-admin3', email: 'ms-admin3@example.com' });
    const outsider = await createTestUser({ username: 'ms-outsider', email: 'ms-outsider@example.com' });
    const group = await createTestGroup(admin._id, { name: 'ms-group3' });
    const tournament = await createTestTournament({ name: 'MS Tournoi3' });

    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tournament.id}/merge-status`, undefined, cookie);
    const res = await getMergeStatus(req, mergeStatusParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(403);
  });
});

// ─── POST /api/groups/[id]/tournaments/[tid]/merge ───────────────────────────

describe('POST /api/groups/[id]/tournaments/[tid]/merge', () => {
  function mergeParams(id: string, tid: string) {
    return { params: Promise.resolve({ id, tid }) };
  }

  it('fusionne les données solo dans le groupe et supprime le UserTournament', async () => {
    const admin = await createAdminUser({ username: 'mg-admin', email: 'mg-admin@example.com' });
    const user = await createTestUser({ username: 'mg-user', email: 'mg-user@example.com' });
    const group = await createTestGroup(admin._id, { name: 'mg-group' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const tournament = await createTestTournament({ name: 'MG Tournoi' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id,
      groupId: null,
      userId: user._id,
      players: [{ playerId: 1, best_identifier: 'Player A', event_best_identifier: '', pronouns: null, decks: [['Ambre', 'Rubis']] }],
    });
    await UserTournamentModel.create({ userId: user._id, tournamentId: tournament.id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/merge`, undefined, cookie);
    const res = await triggerMerge(req, mergeParams(String(group._id), String(tournament.id)));

    expect(res.status).toBe(200);

    // Les données doivent être dans le scope groupe
    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, groupId: group._id, userId: null });
    expect(groupDeck).not.toBeNull();
    const p = groupDeck!.players.find((p) => p.playerId === 1);
    expect(p?.decks).toEqual([['Ambre', 'Rubis']]);

    // Le UserTournament doit être supprimé
    const ut = await UserTournamentModel.findOne({ userId: user._id, tournamentId: tournament.id });
    expect(ut).toBeNull();
  });

  it('retourne 403 si l\'user n\'est pas membre du groupe', async () => {
    const admin = await createAdminUser({ username: 'mg-admin2', email: 'mg-admin2@example.com' });
    const outsider = await createTestUser({ username: 'mg-outsider', email: 'mg-outsider@example.com' });
    const group = await createTestGroup(admin._id, { name: 'mg-group2' });
    const tournament = await createTestTournament({ name: 'MG Tournoi2' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(outsider._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/tournaments/${tournament.id}/merge`, undefined, cookie);
    const res = await triggerMerge(req, mergeParams(String(group._id), String(tournament.id)));
    expect(res.status).toBe(403);
  });
});

// ─── Blocage création solo si tournoi dans un groupe ─────────────────────────

describe('POST /api/tournaments/[id]/link : blocage si tournoi dans un groupe', () => {
  it('retourne 409 si le tournoi est déjà dans un groupe de l\'utilisateur', async () => {
    const { POST: linkTournament } = await import('../../app/api/tournaments/[id]/link/route');
    const admin = await createAdminUser({ username: 'ag-block-admin', email: 'ag-block-admin@example.com' });
    const user = await createTestUser({ username: 'ag-block-user', email: 'ag-block-user@example.com' });
    const group = await createTestGroup(user._id, { name: 'ag-block-group' });
    const tournament = await createTestTournament({ name: 'AG Block Tournoi' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: user._id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/link`, undefined, cookie);
    const res = await linkTournament(req, { params: Promise.resolve({ id: String(tournament.id) }) });
    expect(res.status).toBe(409);
  });
});

// ─── Admin système : fusion scouting d'un membre ─────────────────────────────

describe('POST /api/admin/groups/[id]/members/[uid]/merge-tournament', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('POST', '/api/admin/groups/g1/members/u1/merge-tournament', { tournamentId: 1 });
    const res = await adminMergeMember(req, memberParams('g1', 'u1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas ADMIN système', async () => {
    const user = await createTestUser({ username: 'am-user1', email: 'am-user1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/admin/groups/g1/members/u1/merge-tournament', { tournamentId: 1 }, cookie);
    const res = await adminMergeMember(req, memberParams('g1', 'u1'));
    expect(res.status).toBe(403);
  });

  it('retourne 404 si le membre n\'appartient pas au groupe', async () => {
    const admin = await createAdminUser({ username: 'am-admin1', email: 'am-admin1@test.com' });
    const group = await createTestGroup(admin._id, { name: 'am-grp-1' });
    const stranger = await createTestUser({ username: 'am-stranger1', email: 'am-stranger1@test.com' });
    const tournament = await createTestTournament({ name: 'AM T1' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', `/api/admin/groups/${group._id}/members/${stranger._id}/merge-tournament`, { tournamentId: tournament.id }, cookie);
    const res = await adminMergeMember(req, memberParams(String(group._id), String(stranger._id)));
    expect(res.status).toBe(404);
  });

  it('retourne 404 si le tournoi n\'est pas dans le groupe', async () => {
    const admin = await createAdminUser({ username: 'am-admin2', email: 'am-admin2@test.com' });
    const user = await createTestUser({ username: 'am-user2', email: 'am-user2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'am-grp-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', `/api/admin/groups/${group._id}/members/${user._id}/merge-tournament`, { tournamentId: 999999 }, cookie);
    const res = await adminMergeMember(req, memberParams(String(group._id), String(user._id)));
    expect(res.status).toBe(404);
  });

  it('fusionne les données du membre et retourne 200', async () => {
    const admin = await createAdminUser({ username: 'am-admin3', email: 'am-admin3@test.com' });
    const user = await createTestUser({ username: 'am-user3', email: 'am-user3@test.com' });
    const group = await createTestGroup(admin._id, { name: 'am-grp-3' });
    const tournament = await createTestTournament({ name: 'AM T3' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id, userId: user._id, groupId: null,
      players: [{ playerId: 1, best_identifier: 'P1', event_best_identifier: 'p1', pronouns: null, decks: [['Amethyst', 'Steel']] }],
    });

    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const req = makeRequest('POST', `/api/admin/groups/${group._id}/members/${user._id}/merge-tournament`, { tournamentId: tournament.id }, cookie);
    const res = await adminMergeMember(req, memberParams(String(group._id), String(user._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, groupId: group._id, userId: null });
    expect(groupDeck).not.toBeNull();
    expect(groupDeck!.players[0].decks).toEqual([['Amethyst', 'Steel']]);

    const userDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, userId: user._id, groupId: null });
    expect(userDeck).toBeNull();
  });
});

// ─── Admin groupe : fusion scouting d'un membre ──────────────────────────────

describe('POST /api/groups/[id]/members/[userId]/merge-tournament', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('POST', '/api/groups/g1/members/u1/merge-tournament', { tournamentId: 1 });
    const res = await groupAdminMergeMember(req, memberUserIdParams('g1', 'u1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin du groupe', async () => {
    const owner = await createTestUser({ username: 'gam-owner1', email: 'gam-owner1@test.com' });
    const member = await createTestUser({ username: 'gam-member1', email: 'gam-member1@test.com' });
    const group = await createTestGroup(owner._id, { name: 'gam-grp-1' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: owner._id } },
    });

    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members/${owner._id}/merge-tournament`, { tournamentId: 1 }, cookie);
    const res = await groupAdminMergeMember(req, memberUserIdParams(String(group._id), String(owner._id)));
    expect(res.status).toBe(403);
  });

  it('retourne 404 si le membre cible n\'est pas dans le groupe', async () => {
    const admin = await createTestUser({ username: 'gam-admin1', email: 'gam-admin1@test.com' });
    const group = await createTestGroup(admin._id, { name: 'gam-grp-2' });
    const stranger = await createTestUser({ username: 'gam-stranger1', email: 'gam-stranger1@test.com' });
    const tournament = await createTestTournament({ name: 'GAM T1' });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members/${stranger._id}/merge-tournament`, { tournamentId: tournament.id }, cookie);
    const res = await groupAdminMergeMember(req, memberUserIdParams(String(group._id), String(stranger._id)));
    expect(res.status).toBe(404);
  });

  it('fusionne les données du membre et retourne 200', async () => {
    const admin = await createTestUser({ username: 'gam-admin2', email: 'gam-admin2@test.com' });
    const user = await createTestUser({ username: 'gam-user2', email: 'gam-user2@test.com' });
    const group = await createTestGroup(admin._id, { name: 'gam-grp-3' });
    const tournament = await createTestTournament({ name: 'GAM T2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id, userId: user._id, groupId: null,
      players: [{ playerId: 2, best_identifier: 'P2', event_best_identifier: 'p2', pronouns: null, decks: [['Ruby', 'Sapphire']] }],
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members/${user._id}/merge-tournament`, { tournamentId: tournament.id }, cookie);
    const res = await groupAdminMergeMember(req, memberUserIdParams(String(group._id), String(user._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const groupDeck = await TournamentPlayersDeckModel.findOne({ tournamentId: tournament.id, groupId: group._id, userId: null });
    expect(groupDeck).not.toBeNull();
    expect(groupDeck!.players[0].decks).toEqual([['Ruby', 'Sapphire']]);
  });

  it('crée un conflit si les encres diffèrent de celles du groupe', async () => {
    const admin = await createTestUser({ username: 'gam-admin3', email: 'gam-admin3@test.com' });
    const user = await createTestUser({ username: 'gam-user3', email: 'gam-user3@test.com' });
    const group = await createTestGroup(admin._id, { name: 'gam-grp-4' });
    const tournament = await createTestTournament({ name: 'GAM T3' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: user._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    await GroupTournamentModel.create({ groupId: group._id, tournamentId: tournament.id, addedBy: admin._id, status: 'ACTIVE' });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id, userId: user._id, groupId: null,
      players: [{ playerId: 3, best_identifier: 'P3', event_best_identifier: 'p3', pronouns: null, decks: [['Amber', 'Steel']] }],
    });
    await TournamentPlayersDeckModel.create({
      tournamentId: tournament.id, groupId: group._id, userId: null,
      players: [{ playerId: 3, best_identifier: 'P3', event_best_identifier: 'p3', pronouns: null, decks: [['Ruby', 'Emerald']] }],
    });

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('POST', `/api/groups/${group._id}/members/${user._id}/merge-tournament`, { tournamentId: tournament.id }, cookie);
    const res = await groupAdminMergeMember(req, memberUserIdParams(String(group._id), String(user._id)));
    expect(res.status).toBe(200);

    const conflicts = await TournamentConflictModel.find({ groupId: group._id });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].proposedInks).toEqual([['Amber', 'Steel']]);
    expect(conflicts[0].previousInks).toEqual([['Emerald', 'Ruby']]);
  });
});

// ─── GET /api/admin/groups/pinned ─────────────────────────────────────────────

describe('GET /api/admin/groups/pinned', () => {
  it('retourne 401 sans cookie', async () => {
    const res = await getPinned(makeRequest('GET', '/api/admin/groups/pinned'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'pin_user1', email: 'pin_user1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const res = await getPinned(makeRequest('GET', '/api/admin/groups/pinned', undefined, cookie));
    expect(res.status).toBe(403);
  });

  it('retourne null si aucun groupe épinglé', async () => {
    const admin = await createAdminUser({ username: 'pin_admin1', email: 'pin_admin1@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const res = await getPinned(makeRequest('GET', '/api/admin/groups/pinned', undefined, cookie));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.group).toBeNull();
  });
});

// ─── POST + DELETE /api/admin/groups/[id]/pin ─────────────────────────────────

describe('POST /api/admin/groups/[id]/pin', () => {
  it('retourne 401 sans cookie', async () => {
    const res = await pinGroup(makeRequest('POST', '/api/admin/groups/1/pin'), groupParams('1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle USER', async () => {
    const user = await createTestUser({ username: 'pin_user2', email: 'pin_user2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const res = await pinGroup(makeRequest('POST', '/api/admin/groups/1/pin', undefined, cookie), groupParams('1'));
    expect(res.status).toBe(403);
  });

  it('retourne 404 si le groupe n\'existe pas', async () => {
    const admin = await createAdminUser({ username: 'pin_admin2', email: 'pin_admin2@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await pinGroup(makeRequest('POST', `/api/admin/groups/${fakeId}/pin`, undefined, cookie), groupParams(fakeId));
    expect(res.status).toBe(404);
  });

  it('épingle un groupe et GET pinned le retourne', async () => {
    const admin = await createAdminUser({ username: 'pin_admin3', email: 'pin_admin3@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id);
    const gid = String(group._id);

    const pinRes = await pinGroup(makeRequest('POST', `/api/admin/groups/${gid}/pin`, undefined, cookie), groupParams(gid));
    expect(pinRes.status).toBe(200);

    const getRes = await getPinned(makeRequest('GET', '/api/admin/groups/pinned', undefined, cookie));
    const data = await getRes.json();
    expect(data.group._id).toBe(gid);
  });

  it('épingler un 2e groupe dépingle automatiquement le 1er', async () => {
    const admin = await createAdminUser({ username: 'pin_admin4', email: 'pin_admin4@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group1 = await createTestGroup(admin._id);
    const group2 = await createTestGroup(admin._id);
    const gid1 = String(group1._id);
    const gid2 = String(group2._id);

    await pinGroup(makeRequest('POST', `/api/admin/groups/${gid1}/pin`, undefined, cookie), groupParams(gid1));
    await pinGroup(makeRequest('POST', `/api/admin/groups/${gid2}/pin`, undefined, cookie), groupParams(gid2));

    const getRes = await getPinned(makeRequest('GET', '/api/admin/groups/pinned', undefined, cookie));
    const data = await getRes.json();
    expect(data.group._id).toBe(gid2);
  });
});

describe('DELETE /api/admin/groups/[id]/pin', () => {
  it('désépingle le groupe et GET pinned retourne null', async () => {
    const admin = await createAdminUser({ username: 'pin_admin5', email: 'pin_admin5@test.com' });
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const group = await createTestGroup(admin._id);
    const gid = String(group._id);

    await pinGroup(makeRequest('POST', `/api/admin/groups/${gid}/pin`, undefined, cookie), groupParams(gid));
    const unpinRes = await unpinGroup(makeRequest('DELETE', `/api/admin/groups/${gid}/pin`, undefined, cookie), groupParams(gid));
    expect(unpinRes.status).toBe(200);

    const getRes = await getPinned(makeRequest('GET', '/api/admin/groups/pinned', undefined, cookie));
    const data = await getRes.json();
    expect(data.group).toBeNull();
  });
});
