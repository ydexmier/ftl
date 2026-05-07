import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id } = await params;
    const tournaments = await GroupService.getGroupTournaments(id, auth.userId);
    return NextResponse.json({ tournaments });
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
    const { id } = await params;
    const { tournamentId } = await request.json();
    if (!tournamentId) return NextResponse.json({ error: 'tournamentId requis' }, { status: 400 });

    const entry = await GroupService.addTournament(id, auth.userId, Number(tournamentId));
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
