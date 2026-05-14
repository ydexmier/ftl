import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository, type DeckScope } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { ScoutingReportRepository } from '@/src/repositories/db/ScoutingReportRepository';
import type { DeckAssignment } from '@/src/domain/rules/scoutingRules';

export type { PlayerDecksEntry, PlayersDecksMap, DeckAssignment } from '@/src/domain/rules/scoutingRules';
export { getPlayerDecksInk, getMatchPlayerInks, mergePlayersDecks } from '@/src/domain/rules/scoutingRules';

export const ScoutingService = {
	async assignDecks(
		roundId: number,
		matchId: number,
		assignments: DeckAssignment[],
		scope: DeckScope,
		reporterUserId: string,
	) {
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
			scope,
		);

		// Log one report per player with non-empty deck assignment
		const reportsToLog = assignments
			.filter((a) => a.decks && a.decks.length > 0)
			.map((a) => ({
				userId: reporterUserId,
				groupId: scope.groupId ?? null,
				tournamentId: round.tournamentId,
				playerId: a.playerId,
			}));

		await ScoutingReportRepository.createMany(reportsToLog);

		return { matchs: round.results, playersDecks: { players: playersModified } };
	},
};
