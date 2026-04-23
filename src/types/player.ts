import type { Deck } from './ink';

export interface Player {
	id: number;
	bestIdentifier: string;
	pronouns: string | null;
	profilePictureUrl: string | null;
}

export interface UserEventStatus {
	id: number;
	bestIdentifier: string;
	registrationStatus: string;
	matchesWon: number;
	matchesLost: number;
	matchesDrawn: number;
	totalMatchPoints: number;
	user?: Player;
}

export interface PlayerMatchRelationship {
	playerOrder: 1 | 2;
	player: Player;
	userEventStatus: UserEventStatus;
}

export interface PlayerDeck {
	playerId: number;
	bestIdentifier: string;
	pronouns: string | null;
	profilePictureUrl: string | null;
	decks: Deck[];
}

export interface TournamentPlayersDeck {
	tournamentId: number;
	players: PlayerDeck[];
}
