'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';
import { cn } from '@components/ui/cn';

interface Stats {
	today: { logins: number; failures: number };
	week: { logins: number; failures: number };
	suspiciousIPs: { ip: string; failCount: number; lastAttempt: string; usernames: string[] }[];
	recentFails: { username: string; ipAddress: string; timestamp: string }[];
}

function StatCard({
	label,
	value,
	sub,
	icon: Icon,
	danger,
}: {
	label: string;
	value: number;
	sub?: string;
	icon: React.ElementType;
	danger?: boolean;
}) {
	return (
		<div className={cn('bg-card border rounded-xl p-5 flex flex-col gap-3', danger && value > 0 ? 'border-destructive/50' : 'border-border')}>
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">{label}</span>
				<Icon className={cn('h-4 w-4', danger && value > 0 ? 'text-destructive' : 'text-muted-foreground')} />
			</div>
			<span className={cn('text-3xl font-bold', danger && value > 0 ? 'text-destructive' : 'text-foreground')}>
				{value}
			</span>
			{sub && <span className="text-xs text-muted-foreground">{sub}</span>}
		</div>
	);
}

export default function DashboardPage() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		fetch('/api/admin/stats')
			.then((r) => r.json())
			.then(setStats)
			.catch(() => setError('Impossible de charger les statistiques'))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <div className="flex justify-center pt-20"><Spinner size="md" /></div>;
	if (error || !stats) return <p className="text-destructive text-sm">{error}</p>;

	return (
		<div className="max-w-5xl mx-auto flex flex-col gap-8">
			<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

			{/* Stats cards */}
			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aujourd'hui</h2>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard label="Connexions" value={stats.today.logins} icon={LogIn} />
					<StatCard label="Échecs" value={stats.today.failures} icon={LogOut} danger />
					<StatCard label="Connexions (7j)" value={stats.week.logins} icon={LogIn} />
					<StatCard label="Échecs (7j)" value={stats.week.failures} icon={LogOut} danger />
				</div>
			</section>

			{/* Suspicious IPs */}
			<section className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<ShieldAlert className="h-4 w-4 text-destructive" />
					<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
						IPs suspectes (3+ échecs / 24h)
					</h2>
				</div>
				{stats.suspiciousIPs.length === 0 ? (
					<p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-5">
						Aucune activité suspecte détectée.
					</p>
				) : (
					<div className="bg-card border border-destructive/40 rounded-xl overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
									<th className="px-4 py-3 text-left">IP</th>
									<th className="px-4 py-3 text-left">Échecs</th>
									<th className="px-4 py-3 text-left hidden sm:table-cell">Logins tentés</th>
									<th className="px-4 py-3 text-left hidden md:table-cell">Dernier essai</th>
								</tr>
							</thead>
							<tbody>
								{stats.suspiciousIPs.map((row) => (
									<tr key={row.ip} className="border-b border-border last:border-0">
										<td className="px-4 py-3 font-mono text-xs">{row.ip || '—'}</td>
										<td className="px-4 py-3 text-destructive font-semibold">{row.failCount}</td>
										<td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
											{row.usernames.filter(Boolean).join(', ') || '—'}
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
											{new Date(row.lastAttempt).toLocaleString('fr-FR')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Recent failures */}
			{stats.recentFails.length > 0 && (
				<section className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-500" />
						<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
							Derniers échecs de connexion aujourd'hui
						</h2>
					</div>
					<div className="bg-card border border-border rounded-xl overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
									<th className="px-4 py-3 text-left">Login tenté</th>
									<th className="px-4 py-3 text-left hidden sm:table-cell">IP</th>
									<th className="px-4 py-3 text-left">Heure</th>
								</tr>
							</thead>
							<tbody>
								{stats.recentFails.map((f, i) => (
									<tr key={i} className="border-b border-border last:border-0">
										<td className="px-4 py-3">{f.username || '—'}</td>
										<td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-muted-foreground">
											{f.ipAddress || '—'}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{new Date(f.timestamp).toLocaleTimeString('fr-FR')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			)}
		</div>
	);
}
