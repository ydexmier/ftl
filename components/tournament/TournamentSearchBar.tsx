'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Link2, Check, Download, Loader2 } from 'lucide-react';
import { cn } from '@components/ui/cn';
import type { TournamentCardData } from './TournamentCard';

interface SearchResult {
	id: number;
	name: string;
	start_datetime: string;
	event_status: string;
	store: { name: string } | null;
	isLinked: boolean;
	isGroupTournament: boolean;
}

interface SearchResponse {
	results: SearchResult[];
	noResults: boolean;
	fetchableId: number | null;
}

const STATUS_LABEL: Record<string, string> = {
	LIVE: 'En cours',
	NOT_STARTED: 'À venir',
	ENDED: 'Terminé',
	COMPLETED: 'Terminé',
	CANCELLED: 'Annulé',
};

function extractNumericId(input: string): number | null {
	const fromUrl = input.match(/events\/(\d+)/);
	if (fromUrl) return Number(fromUrl[1]);
	const n = Number(input.trim());
	return !isNaN(n) && n > 0 ? n : null;
}

interface Props {
	onLinked?: (tournament: TournamentCardData) => void;
}

export function TournamentSearchBar({ onLinked }: Props) {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [response, setResponse] = useState<SearchResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [linkingId, setLinkingId] = useState<number | null>(null);
	const [fetching, setFetching] = useState(false);
	const [linkedId, setLinkedId] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const search = useCallback(async (q: string) => {
		if (q.length < 1) {
			setResponse(null);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/tournaments/search?q=${encodeURIComponent(q)}`);
			if (res.ok) setResponse(await res.json());
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (query.length < 1) {
			setResponse(null);
			return;
		}
		debounceRef.current = setTimeout(() => search(query), 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, search]);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setResponse(null);
				setQuery('');
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const close = (result?: SearchResult) => {
		setResponse(null);
		setQuery('');
		setLinkedId(null);
		if (result) {
			onLinked?.({
				id: result.id,
				name: result.name,
				start_datetime: result.start_datetime,
				end_datetime: null,
				event_status: result.event_status,
				registered_user_count: 0,
				capacity: 0,
				store: result.store,
				gameplay_format: null,
			});
		}
	};

	const linkTournament = async (result: SearchResult) => {
		setLinkingId(result.id);
		try {
			const res = await fetch(`/api/tournaments/${result.id}/link`, { method: 'POST' });
			if (res.ok || res.status === 409) {
				setLinkedId(result.id);
				setTimeout(() => close(result), 800);
			}
		} finally {
			setLinkingId(null);
		}
	};

	const fetchAndLink = async (id: number) => {
		setFetching(true);
		try {
			const fetchRes = await fetch('/api/admin/fetchTournament', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tournamentId: id }),
			});
			if (!fetchRes.ok) return;
			const linkRes = await fetch(`/api/tournaments/${id}/link`, { method: 'POST' });
			if (linkRes.ok || linkRes.status === 409) {
				setLinkedId(id);
				setTimeout(() => {
					close();
					router.refresh();
				}, 800);
			}
		} finally {
			setFetching(false);
		}
	};

	const open = response !== null && query.length > 0;

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Rechercher un tournoi par URL ou ID…"
					className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				/>
				{loading && (
					<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
				)}
			</div>

			{open && (
				<div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
					{response!.results.length > 0 ? (
						<ul>
							{response!.results.map((t) => (
								<li
									key={t.id}
									className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50 border-b border-border last:border-0"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground truncate">{t.name}</p>
										<p className="text-xs text-muted-foreground">
											{t.store?.name ?? '—'} · {STATUS_LABEL[t.event_status] ?? t.event_status}
										</p>
									</div>
									<div className="shrink-0">
										{t.isGroupTournament ? (
											<span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
												Dans un groupe
											</span>
										) : t.isLinked || linkedId === t.id ? (
											<span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
												<Check className="h-3 w-3" /> Lié
											</span>
										) : (
											<button
												onClick={() => linkTournament(t)}
												disabled={linkingId === t.id}
												className={cn(
													'flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
													'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
												)}
											>
												{linkingId === t.id ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													<Link2 className="h-3 w-3" />
												)}
												Lier
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					) : response!.fetchableId !== null ? (
						<button
							onClick={() => fetchAndLink(response!.fetchableId!)}
							disabled={fetching}
							className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
						>
							{fetching ? (
								<Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
							) : (
								<Download className="h-4 w-4 text-primary shrink-0" />
							)}
							<div>
								<p className="text-sm font-medium text-foreground">
									Récupérer les données du tournoi #{response!.fetchableId}
								</p>
								<p className="text-xs text-muted-foreground">
									Rechercher sur Ravensburger et lier à votre compte
								</p>
							</div>
						</button>
					) : (
						<p className="px-4 py-3 text-sm text-muted-foreground">Aucun tournoi trouvé</p>
					)}
				</div>
			)}
		</div>
	);
}
