import { NextRequest } from 'next/server';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [todayLogins, todayFails, weekLogins, weekFails, suspiciousIPs, recentFails] =
    await Promise.all([
      AuditLogModel.countDocuments({ action: 'LOGIN_SUCCESS', timestamp: { $gte: todayStart } }),
      AuditLogModel.countDocuments({ action: 'LOGIN_FAIL', timestamp: { $gte: todayStart } }),
      AuditLogModel.countDocuments({ action: 'LOGIN_SUCCESS', timestamp: { $gte: weekStart } }),
      AuditLogModel.countDocuments({ action: 'LOGIN_FAIL', timestamp: { $gte: weekStart } }),
      AuditLogModel.aggregate([
        { $match: { action: 'LOGIN_FAIL', timestamp: { $gte: last24h } } },
        {
          $group: {
            _id: '$ipAddress',
            failCount: { $sum: 1 },
            lastAttempt: { $max: '$timestamp' },
            usernames: { $addToSet: '$username' },
          },
        },
        { $match: { failCount: { $gte: 3 } } },
        { $sort: { failCount: -1 } },
        { $limit: 10 },
      ]),
      AuditLogModel.find({ action: 'LOGIN_FAIL', timestamp: { $gte: todayStart } })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

  return ApiResponse.ok({
    today: { logins: todayLogins, failures: todayFails },
    week: { logins: weekLogins, failures: weekFails },
    suspiciousIPs: suspiciousIPs.map(({ _id, failCount, lastAttempt, usernames }) => ({
      ip: _id, failCount, lastAttempt, usernames,
    })),
    recentFails,
  });
}
