import { NextRequest } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
	const { tournamentId, isRefetch } = await request.json();

	if (!tournamentId) return ApiResponse.badRequest('TournamentId requis');

	try {
		const datas = await TournamentService.fetchAndSave(Number(tournamentId), isRefetch);
		return ApiResponse.ok({ message: 'Tournoi récupéré !', datas });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
