import { describe, it, expect } from 'vitest';
import { POST as assignDeck } from '../../app/api/rounds/[roundId]/matchs/[matchId]/assign_deck/route';
import { GET as getGroupReports } from '../../app/api/groups/[id]/tournaments/[tid]/reports/route';
import { GET as getAdminReports } from '../../app/api/admin/users/[id]/reports/route';
import ScoutingReportModel from '@models/ScoutingReport';
import TournamentModel from '@models/Tournament';
import GroupModel from '@models/Group';
import GroupTournamentModel from '@models/GroupTournament';
import { createTestUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

// ─── helpers ──────────────────────────────────────────────────────────────

let _counter = 0;
function nextTid() { return 400000 + ++_counter; }
let _roundId = 9000;
function nextRoundId() { return ++_roundId; }

function assignParams(roundId: string, matchId: string) {
  return { params: Promise.resolve({ roundId, matchId }) };
}
function groupTidParams(id: string, tid: string) {
  return { params: Promise.resolve({ id, tid }) };
}
function userParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedTournament(id: number) {
  return TournamentModel.create({
    id, name: `T-${id}`, event_status: 'IN_PROGRESS', start_datetime: new Date(),
  });
}

// ─── ScoutingReportRepository unit ────────────────────────────────────────

describe('ScoutingReportRepository', () => {
  it('countByGroupAndTournament retourne les counts groupés par userId', async () => {
    const { ScoutingReportRepository } = await import('@/src/repositories/db/ScoutingReportRepository');
    const user1 = await createTestUser({ username: 'sr1', email: 'sr1@test.com' });
    const user2 = await createTestUser({ username: 'sr2', email: 'sr2@test.com' });
    const group = await createTestGroup(user1._id, { name: 'sr-grp-1' });
    const tid = nextTid();

    await ScoutingReportModel.insertMany([
      { userId: user1._id, groupId: group._id, tournamentId: tid, playerId: 1 },
      { userId: user1._id, groupId: group._id, tournamentId: tid, playerId: 2 },
      { userId: user2._id, groupId: group._id, tournamentId: tid, playerId: 1 },
    ]);

    const counts = await ScoutingReportRepository.countByGroupAndTournament(String(group._id), tid);
    const map = Object.fromEntries(counts.map((c) => [String(c.userId), c.count]));
    expect(map[String(user1._id)]).toBe(2);
    expect(map[String(user2._id)]).toBe(1);
  });

  it('countGlobalByUser retourne le total et le détail par tournoi', async () => {
    const { ScoutingReportRepository } = await import('@/src/repositories/db/ScoutingReportRepository');
    const user = await createTestUser({ username: 'sr3', email: 'sr3@test.com' });
    const tid1 = nextTid();
    const tid2 = nextTid();

    await ScoutingReportModel.insertMany([
      { userId: user._id, groupId: null, tournamentId: tid1, playerId: 1 },
      { userId: user._id, groupId: null, tournamentId: tid1, playerId: 2 },
      { userId: user._id, groupId: null, tournamentId: tid2, playerId: 1 },
    ]);

    const { total, byTournament } = await ScoutingReportRepository.countGlobalByUser(String(user._id));
    expect(total).toBe(3);
    expect(byTournament).toHaveLength(2);
    const t1 = byTournament.find((t) => t.tournamentId === tid1);
    expect(t1!.count).toBe(2);
  });
});

// ─── GET /api/groups/[id]/tournaments/[tid]/reports ───────────────────────

describe('GET /api/groups/[id]/tournaments/[tid]/reports', () => {
  it('retourne 401 sans session', async () => {
    const req = makeRequest('GET', '/api/groups/g1/tournaments/1/reports');
    const res = await getGroupReports(req, groupTidParams('g1', '1'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si membre non-admin', async () => {
    const admin = await createTestUser({ username: 'sr4', email: 'sr4@test.com' });
    const member = await createTestUser({ username: 'sr5', email: 'sr5@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sr-grp-2' });
    await GroupModel.findByIdAndUpdate(group._id, {
      $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
    });
    const cookie = await createAuthCookie(member._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/1/reports`, undefined, cookie);
    const res = await getGroupReports(req, groupTidParams(String(group._id), '1'));
    expect(res.status).toBe(403);
  });

  it('retourne les reports par membre triés par count décroissant', async () => {
    const admin = await createTestUser({ username: 'sr6', email: 'sr6@test.com' });
    const member = await createTestUser({ username: 'sr7', email: 'sr7@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sr-grp-3' });
    const tid = nextTid();

    // admin: 3 reports, member: 1 report
    await ScoutingReportModel.insertMany([
      { userId: admin._id, groupId: group._id, tournamentId: tid, playerId: 1 },
      { userId: admin._id, groupId: group._id, tournamentId: tid, playerId: 2 },
      { userId: admin._id, groupId: group._id, tournamentId: tid, playerId: 3 },
      { userId: member._id, groupId: group._id, tournamentId: tid, playerId: 1 },
    ]);

    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/${tid}/reports`, undefined, cookie);
    const res = await getGroupReports(req, groupTidParams(String(group._id), String(tid)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reports[0].count).toBeGreaterThanOrEqual(data.reports[1].count);
    expect(data.reports.find((r: { userId: string }) => r.userId === String(admin._id)).count).toBe(3);
    expect(data.reports.find((r: { userId: string }) => r.userId === String(member._id)).count).toBe(1);
  });

  it('retourne 200 avec liste vide si aucun report', async () => {
    const admin = await createTestUser({ username: 'sr8', email: 'sr8@test.com' });
    const group = await createTestGroup(admin._id, { name: 'sr-grp-4' });
    const cookie = await createAuthCookie(admin._id, 'USER');
    const req = makeRequest('GET', `/api/groups/${group._id}/tournaments/1/reports`, undefined, cookie);
    const res = await getGroupReports(req, groupTidParams(String(group._id), '1'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reports).toEqual([]);
  });
});

// ─── GET /api/admin/users/[id]/reports ───────────────────────────────────

describe('GET /api/admin/users/[id]/reports', () => {
  it('retourne 401 sans session admin', async () => {
    const req = makeRequest('GET', '/api/admin/users/fakeid/reports');
    const res = await getAdminReports(req, userParams('fakeid'));
    expect(res.status).toBe(401);
  });

  it('retourne le total et le détail par tournoi', async () => {
    const adminUser = await createTestUser({ username: 'sr9', email: 'sr9@test.com', role: 'ADMIN' });
    const targetUser = await createTestUser({ username: 'sr10', email: 'sr10@test.com' });
    const tid1 = nextTid();
    const tid2 = nextTid();

    await seedTournament(tid1);
    await seedTournament(tid2);

    await ScoutingReportModel.insertMany([
      { userId: targetUser._id, groupId: null, tournamentId: tid1, playerId: 1 },
      { userId: targetUser._id, groupId: null, tournamentId: tid1, playerId: 2 },
      { userId: targetUser._id, groupId: null, tournamentId: tid2, playerId: 1 },
    ]);

    const cookie = await createAuthCookie(adminUser._id, 'ADMIN');
    const req = makeRequest('GET', `/api/admin/users/${targetUser._id}/reports`, undefined, cookie);
    const res = await getAdminReports(req, userParams(String(targetUser._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(3);
    expect(data.byTournament).toHaveLength(2);
    const t1 = data.byTournament.find((t: { tournamentId: number }) => t.tournamentId === tid1);
    expect(t1.count).toBe(2);
    expect(typeof t1.tournamentName).toBe('string');
  });

  it('retourne total 0 et tableau vide si aucun report', async () => {
    const adminUser = await createTestUser({ username: 'sr11', email: 'sr11@test.com', role: 'ADMIN' });
    const targetUser = await createTestUser({ username: 'sr12', email: 'sr12@test.com' });

    const cookie = await createAuthCookie(adminUser._id, 'ADMIN');
    const req = makeRequest('GET', `/api/admin/users/${targetUser._id}/reports`, undefined, cookie);
    const res = await getAdminReports(req, userParams(String(targetUser._id)));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(0);
    expect(data.byTournament).toEqual([]);
  });
});
