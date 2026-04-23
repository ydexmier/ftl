export interface RankingPlayer {
	id: number;
	bestIdentifier: string;
}

export interface RankingUserEventStatus {
	id: number;
	matchesWon: number;
	matchesDrawn: number;
	matchesLost: number;
	totalMatchPoints: number;
	fullProfilePictureUrl: string | null;
	registrationStatus: string;
	bestIdentifier: string;
}

export interface RankingEntry {
	rank: number;
	player: RankingPlayer;
	userEventStatus: RankingUserEventStatus;
	record: string;
	matchRecord: string;
	matchPoints: number;
	opponentMatchWinPercentage: number;
	opponentGameWinPercentage: number;
}

export interface Ranking {
	idTournament: number;
	pageSize: number;
	count: number;
	total: number;
	currentPageNumber: number;
	nextPageNumber: number | null;
	previousPageNumber: number | null;
	results: RankingEntry[];
}
