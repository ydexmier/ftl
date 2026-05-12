'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, LogOut, UserCircle } from 'lucide-react';
import { cn } from './cn';
import { FeedbackWidget } from './FeedbackWidget';

const navLinks = [
	{ href: '/', label: 'Accueil' },
	{ href: '/tournaments', label: 'Tournois' },
	{ href: '/groups', label: 'Groupes' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.push('/login');
	};

	return (
		<>
			<header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
					<Link
						href="/"
						className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground shrink-0"
					>
						<Swords className="h-5 w-5" />
						Companion
					</Link>

					<nav className="flex items-center gap-1">
						{navLinks.map(({ href, label }) => (
							<Link
								key={href}
								href={href}
								className={cn(
									'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
									pathname === href
										? 'text-foreground bg-accent'
										: 'text-muted-foreground hover:text-foreground hover:bg-accent',
								)}
							>
								{label}
							</Link>
						))}
					</nav>

					<div className="ml-auto" />

					<Link
						href="/profile"
						className="text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-md transition-colors"
						aria-label="Mon profil"
					>
						<UserCircle className="h-5 w-5" />
					</Link>

					<button
						onClick={logout}
						className="text-muted-foreground hover:text-destructive hover:bg-accent p-2 rounded-md transition-colors"
						aria-label="Déconnexion"
					>
						<LogOut className="h-5 w-5" />
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
			<FeedbackWidget />
		</>
	);
}
