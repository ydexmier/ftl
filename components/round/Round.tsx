'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';

import { Spinner } from '@components/ui/Spinner';
import MatchCard from '@components/match/MatchCard';
import MatchModal from '@components/match/MatchModal';
import RoundHeader from '@components/round/RoundHeader';
import RoundSearch from '@components/round/RoundSearch';
import { PlayerCommentHistory } from '@components/ui/PlayerCommentHistory';
import { useRound } from '@/src/hooks/useRound';

interface RoundProps {
	roundId: string | number;
	page?: string | number;
	perPage?: string | number;
	search?: string;
	groupId?: string | null;
	currentUserId?: string;
	isGroupAdmin?: boolean;
}

const Round = ({ roundId, page: initialPage, perPage: initialPerPage, search: initialSearch, groupId, currentUserId = '', isGroupAdmin = false }: RoundProps) => {
	const [page, setPage] = useState(parseInt(String(initialPage), 10) || 1);
	const [perPage, setPerPage] = useState(parseInt(String(initialPerPage), 10) || 10);
	const [search, setSearch] = useState(String(initialSearch || ''));
	const [commentTarget, setCommentTarget] = useState<{ playerId: number; playerName: string } | null>(null);
	const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
	const router = useRouter();
	const pathname = usePathname();
	const { tournamentId } = useParams<{ tournamentId: string }>();

	const {
		matchs,
		lastFetchedAt,
		loading,
		error,
		matchToShow,
		openMatchModal,
		closeMatchModal,
		onValidateAssignDeck,
		getPlayerDecksInk,
		getMatchPlayerInks,
		refreshRound,
		pagination,
	} = useRound(Number(roundId), Number(tournamentId), { page, perPage, search, excludeOnePlayerMatches: true, groupId });

	const paginationControls = useMemo(() => (
		<div className="flex items-center justify-between gap-2 my-4 flex-wrap">
			<div className="flex items-center gap-2">
				{/* Page select */}
				<select
					value={page}
					disabled={pagination.totalPages <= 1}
					onChange={(e) => setPage(Number(e.target.value))}
					className="h-8 rounded-md border border-white/25 bg-card px-2 text-sm text-foreground disabled:opacity-40"
				>
					{Array.from({ length: pagination.totalPages || 1 }, (_, i) => (
						<option key={i + 1} value={i + 1}>Page {i + 1}</option>
					))}
				</select>

				{/* PerPage select */}
				<select
					value={perPage}
					onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
					className="h-8 rounded-md border border-white/25 bg-card px-2 text-sm text-foreground"
				>
					{[10, 25, 50, 100].map((n) => (
						<option key={n} value={n}>{n} matchs</option>
					))}
				</select>
			</div>

			{/* Prev / page indicator / Next */}
			<div className="flex items-center gap-2">
				<button
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page <= 1}
					className="h-8 px-3 rounded-md border border-white/25 bg-card text-sm text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
				>
					‹
				</button>
				<span className="text-sm text-muted-foreground">
					{pagination.page} / {pagination.totalPages || 1}
				</span>
				<button
					onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
					disabled={page >= (pagination.totalPages || 1)}
					className="h-8 px-3 rounded-md border border-white/25 bg-card text-sm text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
				>
					›
				</button>
			</div>
		</div>
	), [pagination, page, perPage]);

	useEffect(() => {
		if (!matchs.length) return;
		const playerIds = matchs
			.flatMap((m) => m.player_match_relationships.map((p) => p.player.id))
			.filter((id, i, arr) => arr.indexOf(id) === i);
		const params = new URLSearchParams();
		params.set('playerIds', playerIds.join(','));
		if (groupId) params.set('groupId', groupId);
		fetch(`/api/tournaments/${tournamentId}/comment-counts?${params}`)
			.then((r) => (r.ok ? r.json() : { counts: {} }))
			.then((d) => setCommentCounts(d.counts ?? {}))
			.catch(() => {});
	}, [matchs, tournamentId, groupId]);

	useEffect(() => {
		if (!roundId) return;
		const query = {
			tournamentId,
			roundId,
			page,
			perPage,
			...(search ? { search } : {}),
			...(groupId ? { groupId } : {}),
		};
		const sp = new URLSearchParams(
			Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])),
		);
		router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
	}, [roundId, page, perPage, search, groupId]);

	return (
		<>
			<RoundHeader lastFetchedAt={lastFetchedAt} onRefresh={refreshRound} />

			<div className="mb-4 max-w-sm">
				<RoundSearch value={search} onChange={setSearch} />
			</div>

			{!matchs.length && !loading && (
				<p className="text-muted-foreground text-sm">La round n'est pas encore lancée ou n'a pas été MAJ.</p>
			)}
			{error && error !== 'ROUND_NOT_FOUND' && (
				<p className="text-destructive text-sm mt-2">Erreur : {String(error)}</p>
			)}

			{!matchs.length ? (
				loading ? (
					<div className="flex justify-center mt-8">
						<Spinner size="lg" />
					</div>
				) : null
			) : (
				<>
					{paginationControls}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{matchs.map((match) => (
							<MatchCard
								key={match.id}
								match={match}
								onClick={openMatchModal(match)}
								player1Deck={getPlayerDecksInk(
									match.player_match_relationships.find(
										(p) => p.player_order === 1 || match.match_is_bye || match.match_is_loss,
									)!.player.id,
								)}
								player2Deck={
									!match.match_is_bye &&
									!match.match_is_loss &&
									getPlayerDecksInk(
										match.player_match_relationships.find((p) => p.player_order === 2)!.player.id,
									)
								}
								onCommentClick={(playerId, playerName) => setCommentTarget({ playerId, playerName })}
								player1CommentCount={commentCounts[match.player_match_relationships.find((p) => p.player_order === 1 || match.match_is_bye || match.match_is_loss)?.player.id ?? 0] ?? 0}
								player2CommentCount={!match.match_is_bye && !match.match_is_loss ? (commentCounts[match.player_match_relationships.find((p) => p.player_order === 2)?.player.id ?? 0] ?? 0) : 0}
							/>
						))}
					</div>
					{paginationControls}
				</>
			)}

			<MatchModal
				match={matchToShow}
				open={!!matchToShow}
				combinationsInitial={matchToShow && getMatchPlayerInks(matchToShow)}
				onValidate={onValidateAssignDeck as (data: unknown) => Promise<void>}
				onClose={closeMatchModal}
			/>

			<PlayerCommentHistory
				open={!!commentTarget}
				onClose={() => setCommentTarget(null)}
				tournamentId={Number(tournamentId)}
				playerId={commentTarget?.playerId ?? 0}
				playerName={commentTarget?.playerName ?? ''}
				groupId={groupId}
				currentUserId={currentUserId}
				isGroupAdmin={isGroupAdmin}
				onCommentAdded={() => {
					if (!commentTarget) return;
					setCommentCounts((prev) => ({ ...prev, [commentTarget.playerId]: (prev[commentTarget.playerId] ?? 0) + 1 }));
				}}
			/>
		</>
	);
};

export default Round;
