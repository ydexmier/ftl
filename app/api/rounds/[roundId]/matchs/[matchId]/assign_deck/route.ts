import { NextRequest, NextResponse } from 'next/server';
import { ScoutingService } from '@/src/services/ScoutingService';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const auth = await getAuthSession(request);
		if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

		const { roundId, matchId } = await params;
		const { decks, groupId } = await request.json();

		// Validate group access if a groupId is provided
		if (groupId) {
			const round = await RoundRepository.findById(Number(roundId));
			if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

			const isMember = await GroupRepository.isMember(groupId, auth.userId);
			const hasGroupTournament = await GroupTournamentRepository.hasAccess(groupId, round.tournamentId);

			if (!isMember || !hasGroupTournament) {
				// Check external access as fallback
				const externalAccess = await TournamentExternalAccessRepository.hasActiveAccess(
					auth.userId,
					groupId,
					round.tournamentId,
				);
				if (!externalAccess) {
					return NextResponse.json({ error: 'Accès refusé à ce tournoi de groupe' }, { status: 403 });
				}
			}
		}

		const scope = groupId ? { groupId } : { userId: auth.userId };
		const result = await ScoutingService.assignDecks(Number(roundId), Number(matchId), decks, scope);
		return NextResponse.json(result);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Round not found' || msg === 'Match not found') {
			return NextResponse.json({ error: msg }, { status: 404 });
		}
		console.error(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
