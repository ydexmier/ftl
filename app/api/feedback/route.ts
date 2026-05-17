import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { FeedbackRepository } from '@/src/repositories/db/FeedbackRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { checkRateLimit } from '@/src/lib/auth/rateLimit';
import { validateFeedbackBody } from '@/src/lib/validation';

export async function POST(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return ApiResponse.unauthorized();

  const rl = checkRateLimit(`feedback:${session.userId}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests('Trop de soumissions. Réessayez dans quelques minutes.');

  const v = validateFeedbackBody(await request.json());
  if (!v.ok) return ApiResponse.badRequest(v.error);
  const { type, title, description, page } = v.data;

  const user = await UserRepository.findById(session.userId);

  await FeedbackRepository.create({
    type,
    title,
    description,
    page,
    userId: session.userId,
    username: user?.username ?? '',
  });

  return ApiResponse.created({ submitted: true });
}
