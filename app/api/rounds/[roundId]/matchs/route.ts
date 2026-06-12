import { NextRequest } from 'next/server';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { RoundService } from '@/src/services/RoundService';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import type { ScoutingFilter } from '@/src/types/round';

type Params = { params: Promise<{ roundId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
	try {
		const { roundId } = await params;
		const sp = request.nextUrl.searchParams;

		const auth = await getAuthSession(request);
		const groupId = sp.get('groupId') ?? null;
		const scope = groupId ? { groupId } : { userId: auth?.userId ?? null };

		const data = await RoundService.getMatchesPaginated(Number(roundId), {
			page: Number(sp.get('page') ?? 1),
			perPage: Number(sp.get('perPage') ?? 10),
			search: sp.get('search') ?? '',
			excludeOnePlayerMatches: sp.get('excludeOnePlayerMatches') === 'true',
			scoutingFilter: (sp.get('scoutingFilter')?.split(',').filter((v): v is ScoutingFilter => ['full', 'partial', 'none'].includes(v))) ?? [],
			tournamentId: sp.get('tournamentId') ? Number(sp.get('tournamentId')) : undefined,
		}, scope);

		return ApiResponse.ok(data);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'ROUND_NOT_FOUND') return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { roundId } = await params;
		const body = await request.json();
		const round = await RoundRepository.upsert({ id: Number(roundId), ...body });
		return ApiResponse.ok(round);
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
