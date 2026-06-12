import { NextRequest } from 'next/server';
import { RoundService } from '@/src/services/RoundService';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		const { roundId, matchId } = await params;
		const match = await RoundService.getMatch(Number(roundId), Number(matchId));
		return ApiResponse.ok(match);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Match not found') return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}
