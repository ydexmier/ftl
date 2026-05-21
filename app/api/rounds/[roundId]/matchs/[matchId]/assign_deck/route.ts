import { NextRequest } from 'next/server';
import { ScoutingService } from '@/src/services/ScoutingService';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const auth = await getAuthSession(request);
		if (!auth) return ApiResponse.unauthorized();

		const { roundId, matchId } = await params;
		const { decks, groupId: requestedGroupId } = await request.json();

		const round = await RoundRepository.findById(Number(roundId));
		if (!round) return ApiResponse.notFound('Round not found');

		let resolvedGroupId: string | null = null;

		if (requestedGroupId) {
			// Scope groupe explicite : valider l'accès
			const isMember = await GroupRepository.isMember(requestedGroupId, auth.userId);
			const hasGroupTournament = await GroupTournamentRepository.hasAccess(requestedGroupId, round.tournamentId);

			if (!isMember || !hasGroupTournament) {
				const externalAccess = await TournamentExternalAccessRepository.hasActiveAccess(
					auth.userId,
					requestedGroupId,
					round.tournamentId,
				);
				if (!externalAccess) return ApiResponse.forbidden('Accès refusé à ce tournoi de groupe');
			}
			resolvedGroupId = requestedGroupId;
		}

		const scope = resolvedGroupId ? { groupId: resolvedGroupId } : { userId: auth.userId };
		const result = await ScoutingService.assignDecks(Number(roundId), Number(matchId), decks, scope, auth.userId);
		return ApiResponse.ok(result);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Round not found' || msg === 'Match not found') return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}
