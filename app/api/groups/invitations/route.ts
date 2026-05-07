import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupService } from '@/src/services/GroupService';

export async function GET(request: NextRequest) {
  const auth = await getAuthSession(request);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const invitations = await GroupService.getMyInvitations(auth.userId);
  return NextResponse.json({ invitations });
}
