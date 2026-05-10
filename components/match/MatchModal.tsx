'use client';
import { useReducer, useEffect } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import InkButton, { types } from '@components/ui/InkButton';
import DeckSelection from '@components/ui/DeckSelection';
import type { Match } from '@/src/types/match';

/* ─── State / Reducer (logique inchangée) ─────────────────────── */

interface CombinationState {
	decks: string[][];
	playerId: number | null;
}

interface ModalState {
	combination1: CombinationState;
	combination2: CombinationState;
}

type ModalAction =
	| { type: 'SELECT_INK'; combo: 'combination1' | 'combination2'; ink: string }
	| { type: 'SELECT_DECK'; combo: 'combination1' | 'combination2'; deck: string[] }
	| { type: 'ASSIGN_PLAYER'; combo: 'combination1' | 'combination2'; playerId: number; otherPlayId: number }
	| { type: 'COPY_DECKS'; combo: 'combination1' | 'combination2' }
	| { type: 'INITIALIZE_COMBINATION'; combo: 'combination1' | 'combination2'; decks: string[][]; playerId: number | null }
	| { type: 'RESET' };

const initialState: ModalState = {
	combination1: { decks: [], playerId: null },
	combination2: { decks: [], playerId: null },
};

function reducer(state: ModalState, action: ModalAction): ModalState {
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
		case 'COPY_DECKS': {
			const other = action.combo === 'combination1' ? 'combination2' : 'combination1';
			return { ...state, [other]: { ...state[other], decks: state[action.combo].decks } };
		}
		case 'INITIALIZE_COMBINATION':
			return { ...state, [action.combo]: { decks: action.decks, playerId: action.playerId } };
		case 'RESET':
			return initialState;
		default:
			return state;
	}
}

/* ─── Props ───────────────────────────────────────────────────── */

interface MatchModalProps {
	match: Match | null;
	open: boolean;
	onClose: () => void;
	onValidate: (data: unknown) => void | Promise<void>;
	combinationsInitial?: Array<{ decks: string[][]; playerId: number | null }> | null | false;
}

/* ─── Component ───────────────────────────────────────────────── */

