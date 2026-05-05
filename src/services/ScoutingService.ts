import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { DeckAssignment } from '@/src/domain/rules/scoutingRules';

export type { PlayerDecksEntry, PlayersDecksMap, DeckAssignment } from '@/src/domain/rules/scoutingRules';
export { getPlayerDecksInk, getMatchPlayerInks, mergePlayersDecks } from '@/src/domain/rules/scoutingRules';

export const ScoutingService = {
	async assignDecks(roundId: number, matchId: number, assignments: DeckAssignment[]) {
		const round = await RoundRepository.findById(roundId);
		if (!round) throw new Error('Round not found');

		const match = round.results?.find((m) => m.id === matchId);
		if (!match) throw new Error('Match not found');

		const fullAssignments = assignments.map(({ playerId, decks }) => {
			const pmr = match.player_match_relationships?.find((p) => p.player?.id === playerId);
			return {
				playerId,
				bestIdentifier: pmr?.player?.best_identifier ?? '',
				eventBestIdentifier: pmr?.user_event_status?.best_identifier ?? '',
				decks,
			};
		});

		const playersModified = await TournamentPlayersDeckRepository.assignDecks(
			round.tournamentId,
			fullAssignments,
		);

		return { matchs: round.results, playersDecks: { players: playersModified } };
	},
};
