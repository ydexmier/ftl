import type { TournamentPhase } from '@/src/types/tournament';
import type { RoundRef } from '@/src/types/round';

export function getRoundName(phase: TournamentPhase, round: RoundRef): string {
	switch (phase.roundType) {
		case 'SWISS':
			return `Round ${round.roundNumber}`;
		case 'ELIMINATION':
			return 'Éliminatoire';
		case 'RANKED_SINGLE_ELIMINATION': {
			const index = phase.rounds.findIndex((r) => r.id === round.id);
			return `Top ${Math.pow(2, phase.rounds.length - index)}`;
		}
		case 'FINAL':
			return 'Finale';
		default:
			return 'Inconnu';
	}
}
