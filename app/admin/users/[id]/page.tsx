import { notFound } from 'next/navigation';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { UserDetailClient } from '@components/admin/users/UserDetailClient';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectToMongoDB();

  const user = await UserModel.findById(id).select('-passwordHash').lean().catch(() => null);
  if (!user) notFound();

  const [activeSessions, recentLogs, scoutingStats, rawGroups] = await Promise.all([
    SessionModel.countDocuments({ userId: user._id, expiresAt: { $gt: new Date() } }),
    AuditLogModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
    ScoutingReportRepository.countGlobalByUser(String(user._id)),
    GroupRepository.findByMemberId(String(user._id)),
  ]);

  const tournamentIds = scoutingStats.byTournament.map((t) => t.tournamentId);
  const tournaments = await Promise.all(tournamentIds.map((tid) => TournamentRepository.findById(tid)));
  const tournamentNameMap = Object.fromEntries(
    tournaments.filter(Boolean).map((t) => [t!.id, t!.name]),
  );

  const userId = String(user._id);
  const groups = rawGroups.map((g) => {
    const member = g.members.find((m) => String(m.userId) === userId);
    return {
      _id: String(g._id),
      name: g.name,
      role: (member?.role ?? 'MEMBER') as 'ADMIN' | 'MEMBER',
    };
  });

  return (
    <UserDetailClient
      user={{
        _id: userId,
        username: user.username,
        email: user.email,
        role: user.role,
        canCreateGroup: user.canCreateGroup ?? false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }}
      activeSessions={activeSessions}
      recentLogs={recentLogs.map((l) => ({
        _id: String(l._id),
        action: l.action,
        username: l.username,
        timestamp: l.timestamp.toISOString(),
      }))}
      scoutingStats={{
        total: scoutingStats.total,
        byTournament: scoutingStats.byTournament.map((t) => ({
          tournamentId: t.tournamentId,
          tournamentName: tournamentNameMap[t.tournamentId] ?? `Tournoi #${t.tournamentId}`,
          count: t.count,
        })),
      }}
      groups={groups}
    />
  );
}
