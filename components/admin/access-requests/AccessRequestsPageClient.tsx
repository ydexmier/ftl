'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { cn } from '@components/ui/cn';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AccessRequest {
  _id: string;
  email: string;
  reason: string | null;
  status: RequestStatus;
  createdAt: string;
  reviewedAt: string | null;
}

interface Props {
  requests: AccessRequest[];
  total: number;
  page: number;
  pages: number;
  status: string;
}

const STATUS_BADGE: Record<RequestStatus, React.ComponentProps<typeof Badge>['color']> = {
  PENDING: 'secondary',
  APPROVED: 'success',
  REJECTED: 'error',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
};

export function AccessRequestsPageClient({ requests, total, page, pages, status }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const setFilter = (s: string) => {
    const sp = new URLSearchParams();
    if (s) sp.set('status', s);
    router.push(`/admin/access-requests?${sp.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demandes d&apos;accès</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} demande{total !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-2 sm:py-1 rounded-full text-xs font-medium transition-colors border',
              status === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50',
            )}
          >
            {s === '' ? 'Toutes' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Aucune demande.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Email</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Raison</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Date</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-foreground">{r.email}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                    {r.reason ?? <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <Badge label={STATUS_LABEL[r.status]} color={STATUS_BADGE[r.status]} />
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    {r.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={loadingId === r._id}
                          onClick={() => handleAction(r._id, 'approve')}
                          className="text-green-400 border-green-700 hover:bg-green-900/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={loadingId === r._id}
                          onClick={() => handleAction(r._id, 'reject')}
                          className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rejeter
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">
                          {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/admin/access-requests?page=${p}${status ? `&status=${status}` : ''}`)}
              className={cn(
                'h-9 w-9 sm:h-8 sm:w-8 rounded-md text-sm font-medium transition-colors',
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:bg-accent',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
