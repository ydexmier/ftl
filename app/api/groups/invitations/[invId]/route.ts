import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

type Params = { params: Promise<{ invId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { invId } = await params;
    const { status } = await request.json();
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return NextResponse.json({ error: 'Statut invalide (ACCEPTED ou REJECTED)' }, { status: 400 });
    }
    const result = await GroupService.respondToInvitation(invId, auth.userId, status);
    return NextResponse.json(result);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
