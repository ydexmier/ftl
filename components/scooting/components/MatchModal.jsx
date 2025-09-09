import React, { useState, useReducer, useEffect, useMemo } from 'react';

import { Modal, Typography, Box, Button, Stack, Chip, Grid, Divider } from '@mui/material';
import InkButton, { types } from '@components/InkButton';
import DeckButton from '@components/DeckButton';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

const initialState = {
	combination1: { inks: [], playerId: null,status: 'inks_selection' },
	combination2: { inks: [], playerId: null,status: 'inks_selection' },
};

function reducer(state, action) {
	switch (action.type) {
		case 'SELECT_INK': {
			const { combo, ink } = action;
			const current = state[combo].inks;
			if (current.includes(ink)) {
				return { ...state, [combo]: { ...state[combo], inks: current.filter((i) => i !== ink) } };
			}
			return { ...state, [combo]: { ...state[combo], inks: [...current, ink] } };
		}
		case 'SELECT_DECK': {
			const { combo, inks } = action;
			return { ...state, [combo]: { ...state[combo], inks, status: 'inks_selection' } };
		}
		case 'ASSIGN_PLAYER': {
			const { combo, playerId, otherPlayId } = action;
			const otherCombo = combo === 'combination1' ? 'combination2' : 'combination1';
			return {
				...state,
				[combo]: { ...state[combo], playerId, status: 'inks_selection' },
				[otherCombo]: { ...state[otherCombo], playerId: otherPlayId, status: 'inks_selection' },
			};
		}
		case 'INITIALIZE_COMBINATION': {
			const { combo, inks, playerId, status } = action;
			return { ...state, [combo]: { ...state[combo], inks, playerId, status } };
		}
		case 'RESET':
			return initialState;
		default:
			return state;
	}
}

