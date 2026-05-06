import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import AuditLogModel from '@models/AuditLog';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

export async function GET(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  }

  await connectToMongoDB();

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

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
