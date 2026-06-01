import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) return ApiResponse.badRequest('Requête trop courte (minimum 3 caractères)');

  const users = await UserRepository.search(q, 10);
  return ApiResponse.ok({ users: users.map((u) => ({ ...u, _id: String(u._id) })) });
}
