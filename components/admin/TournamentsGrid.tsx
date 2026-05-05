'use client';
import Link from 'next/link';
import TournamentCard from '@components/tournament/TournamentCard';
import type { Tournament } from '@/src/types/tournament';

interface TournamentsGridProps {
	tournaments: Tournament[];
}

export default function TournamentsGrid({ tournaments }: TournamentsGridProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
			{tournaments.map((t) => (
				<Link key={t.id} href={`/admin/tournaments/${t.id}`} className="block">
					<TournamentCard tournament={t} />
				</Link>
			))}
		</div>
	);
}
