'use client';
import { useReducer } from 'react';

export interface CombinationState {
	decks: string[][];
	playerId: number | null;
}

export interface MatchModalState {
	combination1: CombinationState;
	combination2: CombinationState;
}

export type MatchModalAction =
	| { type: 'SELECT_INK'; combo: 'combination1' | 'combination2'; ink: string }
	| { type: 'SELECT_DECK'; combo: 'combination1' | 'combination2'; deck: string[] }
	| { type: 'ASSIGN_PLAYER'; combo: 'combination1' | 'combination2'; playerId: number; otherPlayId: number }
	| { type: 'UNASSIGN_PLAYER'; combo: 'combination1' | 'combination2' }
	| { type: 'COPY_DECKS'; combo: 'combination1' | 'combination2' }
	| { type: 'INITIALIZE_COMBINATION'; combo: 'combination1' | 'combination2'; decks: string[][]; playerId: number | null }
	| { type: 'RESET' };

export const matchModalInitialState: MatchModalState = {
	combination1: { decks: [], playerId: null },
	combination2: { decks: [], playerId: null },
};

export function matchModalReducer(state: MatchModalState, action: MatchModalAction): MatchModalState {
	switch (action.type) {
		case 'SELECT_INK': {
			const { combo, ink } = action;
			const current = state[combo].decks.at(0) ?? [];
			const next = current.includes(ink) ? current.filter((i) => i !== ink) : [...current, ink];
			return { ...state, [combo]: { ...state[combo], decks: [next] } };
		}
		case 'SELECT_DECK':
			return { ...state, [action.combo]: { ...state[action.combo], decks: [action.deck] } };
		case 'ASSIGN_PLAYER': {
			const other = action.combo === 'combination1' ? 'combination2' : 'combination1';
			return {
				...state,
				[action.combo]: { ...state[action.combo], playerId: action.playerId },
				[other]: { ...state[other], playerId: action.otherPlayId },
			};
		}
		case 'UNASSIGN_PLAYER':
			return { ...state, [action.combo]: { ...state[action.combo], playerId: null } };
		case 'COPY_DECKS': {
			const other = action.combo === 'combination1' ? 'combination2' : 'combination1';
			return { ...state, [other]: { ...state[other], decks: state[action.combo].decks } };
		}
		case 'INITIALIZE_COMBINATION':
			return { ...state, [action.combo]: { decks: action.decks, playerId: action.playerId } };
		case 'RESET':
			return matchModalInitialState;
		default:
			return state;
	}
}

export function useMatchState() {
	return useReducer(matchModalReducer, matchModalInitialState);
}
