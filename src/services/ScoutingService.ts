import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { Deck } from '@/src/types/ink';

export interface PlayerDecksEntry {
	playerId: number;
	decks: Deck[];
	[key: string]: unknown;
}

export interface PlayersDecksMap {
	tournamentId?: number;
	players: PlayerDecksEntry[];
}

export interface DeckAssignment {
	playerId: number;
	decks: Deck[];
}

// --- Pure functions (extracted from useRound.js) ---

export function getPlayerDecksInk(playersDecks: PlayersDecksMap, playerId: number): Deck[] {
	return playersDecks.players.find((p) => p.playerId === playerId)?.decks ?? [];
}

export function getMatchPlayerInks(
	match: { player_match_relationships: { player: { id: number } }[] },
	playersDecks: PlayersDecksMap,
): PlayerDecksEntry[] | undefined {
	const inks = match.player_match_relationships
		.map((pmr) => playersDecks.players.find((p) => p.playerId === pmr.player.id))
		.filter((p): p is PlayerDecksEntry => p !== undefined);
	return inks.length ? inks : undefined;
}

export function mergePlayersDecks(current: PlayersDecksMap, updated: PlayersDecksMap): PlayersDecksMap {
	if (!current || !Array.isArray(current.players)) return current;

	const updatedById: Record<number, PlayerDecksEntry> = {};
	(updated?.players ?? []).forEach((p) => {
		updatedById[p.playerId] = p;
	});

	const mergedPlayers = current.players.reduce<PlayerDecksEntry[]>((acc, player) => {
		const up = updatedById[player.playerId];
		if (up?.decks.length === 0) return acc;
		acc.push(up ? { ...player, ...up } : player);
		return acc;
	}, []);

	const existingIds = new Set(current.players.map((p) => p.playerId));
	const newPlayers = (updated?.players ?? []).filter((p) => !existingIds.has(p.playerId));

	return { ...current, players: [...mergedPlayers, ...newPlayers] };
}

// --- Mutation ---

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
