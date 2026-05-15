'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, LogOut, UserCircle, Menu, X } from 'lucide-react';
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
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.push('/login');
	};

	return (
		<>
			<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
					<Link
						href="/"
						className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground shrink-0"
					>
						<Swords className="h-5 w-5" />
						Companion
					</Link>

					{/* Desktop nav */}
					<nav className="hidden sm:flex items-center gap-1">
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
						data-tour="nav-profile"
						className="text-muted-foreground hover:text-foreground hover:bg-accent p-2.5 rounded-md transition-colors"
						aria-label="Mon profil"
					>
						<UserCircle className="h-5 w-5" />
					</Link>

					<button
						onClick={logout}
						className="hidden sm:flex text-muted-foreground hover:text-destructive hover:bg-accent p-2.5 rounded-md transition-colors"
						aria-label="Déconnexion"
					>
						<LogOut className="h-5 w-5" />
					</button>

					{/* Mobile hamburger */}
					<button
						onClick={() => setMobileMenuOpen(o => !o)}
						className="sm:hidden p-2.5 rounded-md hover:bg-accent transition-colors"
						aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
					>
						{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{/* Mobile dropdown menu */}
				{mobileMenuOpen && (
					<div className="sm:hidden border-t border-border bg-background/95">
						<nav className="flex flex-col px-4 py-2">
							{navLinks.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										'text-sm font-medium px-3 py-3 rounded-md transition-colors',
										pathname === href
											? 'text-foreground bg-accent'
											: 'text-muted-foreground hover:text-foreground hover:bg-accent',
									)}
								>
									{label}
								</Link>
							))}
							<button
								onClick={() => { setMobileMenuOpen(false); logout(); }}
								className="flex items-center gap-2 text-sm font-medium px-3 py-3 rounded-md text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
							>
								<LogOut className="h-4 w-4" />
								Déconnexion
							</button>
						</nav>
					</div>
				)}
			</header>

			<main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">{children}</main>
			<FeedbackWidget />
		</>
	);
}
