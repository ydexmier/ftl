import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import { ApiTokenRepository } from '@/src/repositories/db/ApiTokenRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return ApiResponse.unauthorized('Bearer token requis');
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) return ApiResponse.unauthorized('Token manquant');

  await connectToMongoDB();

  const apiToken = await ApiTokenRepository.findByRawToken(rawToken);
  if (!apiToken) return ApiResponse.unauthorized('Token invalide ou révoqué');

  if (apiToken.expiresAt < new Date()) return ApiResponse.unauthorized('Token expiré');

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

  if (apiToken.tournamentId !== tournamentId) {
    return ApiResponse.forbidden('Ce token ne donne pas accès à ce tournoi');
  }

  ApiTokenRepository.updateLastUsed(String(apiToken._id)).catch(() => {});

  const scope = apiToken.scopeType === 'group'
    ? { groupId: String(apiToken.groupId), userId: null }
    : { groupId: null, userId: String(apiToken.userId) };

  const [deckDoc, comments] = await Promise.all([
    TournamentPlayersDeckRepository.findByScope(tournamentId, scope),
    PlayerCommentRepository.findByTournament(tournamentId, {
      groupId: apiToken.scopeType === 'group' ? String(apiToken.groupId) : null,
      userId: apiToken.scopeType === 'user' ? String(apiToken.userId) : undefined,
    }),
  ]);

  const commentsByPlayer = new Map<number, typeof comments>();
  for (const c of comments) {
    const list = commentsByPlayer.get(c.playerId) ?? [];
    list.push(c);
    commentsByPlayer.set(c.playerId, list);
  }

  const players = (deckDoc?.players ?? []).map(p => ({
    id: p.playerId,
    best_identifier: p.best_identifier,
    pronouns: p.pronouns,
    event_best_identifier: p.event_best_identifier,
    decks: p.decks,
    comments: (commentsByPlayer.get(p.playerId) ?? []).map(c => ({
      inks: c.inks,
      content: c.content,
      createdAt: c.createdAt,
    })),
  }));

  return ApiResponse.ok({
    tournamentId,
    scopeType: apiToken.scopeType,
    generatedAt: new Date().toISOString(),
    players,
  });
}
