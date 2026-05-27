import { NextRequest } from 'next/server';
import { RoundService } from '@/src/services/RoundService';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';

const RATE_LIMIT_SECONDS = 60;

export async function POST(request: NextRequest) {
	const result = await requireAdminSession(request);
	if ('error' in result) return result.error;

	const { tournamentId, roundId, options = {} } = await request.json();

	if (!tournamentId) return ApiResponse.badRequest('TournamentId requis');
	if (!roundId) return ApiResponse.badRequest('RoundId requis');

	const existing = await RoundRepository.findById(Number(roundId));
	if (existing?.lastFetchedAt) {
		const elapsed = (Date.now() - new Date(existing.lastFetchedAt).getTime()) / 1000;
		if (elapsed < RATE_LIMIT_SECONDS) {
			const wait = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
			return ApiResponse.tooManyRequests(`Veuillez attendre encore ${wait}s avant de refetcher ce round.`);
		}
	}

	try {
		// Admin fetch: no user scope — decks are empty until scouted in context (group or personal)
		const datas = await RoundService.fetchAndSave(Number(tournamentId), Number(roundId), options, { groupId: null, userId: null });
		return ApiResponse.ok({ message: 'Round récupéré !', datas });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
