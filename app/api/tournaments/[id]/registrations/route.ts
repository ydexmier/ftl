import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { ApiResponse } from '@/src/lib/api/responses';
import { RegistrationService } from '@/src/services/RegistrationService';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
	const auth = await getAuthSession(req);
	if (!auth) return ApiResponse.unauthorized();

	const { id } = await params;
	const tournamentId = Number(id);
	if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

	try {
		const status = await RegistrationService.getStatus(tournamentId);
		return ApiResponse.ok(status);
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}

export async function POST(req: NextRequest, { params }: Params) {
	const auth = await getAuthSession(req);
	if (!auth) return ApiResponse.unauthorized();

	const { id } = await params;
	const tournamentId = Number(id);
	if (isNaN(tournamentId)) return ApiResponse.badRequest('ID de tournoi invalide');

	try {
		const status = await RegistrationService.getStatus(tournamentId);
		if (status.tournamentStarted) {
			return ApiResponse.forbidden('Le tournoi a déjà commencé');
		}

		const result = await RegistrationService.fetchAndSave(tournamentId);

		// Populate caller's personal scope so PlayersTab shows immediately
		const playerInfos = result.players.map(RegistrationService.toPlayerInfo);
		await TournamentPlayersDeckRepository.upsertMissingPlayers(tournamentId, playerInfos, {
			userId: auth.userId,
		});

		return ApiResponse.ok({ totalCount: result.totalCount });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
