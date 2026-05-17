'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, Shield, Users, Mail, MessageSquare, ClipboardList, Menu, X, LogOut, UsersRound } from 'lucide-react';
import { cn } from '@components/ui/cn';

const NAV = [
	{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/admin/tournaments', label: 'Tournois', icon: Trophy },
	{ href: '/admin/users', label: 'Utilisateurs', icon: Users },
	{ href: '/admin/groups', label: 'Groupes', icon: UsersRound },
	{ href: '/admin/invitations', label: 'Invitations', icon: Mail },
	{ href: '/admin/access-requests', label: 'Demandes d\'accès', icon: ClipboardList },
	{ href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
	{ href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
];

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
	return (
		<nav className="flex-1 flex flex-col gap-1 p-3">
			{NAV.map(({ href, label, icon: Icon }) => (
				<Link
					key={href}
					href={href}
					onClick={onNavigate}
					className={cn(
						'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
						pathname === href
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
					)}
				>
					<Icon className="h-4 w-4 shrink-0" />
					{label}
				</Link>
			))}
		</nav>
	);
}

function SidebarContent({
	pathname,
	onNavigate,
	onLogout,
}: {
	pathname: string;
	onNavigate?: () => void;
	onLogout: () => void;
}) {
	return (
		<div className="flex flex-col h-full border-r border-border bg-card">
			<div className="h-14 flex items-center px-5 border-b border-border shrink-0">
				<span className="font-bold text-foreground tracking-tight">Companion Admin</span>
			</div>
			<NavItems pathname={pathname} onNavigate={onNavigate} />
			<div className="p-3 border-t border-border shrink-0">
				<button
					onClick={onLogout}
					className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
				>
					<LogOut className="h-4 w-4 shrink-0" />
					Déconnexion
				</button>
			</div>
		</div>
	);
}

export function AdminSidebar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.push('/login');
	};

	return (
		<>
			{/* Desktop sidebar */}
			<aside className="hidden lg:block fixed inset-y-0 left-0 w-60 z-30">
				<SidebarContent pathname={pathname} onLogout={logout} />
			</aside>

			{/* Mobile top bar */}
			<header className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center px-4 border-b border-border bg-card z-30">
				<button
					onClick={() => setMobileOpen(true)}
					className="p-2.5 rounded-md hover:bg-accent transition-colors"
					aria-label="Ouvrir le menu"
				>
					<Menu className="h-5 w-5" />
				</button>
				<span className="ml-3 font-bold text-foreground truncate">Companion Admin</span>
			</header>

			{/* Mobile drawer */}
			{mobileOpen && (
				<>
					<div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
					<aside className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50">
						<div className="absolute top-3 right-3 z-10">
							<button
								onClick={() => setMobileOpen(false)}
								className="p-2.5 rounded-md hover:bg-accent transition-colors"
								aria-label="Fermer le menu"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} onLogout={logout} />
					</aside>
				</>
			)}
		</>
	);
}
