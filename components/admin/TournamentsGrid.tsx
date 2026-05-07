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
					<TournamentCard
						tournament={{
							id: t.id,
							name: t.name,
							start_datetime: t.start_datetime,
							end_datetime: t.end_datetime ?? null,
							event_status: t.event_status,
							registered_user_count: t.registered_user_count ?? 0,
							capacity: t.capacity ?? 0,
							store: t.store ? { name: t.store.name } : null,
							gameplay_format: t.gameplay_format ? { id: t.gameplay_format.id, name: t.gameplay_format.name } : null,
						}}
					/>
				</Link>
			))}
		</div>
	);
}
