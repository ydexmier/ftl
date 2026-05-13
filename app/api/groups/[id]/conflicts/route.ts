import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ConflictService } from '@/src/services/ConflictService';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id: groupId } = await params;

  const isAdmin = await GroupRepository.isAdmin(groupId, session.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  try {
    const conflicts = await ConflictService.getGroupPendingAdminConflicts(groupId);
    return ApiResponse.ok({ conflicts });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
