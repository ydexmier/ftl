import { useState } from 'react';
import {
	Button,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Snackbar,
	Alert,
} from '@mui/material';

const DeleteTournamentButton = ({ tournamentId, onDeleted }) => {
	const [loading, setLoading] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const handleDelete = async () => {
		setLoading(true);
		setErrorMessage('');

		try {
			const response = await fetch('/api/admin/tournaments', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: tournamentId }),
			});
			setLoading(false);
			setConfirmOpen(false);

			// Callback si tu veux rafraîchir la liste ou naviguer
			if (onDeleted) onDeleted(response.data);
		} catch (error) {
			setLoading(false);
			setErrorMessage(error.response?.data?.error || error.message);
		}
	};

	return (
		<>
			{/* Bouton principal */}
			<Button variant="contained" color="error" onClick={() => setConfirmOpen(true)} disabled={loading}>
				{loading ? <CircularProgress size={24} color="inherit" /> : 'Supprimer le tournoi'}
			</Button>

			{/* Dialog de confirmation */}
			<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
				<DialogTitle>Confirmer la suppression</DialogTitle>
				<DialogContent>
					<Typography>
						Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmOpen(false)} disabled={loading}>
						Annuler
					</Button>
					<Button color="error" onClick={handleDelete} disabled={loading}>
						{loading ? <CircularProgress size={20} color="inherit" /> : 'Supprimer'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar pour erreur */}
			<Snackbar
				open={!!errorMessage}
				autoHideDuration={6000}
				onClose={() => setErrorMessage('')}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert severity="error" onClose={() => setErrorMessage('')}>
					{errorMessage}
				</Alert>
			</Snackbar>
		</>
	);
};

export default DeleteTournamentButton;
