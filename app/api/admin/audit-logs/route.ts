import { NextRequest } from 'next/server';
import AuditLogModel from '@models/AuditLog';
import { getAdminSession } from '@/src/lib/auth/getAdminSession';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAdminSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const username = searchParams.get('username');
  const ip = searchParams.get('ip');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));

  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;
  if (username) filter.username = { $regex: username, $options: 'i' };
  if (ip) filter.ipAddress = { $regex: ip, $options: 'i' };
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    filter.timestamp = range;
  }

  const [logs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return ApiResponse.ok({ logs, total, page, pages: Math.ceil(total / limit) });
}