const MatchModal = ({ match, open, onClose, onValidate, combinationsInitial }: MatchModalProps) => {
	const [state, dispatch] = useReducer(reducer, initialState);

	const getOtherPlayer = (playerId: number) => {
		if (!match || match.player_match_relationships.length < 2) return null;
		return playerId === match.player_match_relationships[0].player.id
			? match.player_match_relationships[1].player
			: match.player_match_relationships[0].player;
	};

	const onAssignPlayer = (combo: 'combination1' | 'combination2', playerId: number) => () => {
		const other = getOtherPlayer(playerId);
		if (other) dispatch({ type: 'ASSIGN_PLAYER', combo, playerId, otherPlayId: other.id });
	};

	const handleCancel = () => { dispatch({ type: 'RESET' }); onClose(); };

	const handleValidate = () => {
		const { combination1, combination2 } = state;
		const dataToSend: Record<string, unknown> = {};
		if ([combination1, combination2].every((d) => !d.playerId)) {
			dataToSend.combination1 = {
				...combination1,
				decks: [...combination1.decks, ...combination2.decks],
				playerId: match!.player_match_relationships[0].player.id,
			};
			if (match!.player_match_relationships.length > 1) {
				dataToSend.combination2 = {
					...combination2,
					decks: [...combination1.decks, ...combination2.decks],
					playerId: match!.player_match_relationships[1].player.id,
				};
			}
		} else {
			dataToSend.combination1 = combination1;
			dataToSend.combination2 = combination2;
		}
		onValidate(dataToSend);
	};

	const getPlayerNameById = (id: number | null) => {
		if (!match || !id) return 'Non assigné';
		const rel = match.player_match_relationships.find((r) => r.player.id === id);
		return rel
			? `${rel.player.best_identifier} "${rel.user_event_status.best_identifier}"`
			: 'Non assigné';
	};

	const renderInkSelection = (combo: 'combination1' | 'combination2') => {
		const { decks } = state[combo];
		if (decks.length > 1) {
			return (
				<div className="flex items-center gap-2">
					<div className="flex gap-1 flex-wrap">
						{decks.map((deckInk, i) => (
							<DeckSelection
								key={`${combo}_${i}`}
								inks={deckInk}
								onClick={(deck) => dispatch({ type: 'SELECT_DECK', combo, deck })}
							/>
						))}
					</div>
					<button
						type="button"
						onClick={() => dispatch({ type: 'COPY_DECKS', combo })}
						className="ml-auto p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
						title="Copier vers l'autre combinaison"
					>
						{combo === 'combination1' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
					</button>
				</div>
			);
		}
		return (
			<div className="flex flex-wrap gap-1">
				{types.map((type) => (
					<InkButton
						key={type}
						type={type}
						isSelected={decks.flat().includes(type)}
						onClick={() => dispatch({ type: 'SELECT_INK', combo, ink: type })}
					/>
				))}
			</div>
		);
	};

	useEffect(() => {
		if (!combinationsInitial) {
			if (match?.match_is_bye) {
				dispatch({
					type: 'INITIALIZE_COMBINATION',
					combo: 'combination1',
					decks: [],
					playerId: match.player_match_relationships[0].player.id,
				});
			}
			return;
		}
		const [c1, c2] = combinationsInitial;
		if (c1) {
			dispatch({ type: 'INITIALIZE_COMBINATION', combo: 'combination1', decks: c1.decks, playerId: c1.playerId ?? null });
			const p2 = c1.playerId ? getOtherPlayer(c1.playerId) : null;
			if (p2) onAssignPlayer('combination2', p2.id)();
		}
		if (c2) {
			dispatch({ type: 'INITIALIZE_COMBINATION', combo: 'combination2', decks: c2.decks, playerId: c2.playerId ?? null });
		}
	}, [combinationsInitial, match]);

	useEffect(() => {
		if (!open) dispatch({ type: 'RESET' });
	}, [open]);

	if (!match || !open) return null;

	const [p1, p2] = match.player_match_relationships;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 flex flex-col gap-4 shadow-xl max-h-[90vh] overflow-y-auto">

				{/* Header */}
				<div className="flex items-center justify-between">
					<Button variant="outline" size="sm" onClick={() => dispatch({ type: 'RESET' })}>
						Réinitialiser
					</Button>
					<Badge color="info" label={`Table ${match.table_number}`} />
				</div>

				<hr className="border-border" />

				{/* Combinaison 1 */}
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-foreground">Combinaison 1</span>
						<Badge
							color={state.combination1.playerId ? 'success' : 'default'}
							size="sm"
							label={getPlayerNameById(state.combination1.playerId)}
						/>
					</div>
					{renderInkSelection('combination1')}
					{!match.match_is_bye && (
						<div className="flex gap-2 flex-wrap">
							<Button variant="ghost" size="sm" onClick={onAssignPlayer('combination1', p1.player.id)}>
								Assigner à {p1.player.best_identifier}
							</Button>
							<Button variant="ghost" size="sm" onClick={onAssignPlayer('combination1', p2.player.id)}>
								Assigner à {p2.player.best_identifier}
							</Button>
						</div>
					)}
				</div>

				{/* Combinaison 2 */}
				{!match.match_is_bye && (
					<>
						<hr className="border-border" />
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-foreground">Combinaison 2</span>
								<Badge
									color={state.combination2.playerId ? 'success' : 'default'}
									size="sm"
									label={getPlayerNameById(state.combination2.playerId)}
								/>
							</div>
							{renderInkSelection('combination2')}
							<div className="flex gap-2 flex-wrap">
								<Button variant="ghost" size="sm" onClick={onAssignPlayer('combination2', p1.player.id)}>
									Assigner à {p1.player.best_identifier}
								</Button>
								<Button variant="ghost" size="sm" onClick={onAssignPlayer('combination2', p2.player.id)}>
									Assigner à {p2.player.best_identifier}
								</Button>
							</div>
						</div>
						<hr className="border-border" />
					</>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-2 mt-2">
					<Button variant="outline" onClick={handleCancel}>Annuler</Button>
					<Button variant="success" onClick={handleValidate}>Valider</Button>
				</div>
			</div>
		</div>
	);
};

export default MatchModal;
