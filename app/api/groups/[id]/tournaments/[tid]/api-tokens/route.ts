import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const tokens = await ApiTokenRepository.findByGroupAndTournament(groupId, tournamentId);
  return ApiResponse.ok(tokens.map(t => ({
    _id: t._id,
    name: t.name,
    status: t.status,
    expiresAt: t.expiresAt,
    lastUsedAt: t.lastUsedAt,
    createdAt: t.createdAt,
  })));
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id: groupId, tid } = await params;
  const tournamentId = Number(tid);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
  if (!isAdmin) return ApiResponse.forbidden();

  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) return ApiResponse.badRequest('Nom requis (max 100 caractères)');

  const { token, rawToken } = await ApiTokenRepository.create({
    name,
    scopeType: 'group',
    tournamentId,
    groupId,
    createdBy: auth.userId,
  });

  return ApiResponse.created({ token: { _id: token._id, name: token.name, status: token.status, expiresAt: token.expiresAt, createdAt: token.createdAt }, rawToken });
}
