'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, ShieldCheck } from 'lucide-react';
import { cn } from './cn';

const navLinks = [
	{ href: '/', label: 'Accueil' },
	{ href: '/tournaments', label: 'Tournois' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<>
			<header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
					<Link
						href="/"
						className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground shrink-0"
					>
						<Swords className="h-5 w-5" />
						FTL
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
						href="/admin/dashboard"
						className="text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-md transition-colors"
						aria-label="Administration"
					>
						<ShieldCheck className="h-5 w-5" />
					</Link>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-6">
				{children}
			</main>
		</>
	);
}
