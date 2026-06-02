import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import { UserRepository } from '@/src/repositories/db/UserRepository';
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

  if (auth.role === 'USER') {
    const user = await UserRepository.findById(auth.userId);
    if (!user?.canCreateGroup) {
      return ApiResponse.forbidden('Vous n\'êtes pas autorisé à créer un groupe');
    }
  }

  try {
    const { name, description } = await request.json();
    const group = await GroupService.createGroup(auth.userId, { name, description });
    return ApiResponse.created(group);
  } catch (err) {
    return ApiResponse.badRequest((err as Error).message);
  }
}
