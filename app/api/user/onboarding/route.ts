import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { UserRepository } from '@/src/repositories/db/UserRepository';

export async function PATCH(req: NextRequest) {
  const auth = await getAuthSession(req);
  if (!auth) return ApiResponse.unauthorized();

  await UserRepository.markOnboardingComplete(auth.userId);
  return ApiResponse.ok({});
}
