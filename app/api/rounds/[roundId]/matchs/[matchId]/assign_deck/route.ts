import { NextRequest } from 'next/server';
import { ScoutingService } from '@/src/services/ScoutingService';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { getGuestSession, GUEST_COOKIE } from '@/src/lib/auth/guestSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import type { Reporter } from '@/src/services/ScoutingService';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
	try {
		// Rejet rapide si aucun cookie présent (évite des appels DB inutiles)
		const hasSessionCookie = request.cookies.get('session')?.value;
		const hasGuestCookie = request.cookies.get(GUEST_COOKIE)?.value;
		if (!hasSessionCookie && !hasGuestCookie) return ApiResponse.unauthorized();

		const { roundId, matchId } = await params;
		const { decks, groupId: requestedGroupId } = await request.json();

		// ─── Session invité ─────────────────────────────────────────────────────
		const guest = await getGuestSession(request);
		if (guest) {
			if (requestedGroupId && requestedGroupId !== guest.groupId) {
				return ApiResponse.forbidden('Accès refusé à ce groupe');
			}
			const scope = { groupId: guest.groupId };
			const reporter: Reporter = { guestAccessId: guest.accessId, guestDisplayName: guest.displayName };
			const result = await ScoutingService.assignDecks(Number(roundId), Number(matchId), decks, scope, reporter);
			return ApiResponse.ok(result);
		}

		// ─── Session utilisateur ────────────────────────────────────────────────
		const auth = await getAuthSession(request);
		if (!auth) return ApiResponse.unauthorized();

		const round = await RoundRepository.findById(Number(roundId));
		if (!round) return ApiResponse.notFound('Round not found');

		let resolvedGroupId: string | null = null;
		if (requestedGroupId) {
			const isMember = await GroupRepository.isMember(requestedGroupId, auth.userId);
			const hasGroupTournament = await GroupTournamentRepository.hasAccess(requestedGroupId, round.tournamentId);
			if (!isMember || !hasGroupTournament) return ApiResponse.forbidden('Accès refusé à ce tournoi de groupe');
			resolvedGroupId = requestedGroupId;
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
