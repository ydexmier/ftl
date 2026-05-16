import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();

  const body = await request.json();
  const { type, title, description, page } = body;

  if (!['bug', 'improvement'].includes(type)) return ApiResponse.badRequest('Type invalide');
  if (!title?.trim() || title.trim().length > 200) return ApiResponse.badRequest('Titre invalide (200 caractères max)');
  if (!description?.trim() || description.trim().length > 2000) return ApiResponse.badRequest('Description invalide (2000 caractères max)');
  if (!page) return ApiResponse.badRequest('Page manquante');

  const user = await UserRepository.findById(session.userId);

  await FeedbackRepository.create({
    type,
    title: title.trim(),
    description: description.trim(),
    page,
    userId: session.userId,
    username: user?.username ?? '',
  });

  return ApiResponse.created({ submitted: true });
}
