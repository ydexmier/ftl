import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const tokens = await ApiTokenRepository.findByUserAndTournament(auth.userId, tournamentId);
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

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) return ApiResponse.badRequest('Nom requis (max 100 caractères)');

  const { token, rawToken } = await ApiTokenRepository.create({
    name,
    scopeType: 'user',
    tournamentId,
    userId: auth.userId,
    createdBy: auth.userId,
  });

  return ApiResponse.created({ token: { _id: token._id, name: token.name, status: token.status, expiresAt: token.expiresAt, createdAt: token.createdAt }, rawToken });
}
