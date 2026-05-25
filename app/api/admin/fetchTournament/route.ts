import { NextRequest } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

const RATE_LIMIT_SECONDS = 60;

export async function POST(request: NextRequest) {
	const auth = await getAuthSession(request);
	if (!auth) return ApiResponse.unauthorized();
	if (!hasRole(auth.role as UserRole, 'ADMIN')) return ApiResponse.forbidden();

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
