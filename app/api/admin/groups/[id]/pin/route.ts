import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { id } = await params;
  const group = await GroupRepository.findById(id);
  if (!group) return ApiResponse.notFound('Groupe introuvable');

  await GroupRepository.pin(id);
  return ApiResponse.ok({ isPinned: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const result = await requireAdminSession(request);
  if ('error' in result) return result.error;

  const { id } = await params;
  await GroupRepository.unpin(id);
  return ApiResponse.ok({ isPinned: false });
}
