import Link from 'next/link';
import { Trophy, Users, ChevronRight, Plus, CalendarOff } from 'lucide-react';
import { OnboardingTour } from '@components/ui/OnboardingTour';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { UserTournamentRepository } from '@/src/repositories/db/UserTournamentRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import connectToMongoDB from '@/src/lib/db';
import type { ITournament } from '@models/Tournament';

const STATUS_LABEL: Record<string, { dot: string; text: string }> = {
	LIVE:        { dot: 'bg-green-500',  text: 'En cours' },
	NOT_STARTED: { dot: 'bg-blue-500',   text: 'À venir' },
	ENDED:       { dot: 'bg-zinc-600',   text: 'Terminé' },
	COMPLETED:   { dot: 'bg-zinc-600',   text: 'Terminé' },
	CANCELLED:   { dot: 'bg-red-700',    text: 'Annulé' },
};

function TournamentRow({ tournament, href }: { tournament: ITournament; href: string }) {
	const status = STATUS_LABEL[tournament.event_status] ?? { dot: 'bg-zinc-600', text: tournament.event_status };
	const date = tournament.start_datetime
		? new Date(tournament.start_datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
		: null;

	return (
		<Link
			href={href}
			className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent active:scale-[0.98] transition-all"
		>
			<div className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.dot}`} />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate">{tournament.name || 'Sans nom'}</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					{status.text}{date ? ` · ${date}` : ''}
				</p>
			</div>
			<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
		</Link>
	);
}

function SectionHeader({ label, href, linkLabel }: { label: string; href?: string; linkLabel?: string }) {
	return (
		<div className="flex items-center justify-between mb-2">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
			{href && linkLabel && (
				<Link href={href} className="text-xs text-primary hover:underline">
					{linkLabel}
				</Link>
			)}
		</div>
	);
}

export default async function HomePage() {
	await connectToMongoDB();
	const user = await getServerUser();
	const fullUser = user ? await UserRepository.findById(user.userId) : null;
	const isGuest = fullUser?.isGuest ?? false;
	const username = fullUser?.username ?? '';

	if (isGuest && user) {
		const accesses = await TournamentExternalAccessRepository.findByUserId(user.userId);
		const activeAccesses = accesses.filter((a) => a.status === 'ACCEPTED' && a.expiresAt > new Date());
		const tournamentIds = [...new Set(activeAccesses.map((a) => a.tournamentId))];
		const groupIds = [...new Set(activeAccesses.map((a) => String(a.groupId)))];

		const [guestTournaments, groupsData] = await Promise.all([
			TournamentRepository.findByIds(tournamentIds),
			Promise.all(groupIds.map((gid) => GroupRepository.findById(gid))),
		]);

		const groupNameMap = new Map(
			groupsData.filter(Boolean).map((g) => [String(g!._id), g!.name]),
		);

		return (
			<div className="max-w-2xl flex flex-col gap-6">
				<OnboardingTour />
				<div>
					<h1 className="text-2xl font-bold text-foreground">Bienvenue{username ? `, ${username}` : ''}</h1>
					<p className="text-sm text-muted-foreground mt-1">Vos accès invités actifs</p>
				</div>
				{activeAccesses.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-10 text-center">
						<CalendarOff className="h-10 w-10 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">Aucun accès actif pour le moment.</p>
					</div>
				) : (
					activeAccesses.map((access) => {
						const t = guestTournaments.find((t) => t.id === access.tournamentId);
						if (!t) return null;
						const groupName = groupNameMap.get(String(access.groupId));
						return (
							<section key={String(access._id)}>
								{groupName && <SectionHeader label={groupName} />}
								<TournamentRow
									tournament={t}
									href={`/tournaments/${t.id}?groupId=${String(access.groupId)}`}
								/>
							</section>
						);
					})
				)}
			</div>
		);
	}

	if (!user) {
		return (
			<div className="max-w-2xl">
				<OnboardingTour />
				<h1 className="text-2xl font-bold text-foreground mb-2">Bienvenue</h1>
				<p className="text-muted-foreground">Connectez-vous pour accéder à vos tournois.</p>
			</div>
		);
	}

	const groups = await GroupRepository.findByMemberId(user.userId);

	const [groupSectionsData, userLinksActive] = await Promise.all([
		Promise.all(
			groups.map(async (g) => {
				const gts = await GroupTournamentRepository.findByGroupId(String(g._id), 'ACTIVE');
				return { group: g, groupId: String(g._id), tournamentIds: gts.map((gt) => gt.tournamentId) };
			}),
		),
		UserTournamentRepository.findByUserId(user.userId, 'ACTIVE'),
	]);

	const allGroupTournamentIds = groupSectionsData.flatMap((s) => s.tournamentIds);
	const personalTournamentIds = userLinksActive.map((l) => l.tournamentId);
	const allIds = [...new Set([...allGroupTournamentIds, ...personalTournamentIds])];

	const tournaments = await TournamentRepository.findByIds(allIds);
	const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));

	const groupSections = groupSectionsData
		.map(({ group, groupId, tournamentIds }) => ({
			groupId,
			groupName: group.name,
			isPinned: group.isPinned ?? false,
			tournaments: tournamentIds
				.map((id) => tournamentMap.get(id))
				.filter((t): t is ITournament => !!t)
				.sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime()),
		}))
		.filter((s) => s.tournaments.length > 0)
		.sort((a, b) => {
			const latestA = new Date(a.tournaments[0]?.start_datetime ?? 0).getTime();
			const latestB = new Date(b.tournaments[0]?.start_datetime ?? 0).getTime();
			return latestB - latestA;
		});

	const personalTournaments = personalTournamentIds
		.map((id) => tournamentMap.get(id))
		.filter((t): t is ITournament => !!t)
		.sort((a, b) => new Date(b.start_datetime ?? 0).getTime() - new Date(a.start_datetime ?? 0).getTime());

	const hasContent = groupSections.length > 0 || personalTournaments.length > 0;

	return (
		<div className="max-w-2xl flex flex-col gap-6">
			<OnboardingTour />

			<div>
				<h1 className="text-2xl font-bold text-foreground">Bonjour{username ? `, ${username}` : ''}</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{hasContent ? 'Vos tournois actifs' : 'Aucun tournoi actif pour le moment'}
				</p>
			</div>

			{groupSections.map((section) => (
				<section key={section.groupId}>
					<SectionHeader
						label={section.groupName}
						href={`/groups/${section.groupId}`}
						linkLabel="Gérer"
					/>
					<div className="flex flex-col gap-2">
						{section.tournaments.map((t) => (
							<TournamentRow
								key={t.id}
								tournament={t}
								href={`/tournaments/${t.id}?groupId=${section.groupId}`}
							/>
						))}
					</div>
				</section>
			))}

			{personalTournaments.length > 0 && (
				<section>
					<SectionHeader
						label="Mes tournois"
						href="/tournaments"
						linkLabel="Tous voir"
					/>
					<div className="flex flex-col gap-2">
						{personalTournaments.map((t) => (
							<TournamentRow key={t.id} tournament={t} href={`/tournaments/${t.id}`} />
						))}
					</div>
				</section>
			)}

			{!hasContent && (
				<div className="flex flex-col items-center gap-4 py-10 text-center">
					<div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
						<Trophy className="h-7 w-7 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">Prêt à scouteur ?</p>
						<p className="text-sm text-muted-foreground mt-1">
							Ajoutez un tournoi ou rejoignez un groupe pour commencer.
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<Link
							href="/tournaments"
							className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
						>
							<Plus className="h-4 w-4" />
							Ajouter un tournoi
						</Link>
						<Link
							href="/groups"
							className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors"
						>
							<Users className="h-4 w-4" />
							Rejoindre un groupe
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
