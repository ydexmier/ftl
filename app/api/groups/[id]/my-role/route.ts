import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId } = await params;

  const groupRole = await GroupRepository.getMemberRole(groupId, auth.userId);

  return ApiResponse.ok(
    { groupRole, appRole: auth.role },
    { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  );
}
