import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import GroupModel from '@models/Group';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { hasRole } from '@/src/lib/auth/rbac';
import { ApiResponse } from '@/src/lib/api/responses';
import type { UserRole } from '@models/User';

export async function GET(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return ApiResponse.unauthorized();
  const parsed = await verifyCookie(val);
  if (!parsed || !hasRole(parsed.role as UserRole, 'ADMIN')) return ApiResponse.unauthorized();
  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return ApiResponse.unauthorized();

  const groups = await GroupModel.find().sort({ name: 1 }).select('_id name').lean();
  return ApiResponse.ok({
    groups: groups.map((g) => ({ _id: String(g._id), name: g.name })),
  });
}
