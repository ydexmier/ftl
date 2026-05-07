import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const groups = await GroupService.getUserGroups(auth.userId);
  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { name, description } = await request.json();
    const group = await GroupService.createGroup(auth.userId, { name, description });
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
