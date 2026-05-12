import type { TournamentPhase } from '@/src/types/tournament';
import type { RoundRef } from '@/src/types/round';

export function getRoundName(phase: TournamentPhase, round: RoundRef): string {
	if (round.round_type === 'DECKBUILDING') return 'Round 0 — Construction du deck';
	switch (phase.round_type) {
		case 'SWISS':
			return `Round ${round.round_number}`;
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
