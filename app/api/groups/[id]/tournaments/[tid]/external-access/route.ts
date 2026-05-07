import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

type Params = { params: Promise<{ id: string; tid: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id, tid } = await params;
    const accesses = await GroupService.getExternalAccessList(id, auth.userId, Number(tid));
    return NextResponse.json({ accesses });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id, tid } = await params;
    const { userId, expiresAt } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    const access = await GroupService.inviteExternal(
      id,
      auth.userId,
      userId,
      Number(tid),
      expiresAt ? new Date(expiresAt) : undefined,
    );
    return NextResponse.json(access, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
