import type { Match } from './match';

export type RoundType =
	| 'SWISS'
	| 'ELIMINATION'
	| 'RANKED_SINGLE_ELIMINATION'
	| 'FINAL'
	| 'PLAY_VS_OPPONENT';

export interface RoundRef {
	id: number;
	roundNumber: number;
	finalRoundInEvent: boolean;
	pairingsStatus: string;
	standingsStatus: string;
	roundType: RoundType;
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
}
