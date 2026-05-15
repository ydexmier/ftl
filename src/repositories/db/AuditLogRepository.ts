import AuditLogModel from '@models/AuditLog';
import type { AuditAction } from '@models/AuditLog';
import connectToMongoDB from '@/src/lib/db';
import mongoose from 'mongoose';

export const AuditLogRepository = {
  async create(data: {
    action: AuditAction;
    userId?: mongoose.Types.ObjectId | string;
    username?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    await connectToMongoDB();
    return AuditLogModel.create(data);
  },

  async findByUserId(userId: string, limit: number) {
    await connectToMongoDB();
    return AuditLogModel.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findWithFilters(
    filter: { action?: string; username?: string; ip?: string; from?: string; to?: string },
    page: number,
    limit: number,
  ) {
    await connectToMongoDB();
    const query: Record<string, unknown> = {};
    if (filter.action) query.action = filter.action;
    if (filter.username) query.username = { $regex: filter.username, $options: 'i' };
    if (filter.ip) query.ipAddress = { $regex: filter.ip, $options: 'i' };
    if (filter.from || filter.to) {
      const range: Record<string, Date> = {};
      if (filter.from) range.$gte = new Date(filter.from);
      if (filter.to) range.$lte = new Date(filter.to);
      query.timestamp = range;
    }

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return { logs, total };
  },

  async getStats() {
    await connectToMongoDB();
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

    return {
      today: { logins: todayLogins, failures: todayFails },
      week: { logins: weekLogins, failures: weekFails },
      suspiciousIPs: suspiciousIPs.map(
        ({ _id, failCount, lastAttempt, usernames }: { _id: string; failCount: number; lastAttempt: Date; usernames: string[] }) => ({
          ip: _id, failCount, lastAttempt, usernames,
        }),
      ),
      recentFails,
    };
  },
};
