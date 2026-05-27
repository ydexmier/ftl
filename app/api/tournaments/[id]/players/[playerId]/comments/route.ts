import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';

type Params = { params: Promise<{ id: string; playerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id, playerId: playerIdStr } = await params;
  const tournamentId = Number(id);
  const playerId = Number(playerIdStr);
  if (isNaN(tournamentId) || isNaN(playerId)) return ApiResponse.badRequest('Paramètres invalides');

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const targetUserId = searchParams.get('userId');

  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, session.userId);
    if (!isMember && session.role !== 'ADMIN' && session.role !== 'SUPERUSER') {
      return ApiResponse.forbidden();
    }

    // Admin view: fetch a member's personal comments alongside group context
    if (targetUserId) {
      const isAdmin = await GroupRepository.isAdmin(groupId, session.userId);
      if (!isAdmin && session.role !== 'ADMIN' && session.role !== 'SUPERUSER') {
        return ApiResponse.forbidden();
      }
    }
  }

  try {
    let comments;
    if (groupId && targetUserId) {
      // Admin fetching a specific member's personal (groupId: null) comments
      const [groupComments, memberComments] = await Promise.all([
        PlayerCommentRepository.findByPlayer(tournamentId, playerId, { groupId }),
        PlayerCommentRepository.findByPlayer(tournamentId, playerId, { groupId: null }),
      ]);
      // Filter member comments to only this user's
      const filtered = memberComments.filter((c) => {
        const id = typeof c.authorId === 'object' ? String((c.authorId as unknown as { _id: string })._id) : String(c.authorId);
        return id === targetUserId;
      });
      comments = { groupComments, memberComments: filtered };
    } else {
      const scope = groupId ? { groupId } : { groupId: null as null };
      comments = await PlayerCommentRepository.findByPlayer(tournamentId, playerId, scope);
    }
    return ApiResponse.ok({ comments });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { id, playerId: playerIdStr } = await params;
  const tournamentId = Number(id);
  const playerId = Number(playerIdStr);
  if (isNaN(tournamentId) || isNaN(playerId)) return ApiResponse.badRequest('Paramètres invalides');

  const body = await req.json().catch(() => ({}));
  const { content, groupId, inks } = body as { content?: string; groupId?: string; inks?: string[] };

  if (!content || typeof content !== 'string' || !content.trim()) {
    return ApiResponse.badRequest('Le commentaire ne peut pas être vide');
  }
  if (content.length > 500) return ApiResponse.badRequest('Commentaire trop long');

  if (groupId) {
    const isMember = await GroupRepository.isMember(groupId, session.userId);
    if (!isMember && session.role !== 'ADMIN' && session.role !== 'SUPERUSER') {
      return ApiResponse.forbidden();
    }
  }

  try {
    const comment = await PlayerCommentRepository.create({
      tournamentId,
      playerId,
      authorId: session.userId,
      groupId: groupId ?? null,
      inks: inks ?? [],
      content: content.trim(),
    });
    return ApiResponse.created({ comment });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
