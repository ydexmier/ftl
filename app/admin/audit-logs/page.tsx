'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/src/lib/api/apiFetch';
import { Spinner } from '@components/ui/Spinner';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { cn } from '@components/ui/cn';
import type { AuditAction } from '@models/AuditLog';

interface Log {
	_id: string;
	action: AuditAction;
	username: string;
	ipAddress: string;
	userAgent: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
}

interface Filters {
	action: string;
	username: string;
	ip: string;
	from: string;
	to: string;
}

const ACTION_OPTIONS = [
	{ value: '', label: 'Toutes les actions' },
	{ value: 'LOGIN_SUCCESS', label: 'Connexion réussie' },
	{ value: 'LOGIN_FAIL', label: 'Connexion échouée' },
	{ value: 'LOGOUT', label: 'Déconnexion' },
	{ value: 'USER_CREATED', label: 'Utilisateur créé' },
	{ value: 'USER_DELETED', label: 'Utilisateur supprimé' },
	{ value: 'PASSWORD_CHANGED', label: 'Mot de passe modifié' },
	{ value: 'ADMIN_ACTION', label: 'Action admin' },
];

const ACTION_STYLES: Record<AuditAction, string> = {
	LOGIN_SUCCESS: 'bg-green-500/15 text-green-400 border-green-500/30',
	LOGIN_FAIL: 'bg-destructive/15 text-destructive border-destructive/30',
	LOGOUT: 'bg-muted text-muted-foreground border-border',
	USER_CREATED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
	USER_UPDATED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
	USER_DELETED: 'bg-destructive/15 text-destructive border-destructive/30',
	PASSWORD_CHANGED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
	ADMIN_ACTION: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function ActionBadge({ action }: { action: AuditAction }) {
	return (
		<span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', ACTION_STYLES[action] ?? 'bg-muted text-muted-foreground border-border')}>
			{action}
		</span>
	);
}

const EMPTY_FILTERS: Filters = { action: '', username: '', ip: '', from: '', to: '' };

export default function AuditLogsPage() {
	const [logs, setLogs] = useState<Log[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pages, setPages] = useState(1);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
	const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

	const fetchLogs = useCallback(async (f: Filters, p: number) => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: String(p), limit: '50' });
			if (f.action) params.set('action', f.action);
			if (f.username) params.set('username', f.username);
			if (f.ip) params.set('ip', f.ip);
			if (f.from) params.set('from', f.from);
			if (f.to) params.set('to', f.to);

			const res = await apiFetch(`/api/admin/audit-logs?${params}`);
			const data = await res.json();
			setLogs(data.logs ?? []);
			setTotal(data.total ?? 0);
			setPages(data.pages ?? 1);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLogs(applied, page);
	}, [applied, page, fetchLogs]);

	const applyFilters = () => {
		setPage(1);
		setApplied({ ...filters });
	};

	const resetFilters = () => {
		setFilters(EMPTY_FILTERS);
		setPage(1);
		setApplied(EMPTY_FILTERS);
	};

	const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
		setFilters((f) => ({ ...f, [key]: e.target.value }));

	return (
		<div className="max-w-6xl mx-auto flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
				{total > 0 && (
					<span className="text-sm text-muted-foreground">{total} entrée{total > 1 ? 's' : ''}</span>
				)}
			</div>

			{/* Filtres */}
			<div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					<Select
						label="Action"
						options={ACTION_OPTIONS}
						value={filters.action}
						onChange={set('action')}
					/>
					<Input
						label="Utilisateur"
						placeholder="Rechercher un login…"
						value={filters.username}
						onChange={set('username')}
					/>
					<Input
						label="Adresse IP"
						placeholder="ex: 192.168.1.1"
						value={filters.ip}
						onChange={set('ip')}
					/>
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-foreground">Période</span>
						<div className="flex gap-2">
							<input
								type="date"
								value={filters.from}
								onChange={set('from')}
								className="flex-1 h-9 rounded-md border border-white/25 bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<input
								type="date"
								value={filters.to}
								onChange={set('to')}
								className="flex-1 h-9 rounded-md border border-white/25 bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button onClick={applyFilters}>Filtrer</Button>
					<Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
				</div>
			</div>

			{/* Table */}
			<div className="bg-card border border-border rounded-xl overflow-hidden">
				{loading ? (
					<div className="flex justify-center py-12"><Spinner size="md" /></div>
				) : logs.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-12">Aucun log trouvé.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
									<th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
									<th className="px-4 py-3 text-left">Action</th>
									<th className="px-4 py-3 text-left">Utilisateur</th>
									<th className="px-4 py-3 text-left hidden sm:table-cell whitespace-nowrap">IP</th>
									<th className="px-4 py-3 text-left hidden lg:table-cell">User-Agent</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log) => (
									<tr key={log._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono text-xs">
											{new Date(log.timestamp).toLocaleString('fr-FR')}
										</td>
										<td className="px-4 py-3">
											<ActionBadge action={log.action} />
										</td>
										<td className="px-4 py-3">{log.username || <span className="text-muted-foreground">—</span>}</td>
										<td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-muted-foreground">
											{log.ipAddress || '—'}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground max-w-xs truncate" title={log.userAgent}>
											{log.userAgent || '—'}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination */}
			{pages > 1 && (
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Page {page} sur {pages}</span>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
							Précédent
						</Button>
						<Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
							Suivant
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
