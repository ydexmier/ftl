import type { PlayerMatchRelationship } from './player';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED';

export interface Match {
	id: number;
	tableNumber: number;
	order: number;
	status: MatchStatus;
	podNumber: number | null;
	isBye: boolean;
	isIntentionalDraw: boolean;
	isUnintentionalDraw: boolean;
	isLoss: boolean;
	reportsInConflict: boolean;
	gamesDrawn: number | null;
	gamesWonByWinner: number | null;
	gamesWonByLoser: number | null;
	isGhostMatch: boolean;
	isFeatureMatch: boolean;
	deckCheckStarted: boolean;
	deckCheckCompleted: boolean;
	timeExtensionSeconds: number;
	tournamentRound: number;
	winningPlayer: number | null;
	reportingPlayer: number | null;
	assignedJudge: unknown | null;
	players: number[];
	playerMatchRelationships: PlayerMatchRelationship[];
	createdAt: string;
	updatedAt: string;
}

export interface MatchStatusResult {
	label: string;
	color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}
