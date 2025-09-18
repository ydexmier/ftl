'use client';
import { useState, useRef } from 'react';
import { TextField, Button, Alert, Box } from '@mui/material';
import { fetchTournament } from 'lib/api/fetchTournament';

export default function FetchTournamentForm({ onSubmitCallback, onValidate }) {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const inputRef = useRef();
	// Fonction qui normalise l’input en un ID numérique
	const extractTournamentId = (input) => {
		// Si c’est une URL, on récupère la dernière partie numérique
		const urlPattern = /events\/(\d+)/;
		const match = input.match(urlPattern);
		if (match) return Number(match[1]);

		// Sinon, on tente de caster directement en nombre
		const id = Number(input);
		return Number.isNaN(id) ? null : id;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		console.log(inputRef);
		const normalizedId = extractTournamentId(inputRef.current.value);
		if (!normalizedId) {
			setError('Veuillez saisir un ID valide ou une URL de tournoi');
			return;
		}

		// ✅ validation via la fonction parent
		if (onValidate && !onValidate(normalizedId)) {
			setError(`Le tournoi ${normalizedId} est déjà présent dans la liste.`);
			return;
		}

		try {
			const response = await fetchTournament(normalizedId);

			setSuccess(`Tournoi ${normalizedId} récupéré avec succès !`);
			onSubmitCallback && onSubmitCallback(response.datas);
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
			{/* Ligne avec input + bouton */}
			<Box sx={{ display: 'flex', gap: 2 }}>
				<TextField
					inputRef={inputRef}
					label="ID ou URL du tournoi"
					required
					sx={{ flex: 1 }} // pour que l'input prenne tout l'espace disponible
				/>
				<Button type="submit" variant="contained">
					Récupérer
				</Button>
			</Box>

			{/* Alerts sous la ligne */}
			{error && <Alert severity="error">{error}</Alert>}
			{success && <Alert severity="success">{success}</Alert>}
		</Box>
	);
}
