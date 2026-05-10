import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const groups = await GroupService.getUserGroups(auth.userId);
  return ApiResponse.ok({ groups });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  try {
    const { name, description } = await request.json();
    const group = await GroupService.createGroup(auth.userId, { name, description });
    return ApiResponse.created(group);
  } catch (err) {
    return ApiResponse.badRequest((err as Error).message);
  }
}
