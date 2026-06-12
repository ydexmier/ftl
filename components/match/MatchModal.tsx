'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react';

import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import InkButton, { types } from '@components/ui/InkButton';
import DeckSelection from '@components/ui/DeckSelection';
import { useMatchState } from '@/src/hooks/useMatchState';
import { deduplicateDecks } from '@/src/domain/rules/scoutingRules';
import type { Deck } from '@/src/types/ink';
import type { Match } from '@/src/types/match';

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
	const [state, dispatch] = useMatchState();
	const [comments, setComments] = useState({ combination1: '', combination2: '' });
	const [blinking, setBlinking] = useState({ combination1: false, combination2: false });
	const [isValidating, setIsValidating] = useState(false);

	const triggerBlink = (combo: 'combination1' | 'combination2') => {
		setBlinking((prev) => ({ ...prev, [combo]: true }));
		setTimeout(() => setBlinking((prev) => ({ ...prev, [combo]: false })), 1000);
	};

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

	const handleCancel = () => {
		if (isValidating) return;
		dispatch({ type: 'RESET' });
		setComments({ combination1: '', combination2: '' });
		onClose();
	};

	const handleValidate = async () => {
		const { combination1, combination2 } = state;
		const dataToSend: Record<string, unknown> = {};
		if ([combination1, combination2].every((d) => !d.playerId)) {
			const mergedDecks = deduplicateDecks([...combination1.decks, ...combination2.decks] as Deck[]);
			dataToSend.combination1 = {
				...combination1,
				decks: mergedDecks,
				playerId: match!.player_match_relationships[0].player.id,
				comment: comments.combination1.trim() || undefined,
			};
			if (match!.player_match_relationships.length > 1) {
				dataToSend.combination2 = {
					...combination2,
					decks: mergedDecks,
					playerId: match!.player_match_relationships[1].player.id,
					comment: comments.combination2.trim() || undefined,
				};
			}
		} else {
			dataToSend.combination1 = {
				...combination1,
				comment: comments.combination1.trim() || undefined,
			};
			dataToSend.combination2 = {
				...combination2,
				comment: comments.combination2.trim() || undefined,
			};
		}
		setIsValidating(true);
		try {
			await onValidate(dataToSend);
		} catch {
			// Erreur API : on ré-active le bouton, la modale reste ouverte
			setIsValidating(false);
		}
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
			<div data-testid={`ink-selection-${combo}`} className="flex flex-wrap gap-1">
				{types.map((type) => {
					const flat = decks.flat();
					const inactive = flat.length >= 2 && !flat.includes(type);
					return (
						<InkButton
							key={type}
							type={type}
							isSelected={flat.includes(type)}
							isInactive={inactive}
							isBlinking={blinking[combo] && flat.includes(type)}
							onClick={() => {
								if (inactive) { triggerBlink(combo); return; }
								dispatch({ type: 'SELECT_INK', combo, ink: type });
							}}
						/>
					);
				})}
			</div>
		);
	};

	const renderCommentInput = (combo: 'combination1' | 'combination2') => {
		const currentDecks = state[combo].decks.flat();
		const placeholder = currentDecks.length > 0
			? `Note sur ${currentDecks.join(' + ')}…`
			: 'Note (optionnel)…';
		const charCount = comments[combo].length;
		return (
			<div className="space-y-1">
				<textarea
					value={comments[combo]}
					onChange={(e) => setComments((prev) => ({ ...prev, [combo]: e.target.value.slice(0, 500) }))}
					placeholder={placeholder}
					rows={2}
					className={[
						'w-full resize-none rounded-lg border bg-background px-3 py-2',
						'text-sm text-foreground placeholder:text-muted-foreground',
						'border-border focus:border-white/40 focus:outline-none transition-colors',
					].join(' ')}
				/>
				{charCount > 0 && (
					<p className={['text-xs text-right', charCount > 450 ? 'text-amber-400' : 'text-muted-foreground'].join(' ')}>
						{charCount}/500
					</p>
				)}
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
			const c1HasDecks = c1.decks.length > 0;
			dispatch({ type: 'INITIALIZE_COMBINATION', combo: 'combination1', decks: c1.decks, playerId: c1HasDecks ? c1.playerId : null });
			const p2 = c1HasDecks && c1.playerId ? getOtherPlayer(c1.playerId) : null;
			if (p2) onAssignPlayer('combination2', p2.id)();
		}
		if (c2) {
			dispatch({ type: 'INITIALIZE_COMBINATION', combo: 'combination2', decks: c2.decks, playerId: c2.decks.length > 0 ? c2.playerId : null });
		}
	}, [combinationsInitial, match]);

	useEffect(() => {
		if (!open) {
			dispatch({ type: 'RESET' });
			setComments({ combination1: '', combination2: '' });
			setIsValidating(false);
		}
	}, [open]);

	if (!match || !open) return null;

	const [p1, p2] = match.player_match_relationships;

	return (
		<div
			data-testid="match-modal"
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
			onClick={isValidating ? undefined : handleCancel}
		>
			<div
				className="w-full sm:max-w-md sm:mx-4 bg-card border border-border rounded-t-2xl sm:rounded-xl flex flex-col shadow-xl max-h-[90svh] sm:max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Poignée de drag (mobile uniquement) */}
				<div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0" aria-hidden>
					<div className="w-10 h-1 rounded-full bg-border/80" />
				</div>

				{/* Header sticky */}
				<div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border shrink-0">
					<Button variant="outline" size="sm" onClick={() => dispatch({ type: 'RESET' })}>
						Réinitialiser
					</Button>
					<Badge color="info" label={`Table ${match.table_number}`} />
					<button
						type="button"
						onClick={handleCancel}
						className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						aria-label="Fermer"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Contenu scrollable */}
				<div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 flex flex-col gap-4">

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
							<div className="flex flex-row flex-wrap gap-2">
								{[p1, p2].map((p) => {
									const active = state.combination1.playerId === p.player.id;
									const pseudo = p.user_event_status?.best_identifier;
									return (
										<Button
											key={p.player.id}
											variant={active ? 'outline' : 'ghost'}
											size="sm"
											onClick={onAssignPlayer('combination1', p.player.id)}
											className={`flex-1${active ? ' border-primary/50 bg-primary/10 text-primary' : ''}`}
										>
											{active && <Check className="h-3.5 w-3.5 shrink-0" />}
											<span className="flex flex-col items-start text-left min-w-0">
												<span className="truncate">{p.player.best_identifier}</span>
												{pseudo && <span className="text-xs font-normal opacity-60 truncate">{pseudo}</span>}
											</span>
										</Button>
									);
								})}
								{state.combination1.playerId && (
									<button
										type="button"
										onClick={() => dispatch({ type: 'UNASSIGN_PLAYER', combo: 'combination1' })}
										className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
										title="Annuler l'association"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
						)}
						{renderCommentInput('combination1')}
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
								<div className="flex flex-row flex-wrap gap-2">
									{[p1, p2].map((p) => {
										const active = state.combination2.playerId === p.player.id;
										const pseudo = p.user_event_status?.best_identifier;
										return (
											<Button
												key={p.player.id}
												variant={active ? 'outline' : 'ghost'}
												size="sm"
												onClick={onAssignPlayer('combination2', p.player.id)}
												className={`flex-1${active ? ' border-primary/50 bg-primary/10 text-primary' : ''}`}
											>
												{active && <Check className="h-3.5 w-3.5 shrink-0" />}
												<span className="flex flex-col items-start text-left min-w-0">
													<span className="truncate">{p.player.best_identifier}</span>
													{pseudo && <span className="text-xs font-normal opacity-60 truncate">{pseudo}</span>}
												</span>
											</Button>
										);
									})}
									{state.combination2.playerId && (
										<button
											type="button"
											onClick={() => dispatch({ type: 'UNASSIGN_PLAYER', combo: 'combination2' })}
											className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
											title="Annuler l'association"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
								{renderCommentInput('combination2')}
							</div>
						</>
					)}

				</div>

				{/* Footer sticky */}
				<div className="shrink-0 border-t border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-row gap-2">
					<Button variant="outline" onClick={handleCancel} disabled={isValidating} className="flex-1 sm:flex-none sm:w-auto">Annuler</Button>
					<Button variant="success" loading={isValidating} onClick={handleValidate} className="flex-1 sm:flex-none sm:w-auto">Valider</Button>
				</div>
			</div>
		</div>
	);
};

export default MatchModal;
