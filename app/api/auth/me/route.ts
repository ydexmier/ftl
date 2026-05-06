import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import { getSession } from '@/src/lib/auth/session';
import { verifyCookie } from '@/src/lib/auth/cookieSign';

export async function GET(request: NextRequest) {
  const val = request.cookies.get('session')?.value;
  if (!val) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const parsed = await verifyCookie(val);
  if (!parsed) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

  await connectToMongoDB();
  const session = await getSession(parsed.sessionId);
  if (!session) return NextResponse.json({ error: 'Session expiree' }, { status: 401 });

  const user = await UserModel.findById(session.userId).select('username role').lean();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

  return NextResponse.json({ id: String(user._id), username: user.username, role: user.role });
}
