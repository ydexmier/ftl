import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';
import type { GroupMemberRole } from '@/src/types/group';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id, userId } = await params;
    await GroupService.removeMember(id, auth.userId, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { id, userId } = await params;
    const { role } = await request.json();
    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Rôle invalide (MEMBER ou ADMIN)' }, { status: 400 });
    }
    const group = await GroupService.updateMemberRole(id, auth.userId, userId, role as GroupMemberRole);
    return NextResponse.json(group);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
