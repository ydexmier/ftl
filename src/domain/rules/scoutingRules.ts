import type { Deck } from '@/src/types/ink';

export interface DeckAssignment {
	playerId: number;
	decks: Deck[];
	comment?: string;
}

export interface PlayerDecksEntry {
	playerId: number;
	decks: Deck[];
	[key: string]: unknown;
}

export interface PlayersDecksMap {
	tournamentId?: number;
	players: PlayerDecksEntry[];
}

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

export function deduplicateDecks(decks: Deck[]): Deck[] {
	return decks.filter((deck, i) =>
		decks.findIndex((d) => JSON.stringify(d) === JSON.stringify(deck)) === i,
	);
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
