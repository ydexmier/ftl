import { NextRequest } from 'next/server';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
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
