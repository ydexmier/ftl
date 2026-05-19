import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';

type Params = { params: Promise<{ commentId: string }> };

async function canModify(
  session: { userId: string; role: string },
  commentAuthorId: string,
  commentGroupId: string | null,
): Promise<boolean> {
  if (session.role === 'ADMIN' || session.role === 'SUPERUSER') return true;
  if (session.userId === commentAuthorId) return true;
  if (commentGroupId) {
    return GroupRepository.isAdmin(commentGroupId, session.userId);
  }
  return false;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { commentId } = await params;

  const comment = await PlayerCommentRepository.findById(commentId);
  if (!comment) return ApiResponse.notFound('Commentaire introuvable');

  const authorized = await canModify(
    session,
    String(comment.authorId),
    comment.groupId ? String(comment.groupId) : null,
  );
  if (!authorized) return ApiResponse.forbidden();

  const body = await req.json();
  const content: string = body.content ?? '';
  if (!content.trim()) return ApiResponse.badRequest('Le contenu ne peut pas être vide');
  if (content.length > 500) return ApiResponse.badRequest('Contenu limité à 500 caractères');

  try {
    const updated = await PlayerCommentRepository.update(commentId, content.trim());
    return ApiResponse.ok({ comment: updated });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAuthSession(req);
  if (!session) return ApiResponse.unauthorized();

  const { commentId } = await params;

  const comment = await PlayerCommentRepository.findById(commentId);
  if (!comment) return ApiResponse.notFound('Commentaire introuvable');

  const authorized = await canModify(
    session,
    String(comment.authorId),
    comment.groupId ? String(comment.groupId) : null,
  );
  if (!authorized) return ApiResponse.forbidden();

  try {
    await PlayerCommentRepository.delete(commentId);
    return ApiResponse.noContent();
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
