import type { Match, MatchStatusResult } from '@/src/types/match';

export function getStatusFromMatch(match: Match): MatchStatusResult {
	if (match.gamesDrawn) return { label: 'Draw', color: 'primary' };
	const winningPlayerId = match.winningPlayer ?? null;
	if (!winningPlayerId) return { label: 'Score not reported', color: 'warning' };
	if (match.isBye) return { label: 'Bye', color: 'secondary' };
	if (match.isLoss) return { label: 'Loss', color: 'error' };
	if (match.isIntentionalDraw) return { label: 'Intentional Draw', color: 'primary' };
	if (match.isUnintentionalDraw) return { label: 'Unintentional Draw', color: 'primary' };
	if (match.reportsInConflict) return { label: 'Conflict in reports', color: 'error' };

	switch (match.status) {
		case 'SCHEDULED':
			return { label: 'Scheduled', color: 'default' };
		case 'IN_PROGRESS':
			return { label: 'In Progress', color: 'info' };
		case 'COMPLETE':
			return { label: 'Completed', color: 'success' };
		case 'CANCELLED':
			return { label: 'Cancelled', color: 'error' };
		default:
			return { label: 'Unknown status', color: 'warning' };
	}
}

export function showScoreFromMatch(match: Match): string {
	if (match.gamesDrawn) return `${match.gamesWonByLoser} - ${match.gamesWonByWinner}`;
	const winningPlayerId = match.winningPlayer ?? null;
	if (!winningPlayerId) return '0 - 0';
	if (winningPlayerId === match.playerMatchRelationships[0]?.player.id) {
		return `${match.gamesWonByWinner} - ${match.gamesWonByLoser}`;
	}
	return `${match.gamesWonByLoser} - ${match.gamesWonByWinner}`;
}
