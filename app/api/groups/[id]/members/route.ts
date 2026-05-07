import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    const invitation = await GroupService.inviteMember(id, auth.userId, userId);
    return NextResponse.json(invitation, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
