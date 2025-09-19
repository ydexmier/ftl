'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { diffInSeconds } from '@components/scooting/utils/date';

export default function FetchButton({ defaultLabel = 'Rafraîchir', onFetch, lastUpdate = null, refreshDelay = 60 }) {
	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0); // secondes restantes

	const [openSnackbar, setOpenSnackbar] = useState(false);
	useEffect(() => {
		setCooldown(
			!lastUpdate || Math.min(diffInSeconds(new Date(lastUpdate), new Date()), refreshDelay) === refreshDelay
				? 0
				: refreshDelay - diffInSeconds(new Date(lastUpdate), new Date()),
		);
	}, [lastUpdate]);
	// décrémente le cooldown toutes les secondes
	useEffect(() => {
		if (cooldown <= 0) return;

		const timer = setInterval(() => {
			setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => clearInterval(timer);
	}, [cooldown]);

	const handleClick = useCallback(async () => {
		if (loading || cooldown > 0) return;

		try {
			setLoading(true);
			await onFetch(); // ta fonction fetch parent
			setCooldown(refreshDelay); // cooldown 1 minute
			setOpenSnackbar(true); // ✅ affiche la popup
		} catch (err) {
			console.error('Erreur fetch:', err);
		} finally {
			setLoading(false);
		}
	}, [loading, cooldown, onFetch]);

	return (
		<>
			<Button
				variant="contained"
				color="primary"
				onClick={handleClick}
				disabled={loading || cooldown > 0}
				startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
			>
				{loading ? 'Chargement...' : cooldown > 0 ? `${cooldown}s` : defaultLabel}
			</Button>
			{/* ✅ Snackbar de confirmation */}
			<Snackbar
				open={openSnackbar}
				autoHideDuration={3000} // disparaît après 3s
				onClose={() => setOpenSnackbar(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
					Données mises à jour avec succès !
				</Alert>
			</Snackbar>
		</>
	);
}
