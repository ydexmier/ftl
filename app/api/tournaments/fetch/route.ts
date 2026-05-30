import { NextRequest } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';

const RATE_LIMIT_SECONDS = 60;

export async function POST(request: NextRequest) {
	const session = await getAuthSession(request);
	if (!session) return ApiResponse.unauthorized();

	const { tournamentId } = await request.json();

	if (!tournamentId) return ApiResponse.badRequest('TournamentId requis');

	const existing = await TournamentRepository.findById(Number(tournamentId));
	if (existing?.lastFetchedAt) {
		const elapsed = (Date.now() - new Date(existing.lastFetchedAt).getTime()) / 1000;
		if (elapsed < RATE_LIMIT_SECONDS) {
			const wait = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
			return ApiResponse.tooManyRequests(`Veuillez attendre encore ${wait}s avant de refetcher ce tournoi.`);
		}
	}

	try {
		const datas = await TournamentService.fetchAndSave(Number(tournamentId));
		return ApiResponse.ok({ message: 'Tournoi récupéré !', datas });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
