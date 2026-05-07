import type { Deck } from './ink';

export interface Player {
	id: number;
	best_identifier: string;
	pronouns: string | null;
	game_user_profile_picture_url: string | null;
}

export interface UserEventStatus {
	id: number;
	best_identifier: string;
	registration_status: string;
	matches_won: number;
	matches_lost: number;
	matches_drawn: number;
	total_match_points: number;
	user?: Player;
}

export interface PlayerMatchRelationship {
	player_order: 1 | 2;
	player: Player;
	user_event_status: UserEventStatus;
}

export interface PlayerDeck {
	playerId: number;
	best_identifier: string;
	pronouns: string | null;
	game_user_profile_picture_url: string | null;
	decks: Deck[];
}

export interface TournamentPlayersDeck {
	tournamentId: number;
	groupId?: string | null;
	userId?: string | null;
	players: PlayerDeck[];
}
