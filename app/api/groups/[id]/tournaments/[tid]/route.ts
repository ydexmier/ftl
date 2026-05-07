import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id, tid } = await params;
    await GroupService.removeTournament(id, auth.userId, Number(tid));
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