const MatchModal = ({ match, open, onClose, onValidate, combinationsInitial }) => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const getOtherPlayer = (playerId) => {
		return playerId === match.player_match_relationships[0].player.id
				? match.player_match_relationships[1].player
				: match.player_match_relationships[0].player;
	}
	const onAssignPlayer = (combo, playerId) => () => {
		const otherPlay = getOtherPlayer(playerId)
		dispatch({ type: 'ASSIGN_PLAYER', combo, playerId, otherPlayId: otherPlay.id });
	};
	
	const handleCancel = () => {
		dispatch({ type: 'RESET' });
		onClose();
	};

	const handleValidate = () => {
		onValidate(state); // tu renvoies le state complet au parent
		onClose();
	};

	const getPlayerNameById = (id) => {
		const relationship = match.player_match_relationships.find((rel) => rel.player.id === id);
		return relationship
			? `${relationship.player.best_identifier} "${relationship.user_event_status.best_identifier}"`
			: 'Non assigné';
	};

	const renderInkSelectionButton = (combination) => {
		const { status, inks } = state[combination];
		if (status === 'deck_selection') {
			return inks.map((deckInk) => (
				<DeckButton
					key={combination + '_' + deckInk.join('-')}
					inks={deckInk}
					onClick={(deck) => dispatch({ type: 'SELECT_DECK', combo: combination, inks: deck.flat() })}
				/>
			));
		}
		return types.map((type) => (
			<InkButton
				isSelected={inks.flat().includes(type)}
				key={type}
				type={type}
				onClick={() => dispatch({ type: 'SELECT_INK', combo: combination, ink: type })}
			/>
		));
	};

	const enableValidateButton = useMemo(() => {
		const {combination1, combination2} = state;
		let combination1Valid = false;
		let combination2Valid = false;
		if(combination1.status === "inks_selection"){
			combination1Valid = combination1.inks.length === 2;
		}
		if(combination2.status === "inks_selection"){
			combination2Valid = combination2.inks.length === 2;
		}
		
		return combination1Valid && combination2Valid
	}, [state.combination1, state.combination2])

	useEffect(() => {
		if (combinationsInitial) {
			let player2 = combinationsInitial[0]?.playerId && getOtherPlayer(combinationsInitial[0].playerId);
			let player1 = combinationsInitial[1]?.playerId && getOtherPlayer(combinationsInitial[1].playerId);
			if (combinationsInitial[0]) {
				// première combinaison existe
				const isDeckSelection = combinationsInitial[0].inks.length === 2;
				let otherPlayer = null;
				if (combinationsInitial[0].playerId) {
					otherPlayer = getOtherPlayer(combinationsInitial[0].playerId);
				}
				dispatch({
					type: 'INITIALIZE_COMBINATION',
					combo: 'combination1',
					status: isDeckSelection ? 'deck_selection' : 'inks_selection',
					inks: isDeckSelection ? combinationsInitial[0].inks :combinationsInitial[0].inks.flat(),
					playerId: combinationsInitial[0].playerId || null,
				});
				player2 && onAssignPlayer('combination2',player2.id)();
			}
			if (combinationsInitial[1]) {
				// deuxième combinaison existe
				const isDeckSelection = combinationsInitial[1].inks.length === 2;
				dispatch({
					type: 'INITIALIZE_COMBINATION',
					combo: 'combination2',
					status: isDeckSelection ? 'deck_selection' : 'inks_selection',
					inks: isDeckSelection ? combinationsInitial[1].inks : combinationsInitial[1].inks.flat(),
					playerId: combinationsInitial[1].playerId || null,
				});
				player1 && onAssignPlayer('combination1',player1.id);

			}
		}
	}, [combinationsInitial, match]);

	useEffect(() => {
		if (!open) {
			dispatch({ type: 'RESET' });
		}
	}, [open]);

	if (!match) return null;
	return (
		<Modal open={open} onClose={onClose}>
			<Box sx={style}>
				<Typography variant="h6">
					<Grid
						container
						direction="row"
						sx={{
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						Match settings
						<Chip color="info" label={`Table ${match.table_number}`} />
					</Grid>
				</Typography>
				<Divider sx={{ my: 4 }} />
				{/* Combinaison 1 */}
				<Grid
					container
					direction="row"
					sx={{
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					Combinaison 1:
					<Chip
						size="small"
						color={state.combination1.playerId ? 'success' : 'default'}
						label={getPlayerNameById(state.combination1.playerId)}
					/>
				</Grid>
				<br />
				{renderInkSelectionButton('combination1')}
				<div>
					<Button onClick={onAssignPlayer('combination1', match.player_match_relationships[0].player.id)}>
						Assigner à {match.player_match_relationships[0].player.best_identifier}
					</Button>
					<Button onClick={onAssignPlayer('combination1', match.player_match_relationships[1].player.id)}>
						Assigner à {match.player_match_relationships[1].player.best_identifier}
					</Button>
				</div>
				<Divider sx={{ my: 2 }} />
				{/* Combinaison 2 */}
				<Grid
					container
					direction="row"
					sx={{
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					Combinaison 2:
					<Chip
						size="small"
						color={state.combination2.playerId ? 'success' : 'default'}
						label={getPlayerNameById(state.combination2.playerId)}
					/>
				</Grid>
				<br />
				{renderInkSelectionButton('combination2')}
				<div>
					<Button onClick={onAssignPlayer('combination2', match.player_match_relationships[0].player.id)}>
						Assigner à {match.player_match_relationships[0].player.best_identifier}
					</Button>
					<Button onClick={onAssignPlayer('combination2', match.player_match_relationships[1].player.id)}>
						Assigner à {match.player_match_relationships[1].player.best_identifier}
					</Button>
				</div>
				<Divider sx={{ my: 2 }} />
				{/* Boutons d’action */}
				<Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
					<Button variant="outlined" onClick={handleCancel}>
						Annuler
					</Button>
					<Button disabled={!enableValidateButton}color="success" variant="contained" onClick={handleValidate}>
						Valider
					</Button>
				</Stack>
			</Box>
		</Modal>
	);
};

export default MatchModal;
