import { notFound } from 'next/navigation';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { UserDetailClient } from '@components/admin/users/UserDetailClient';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectToMongoDB();

  const user = await UserModel.findById(id).select('-passwordHash').lean().catch(() => null);
  if (!user) notFound();

  const [activeSessions, recentLogs] = await Promise.all([
    SessionModel.countDocuments({ userId: user._id, expiresAt: { $gt: new Date() } }),
    AuditLogModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
  ]);

  return (
    <UserDetailClient
      user={{
        _id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
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
    />
  );
}
