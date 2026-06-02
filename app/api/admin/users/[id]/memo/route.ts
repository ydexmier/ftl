import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { AdminMemoRepository } from '@/src/repositories/db/AdminMemoRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  const memo = await AdminMemoRepository.findByAdminAndUser(session.userId, id);
  return ApiResponse.ok({ content: memo?.content ?? null });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  const body = await request.json();
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!content) return ApiResponse.badRequest('Le mémo ne peut pas être vide');
  if (content.length > 2000) return ApiResponse.badRequest('Le mémo ne peut pas dépasser 2000 caractères');

  const memo = await AdminMemoRepository.upsert(session.userId, id, content);
  return ApiResponse.ok({ content: memo?.content ?? content });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;
  const { session } = result;

  const { id } = await params;
  await AdminMemoRepository.delete(session.userId, id);
  return ApiResponse.ok({ deleted: true });
}
