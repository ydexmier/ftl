'use client';
import { useState, useEffect, useCallback } from 'react';
import { UserX, UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Spinner } from '@components/ui/Spinner';
import { ExternalAccessModal } from './ExternalAccessModal';
import type { TournamentExternalAccess, TournamentExternalAccessStatus } from '@/src/types/group';

interface Props {
  groupId: string;
  tournamentId: number;
  tournamentName: string;
}

const STATUS_LABELS: Record<TournamentExternalAccessStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Actif',
  REVOKED: 'Révoqué',
  EXPIRED: 'Expiré',
  REJECTED: 'Refusé',
};

const STATUS_COLORS: Record<TournamentExternalAccessStatus, 'secondary' | 'success' | 'error' | 'default'> = {
  PENDING: 'secondary',
  ACCEPTED: 'success',
  REVOKED: 'error',
  EXPIRED: 'default',
  REJECTED: 'secondary',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ExternalAccessList({ groupId, tournamentId, tournamentName }: Props) {
  const [accesses, setAccesses] = useState<TournamentExternalAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAccesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/external-access`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setAccesses(data.accesses ?? []);
    } catch {
      setError('Impossible de charger les accès invités');
    } finally {
      setLoading(false);
    }
  }, [groupId, tournamentId]);

  useEffect(() => { fetchAccesses(); }, [fetchAccesses]);

  const revoke = async (accessId: string) => {
    setRevoking(accessId);
    setError(null);
    try {
      const res = await fetch(`/api/groups/external-access/${accessId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erreur lors de la révocation');
        return;
      }
      setAccesses(prev => prev.map(a => a._id === accessId ? { ...a, status: 'REVOKED' } : a));
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Accès invités</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Personnes externes invitées à participer au scouting de ce tournoi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchAccesses} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Inviter
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : accesses.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Aucun accès invité pour ce tournoi.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60">
              <tr>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Pseudo</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Statut</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Expire le</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Invité le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {accesses.map((a) => (
                <tr key={a._id} className="bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">
                    {a.displayName ?? <span className="text-zinc-500 italic">En attente</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{a.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[a.status]} label={STATUS_LABELS[a.status]} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(a.expiresAt)}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {(a.status === 'PENDING' || a.status === 'ACCEPTED') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={revoking === a._id}
                        onClick={() => revoke(a._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Révoquer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ExternalAccessModal
          groupId={groupId}
          tournamentId={tournamentId}
          tournamentName={tournamentName}
          onClose={() => setShowModal(false)}
          onSuccess={fetchAccesses}
        />
      )}
    </div>
  );
}
