import { NextRequest } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return ApiResponse.unauthorized('Non authentifié');

  const parsed = await verifyCookie(val);
  if (!parsed) return ApiResponse.unauthorized('Session invalide');

  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return ApiResponse.unauthorized('Session expirée');

  const user = await UserModel.findById(session.userId).select('username role').lean();
  if (!user) return ApiResponse.unauthorized('Utilisateur introuvable');

  return ApiResponse.ok({ id: String(user._id), username: user.username, role: user.role });
}
