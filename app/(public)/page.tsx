import Link from 'next/link';
import { Trophy, Users, UserCircle, ChevronRight } from 'lucide-react';

const sections = [
	{
		href: '/tournaments',
		icon: Trophy,
		label: 'Tournois',
		description: 'Consulter les tournois et scouteur les decks en cours de ronde.',
	},
	{
		href: '/groups',
		icon: Users,
		label: 'Groupes',
		description: 'Gérer vos groupes et les accès aux tournois partagés.',
	},
	{
		href: '/profile',
		icon: UserCircle,
		label: 'Profil',
		description: 'Modifier vos informations personnelles et votre mot de passe.',
	},
];

export default function HomePage() {
	return (
		<div className="max-w-2xl">
			<h1 className="text-3xl font-bold text-foreground mb-2">Bienvenue</h1>
			<p className="text-muted-foreground mb-8">Que souhaitez-vous faire ?</p>
			<div className="flex flex-col gap-3">
				{sections.map(({ href, icon: Icon, label, description }) => (
					<Link
						key={href}
						href={href}
						className="flex items-center gap-4 px-4 py-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
					>
						<div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border shrink-0">
							<Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-foreground">{label}</p>
							<p className="text-xs text-muted-foreground mt-0.5">{description}</p>
						</div>
						<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
					</Link>
				))}
			</div>
		</div>
	);
}
