import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized('Non authentifié');

  const user = await UserRepository.findById(auth.userId);
  if (!user) return ApiResponse.unauthorized('Utilisateur introuvable');

  return ApiResponse.ok(
    { id: String(user._id), username: user.username, role: user.role, isGuest: user.isGuest ?? false },
    { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
  );
}
