import { NextRequest } from 'next/server';
import { ScoutingService } from '@/src/services/ScoutingService';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { Reporter } from '@/src/services/ScoutingService';

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
			const isMember = await GroupRepository.isMember(requestedGroupId, auth.userId);

			if (isMember) {
				const hasGroupTournament = await GroupTournamentRepository.hasAccess(requestedGroupId, round.tournamentId);
				if (!hasGroupTournament) return ApiResponse.forbidden('Accès refusé à ce tournoi de groupe');
				resolvedGroupId = requestedGroupId;
			} else {
				// L'utilisateur n'est pas membre du groupe — vérifier s'il a un accès invité accepté
				const guestAccess = await TournamentExternalAccessRepository.findAcceptedForUser(
					auth.userId,
					round.tournamentId,
					requestedGroupId,
				);
				if (!guestAccess) return ApiResponse.forbidden('Accès refusé à ce tournoi de groupe');
				resolvedGroupId = requestedGroupId;
			}
		}

		const scope = resolvedGroupId ? { groupId: resolvedGroupId } : { userId: auth.userId };
		const reporter: Reporter = { userId: auth.userId };
		const result = await ScoutingService.assignDecks(Number(roundId), Number(matchId), decks, scope, reporter);
		return ApiResponse.ok(result);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Round not found' || msg === 'Match not found') return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}
