import { NextRequest } from 'next/server';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';

function extractNumericId(input: string): number | null {
  const fromUrl = input.match(/events\/(\d+)/);
  if (fromUrl) return Number(fromUrl[1]);
  const n = Number(input);
  return !isNaN(n) && n > 0 ? n : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) return ApiResponse.unauthorized();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    if (q.length < 1) return ApiResponse.badRequest('Requête trop courte');

    const numericId = extractNumericId(q);
    const results = await TournamentRepository.search(numericId !== null ? String(numericId) : q);

    const [userLinks, groups] = await Promise.all([
      UserTournamentRepository.findByUserId(session.userId),
      GroupRepository.findByMemberId(session.userId),
    ]);

    const linkedIds = new Set(userLinks.map((l) => l.tournamentId));
    const groupTournamentIds = new Set<number>();
    await Promise.all(
      groups.map(async (g) => {
        const gts = await GroupTournamentRepository.findByGroupId(String(g._id));
        gts.forEach((gt) => groupTournamentIds.add(gt.tournamentId));
      }),
    );

    const enriched = results.map((t) => ({
      id: t.id,
      name: t.name,
      start_datetime: t.start_datetime instanceof Date ? t.start_datetime.toISOString() : String(t.start_datetime ?? ''),
      event_status: t.event_status,
      store: t.store ? { name: t.store.name } : null,
      isLinked: linkedIds.has(t.id),
      isGroupTournament: groupTournamentIds.has(t.id),
    }));

    return ApiResponse.ok({
      results: enriched,
      noResults: enriched.length === 0,
      fetchableId: enriched.length === 0 && numericId !== null ? numericId : null,
    });
  } catch (err) {
    return ApiResponse.serverError(err);
  }
}
