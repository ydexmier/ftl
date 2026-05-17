'use client';
import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@components/ui/Button';
import Ink from '@components/ui/Ink';

interface UncertaintyConflict {
	_id: string;
	tournamentId: number;
	playerId: number;
	playerName: string;
	previousInks: string[][];
	proposedInks: string[][];
}

interface Props {
	tournamentName: string;
	conflicts: UncertaintyConflict[];
	groupId: string;
	onDismissed: (conflictId: string) => void;
	onClose: () => void;
}

function InkDeck({ decks }: { decks: string[][] }) {
	if (decks.length === 0) return <span className="text-muted-foreground text-xs italic">Aucune encre</span>;
	return (
		<div className="flex gap-2 flex-wrap">
			{decks.map((deck, i) => (
				<Ink key={i} type={deck} width={40} />
			))}
		</div>
	);
}

export function UncertaintyModal({ tournamentName, conflicts, groupId, onDismissed, onClose }: Props) {
	const [dismissingId, setDismissingId] = useState<string | null>(null);

	const handleDismiss = async (conflictId: string) => {
		setDismissingId(conflictId);
		try {
			const res = await fetch(`/api/groups/${groupId}/uncertainties/${conflictId}`, { method: 'DELETE' });
			if (res.ok) onDismissed(conflictId);
		} finally {
			setDismissingId(null);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
			<div className="bg-card border border-border rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between p-5 border-b border-border shrink-0">
					<div className="flex items-center gap-2">
						<HelpCircle className="h-5 w-5 text-blue-400" />
						<div>
							<h2 className="font-semibold text-foreground">Encres à vérifier physiquement</h2>
							<p className="text-xs text-muted-foreground">{tournamentName}</p>
						</div>
					</div>
					<button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="overflow-y-auto p-5 space-y-4 flex-1">
					<p className="text-sm text-muted-foreground">
						Ces joueurs ont des encres incertaines. Vérifiez physiquement lors du tournoi et levez l&apos;incertitude une fois confirmé.
					</p>

					{conflicts.map((conflict) => (
						<div key={conflict._id} className="border border-border rounded-lg p-4 space-y-3">
							<div className="flex items-center justify-between gap-2">
								<p className="font-medium text-foreground text-sm">{conflict.playerName}</p>
								<Button
									size="sm"
									variant="outline"
									loading={dismissingId === conflict._id}
									onClick={() => handleDismiss(conflict._id)}
									className="shrink-0 text-xs"
								>
									Lever l&apos;incertitude
								</Button>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
										Version actuelle du groupe
									</p>
									<InkDeck decks={conflict.previousInks} />
								</div>
								<div className="space-y-1.5">
									<p className="text-xs font-medium text-blue-400 uppercase tracking-wide">
										Version alternative
									</p>
									<InkDeck decks={conflict.proposedInks} />
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="border-t border-border p-4 flex justify-end shrink-0">
					<Button variant="outline" size="sm" onClick={onClose}>
						Fermer
					</Button>
				</div>
			</div>
		</div>
	);
}
