import type { DeckAssignment, PlayersDecksMap } from '@/src/domain/rules/scoutingRules';
import type { Match } from '@/src/types/match';

export interface AssignDecksResult {
	matchs: Match[];
	playersDecks: PlayersDecksMap;
}

export function useDeckAssignment(roundId: number) {
	const assignDecks = async (matchId: number, assignments: DeckAssignment[]): Promise<AssignDecksResult> => {
		const response = await fetch(`/api/rounds/${roundId}/matchs/${matchId}/assign_deck`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ decks: assignments }),
		});
		if (!response.ok) throw new Error('Network error');
		return response.json();
	};

	return { assignDecks };
}
