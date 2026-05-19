'use client';
import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';

interface DeleteTournamentButtonProps {
	tournamentId: number;
	onDeleted?: (data?: unknown) => void;
}

const DeleteTournamentButton = ({ tournamentId, onDeleted }: DeleteTournamentButtonProps) => {
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
			setConfirmOpen(false);
			if (response.ok) {
				const json = await response.json();
				onDeleted?.(json);
			} else {
				const err = await response.json().catch(() => ({}));
				setErrorMessage(err.error ?? 'Erreur lors de la suppression');
			}
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				variant="destructive"
				onClick={() => setConfirmOpen(true)}
				disabled={loading}
				loading={loading}
			>
				Supprimer le tournoi
			</Button>

			{/* Modal de confirmation */}
			{confirmOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 flex flex-col gap-4 shadow-xl">
						<h2 className="text-base font-semibold text-foreground">
							Confirmer la suppression
						</h2>
						<p className="text-sm text-muted-foreground">
							Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.
						</p>
						<div className="flex justify-end gap-2 mt-2">
							<Button
								variant="ghost"
								onClick={() => setConfirmOpen(false)}
								disabled={loading}
							>
								Annuler
							</Button>
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={loading}
								loading={loading}
							>
								Supprimer
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Toast d'erreur */}
			{errorMessage && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
					<Alert severity="error" onClose={() => setErrorMessage('')}>
						{errorMessage}
					</Alert>
				</div>
			)}
		</>
	);
};

export default DeleteTournamentButton;
