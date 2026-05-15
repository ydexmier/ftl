'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { diffInSeconds } from '@/src/lib/date';

interface FetchButtonProps {
	defaultLabel?: string;
	onFetch: () => Promise<void> | void;
	lastUpdate?: string | null;
	refreshDelay?: number;
}

export default function FetchButton({ defaultLabel = 'Rafraîchir', onFetch, lastUpdate = null, refreshDelay = 60 }: FetchButtonProps) {
	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		setCooldown(
			!lastUpdate || Math.min(diffInSeconds(new Date(lastUpdate), new Date()), refreshDelay) === refreshDelay
				? 0
				: refreshDelay - diffInSeconds(new Date(lastUpdate), new Date()),
		);
	}, [lastUpdate]);

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
			await onFetch();
			setCooldown(refreshDelay);
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (err) {
			console.error('Erreur fetch:', err);
		} finally {
			setLoading(false);
		}
	}, [loading, cooldown, onFetch]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={handleClick}
				disabled={loading || cooldown > 0}
				loading={loading}
			>
				{!loading && <RefreshCw className="h-3.5 w-3.5" />}
				{loading ? 'Chargement...' : cooldown > 0 ? `${cooldown}s` : defaultLabel}
			</Button>
			{showSuccess && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
					<Alert severity="success" onClose={() => setShowSuccess(false)}>
						Données mises à jour avec succès !
					</Alert>
				</div>
			)}
		</>
	);
}
