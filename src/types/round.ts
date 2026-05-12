import type { Match } from './match';
import type { PlayersDecksMap } from '@/src/domain/rules/scoutingRules';

export type RoundType =
	| 'SWISS'
	| 'ELIMINATION'
	| 'RANKED_SINGLE_ELIMINATION'
	| 'FINAL'
	| 'PLAY_VS_OPPONENT';

export interface RoundRef {
	id: number;
	round_number: number;
	final_round_in_event: boolean;
	pairings_status: string;
	standings_status: string;
	round_type: RoundType;
	status: string;
}

export interface Round {
	id: number;
	tournamentId: number;
	results: Match[];
	createdAt: string;
	updatedAt: string;
}

export interface PaginationMeta {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
}

export interface PaginatedMatches {
	results: Match[];
	pagination: PaginationMeta;
	playersDecks: PlayersDecksMap | null;
	lastFetchedAt?: string | null;
	updatedAt?: string;
}
