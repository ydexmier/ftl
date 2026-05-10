import { NextRequest } from 'next/server';
import { RoundService } from '@/src/services/RoundService';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
	const { tournamentId, roundId, options = {} } = await request.json();

	if (!tournamentId) return ApiResponse.badRequest('TournamentId requis');
	if (!roundId) return ApiResponse.badRequest('RoundId requis');

	try {
		// Admin fetch: no user scope — decks are empty until scouted in context (group or personal)
		const datas = await RoundService.fetchAndSave(Number(tournamentId), Number(roundId), options, { groupId: null, userId: null });
		return ApiResponse.ok({ message: 'Round récupéré !', datas });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
