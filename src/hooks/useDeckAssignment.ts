import { apiFetch } from '@/src/lib/api/apiFetch';
import type { DeckAssignment, PlayersDecksMap } from '@/src/domain/rules/scoutingRules';
import type { Match } from '@/src/types/match';

export interface AssignDecksResult {
	matchs: Match[];
	playersDecks: PlayersDecksMap;
}

export function useDeckAssignment(roundId: number, groupId?: string | null) {
	const assignDecks = async (matchId: number, assignments: DeckAssignment[]): Promise<AssignDecksResult> => {
		const response = await apiFetch(`/api/rounds/${roundId}/matchs/${matchId}/assign_deck`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ decks: assignments, groupId: groupId ?? null }),
		});
		return response.json();
	};

	return { assignDecks };
}
