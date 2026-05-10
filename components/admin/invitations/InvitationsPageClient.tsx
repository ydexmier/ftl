'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mail, Send, Ban, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Badge } from '@components/ui/Badge';
import { InvitationSendModal } from './InvitationSendModal';
import type { BadgeProps } from '@components/ui/Badge';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'USED', label: 'Utilisée' },
  { value: 'EXPIRED', label: 'Expirée' },
  { value: 'CANCELLED', label: 'Annulée' },
];

const STATUS_BADGE: Record<string, BadgeProps['color']> = {
  PENDING: 'warning',
  USED: 'success',
  EXPIRED: 'secondary',
  CANCELLED: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  USED: 'Utilisée',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
};

interface InvitationRow {
  _id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  invitedBy: { username: string } | null;
  groups: { _id: string; name: string }[];
}

interface Props {
  invitations: InvitationRow[];
  total: number;
  page: number;
  pages: number;
  status: string;
}

export function InvitationsPageClient({ invitations, total, page, pages, status: initialStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState(initialStatus);
  const [sendOpen, setSendOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pushParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ status, page: String(page), ...overrides });
    if (!params.get('status')) params.delete('status');
    if (params.get('page') === '1') params.delete('page');
    router.push(`${pathname}?${params}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    pushParams({ status: e.target.value, page: '1' });
  };

  const cancel = async (id: string) => {
    if (!confirm('Annuler cette invitation ?')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const resend = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, { method: 'POST' });
      if (res.ok) router.refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const onSendSuccess = () => {
    setSendOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invitations</h1>
            {total > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {total} invitation{total > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button onClick={() => setSendOpen(true)}>
            <Send className="h-4 w-4" />
            Envoyer une invitation
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <Select options={STATUS_OPTIONS} value={status} onChange={handleStatusChange} className="min-w-48" />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aucune invitation trouvée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Groupes</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Envoyée le</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Expire le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-foreground">{inv.email}</span>
                        {inv.invitedBy && (
                          <p className="text-xs text-muted-foreground mt-0.5">par {inv.invitedBy.username}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {inv.groups.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {inv.groups.map((g) => (
                              <Badge key={g._id} label={g.name} color="info" size="sm" />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={STATUS_LABEL[inv.status] ?? inv.status} color={STATUS_BADGE[inv.status]} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs font-mono">
                        {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs font-mono">
                        {inv.status === 'USED' && inv.usedAt
                          ? `Utilisée le ${new Date(inv.usedAt).toLocaleDateString('fr-FR')}`
                          : new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => resend(inv._id)}
                              disabled={actionLoading === inv._id}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                              title="Renvoyer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => cancel(inv._id)}
                              disabled={actionLoading === inv._id}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Annuler"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} sur {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => pushParams({ page: String(page - 1) })}>
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => pushParams({ page: String(page + 1) })}>
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {sendOpen && <InvitationSendModal onClose={() => setSendOpen(false)} onSuccess={onSendSuccess} />}
    </>
  );
}
