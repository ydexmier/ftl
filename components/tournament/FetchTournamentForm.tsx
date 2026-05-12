'use client';
import { useRef, useState } from 'react';

import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { fetchTournament } from 'lib/api/fetchTournament';

interface FetchTournamentFormProps {
	onSubmitCallback?: (data: { id: number }) => void;
	onValidate?: (id: number) => boolean;
}

const extractTournamentId = (input: string): number | null => {
	const match = input.match(/events\/(\d+)/);
	if (match) return Number(match[1]);
	const id = Number(input);
	return Number.isNaN(id) ? null : id;
};

export default function FetchTournamentForm({ onSubmitCallback, onValidate }: FetchTournamentFormProps) {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		const normalizedId = extractTournamentId(inputRef.current?.value ?? '');
		if (!normalizedId) {
			setError('Veuillez saisir un ID valide ou une URL de tournoi');
			return;
		}
		if (onValidate && !onValidate(normalizedId)) {
			setError(`Le tournoi ${normalizedId} est déjà présent dans la liste.`);
			return;
		}

		setLoading(true);
		try {
			const response = await fetchTournament(normalizedId);
			setSuccess(`Tournoi ${normalizedId} récupéré avec succès !`);
			onSubmitCallback?.(response.datas);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
			<div className="flex gap-2">
				<Input
					ref={inputRef}
					label="ID ou URL du tournoi"
					required
					fullWidth
					placeholder="123456 ou https://..."
					disabled={loading}
				/>
				<Button type="submit" className="self-end shrink-0" loading={loading} disabled={loading}>
					Récupérer
				</Button>
			</div>
			{error && <Alert severity="error">{error}</Alert>}
			{success && <Alert severity="success">{success}</Alert>}
		</form>
	);
}
