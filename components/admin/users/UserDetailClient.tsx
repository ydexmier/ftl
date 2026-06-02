'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ShieldOff, Target, Users } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Alert } from '@components/ui/Alert';
import { UserEditModal, type UserForEdit } from './UserEditModal';
import { UserDeleteConfirm } from './UserDeleteConfirm';
import type { UserRole } from '@models/User';
import type { AuditAction } from '@models/AuditLog';
import { cn } from '@components/ui/cn';

const ROLE_BADGE: Record<UserRole, React.ComponentProps<typeof Badge>['color']> = {
  USER: 'secondary',
  ADMIN: 'info',
  SUPERUSER: 'error',
};

const ACTION_STYLES: Partial<Record<AuditAction, string>> = {
  LOGIN_SUCCESS: 'bg-green-500/15 text-green-400',
  LOGIN_FAIL: 'bg-destructive/15 text-destructive',
  USER_CREATED: 'bg-blue-500/15 text-blue-400',
  USER_UPDATED: 'bg-blue-500/15 text-blue-400',
  USER_DELETED: 'bg-destructive/15 text-destructive',
  PASSWORD_CHANGED: 'bg-amber-500/15 text-amber-400',
  ADMIN_ACTION: 'bg-purple-500/15 text-purple-400',
};

interface AuditLogRow {
  _id: string;
  action: AuditAction;
  username: string;
  timestamp: string;
}

interface ScoutingTournamentStat {
  tournamentId: number;
  tournamentName: string;
  count: number;
}

interface UserGroupRow {
  _id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

interface Props {
  user: UserForEdit & { createdAt: string; updatedAt: string };
  activeSessions: number;
  recentLogs: AuditLogRow[];
  scoutingStats: { total: number; byTournament: ScoutingTournamentStat[] };
  groups: UserGroupRow[];
}

export function UserDetailClient({ user, activeSessions, recentLogs, scoutingStats, groups }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  const onMutationSuccess = () => {
    setEditOpen(false);
    setDeleteOpen(false);
    router.refresh();
  };

  const onDeleteSuccess = () => {
    router.push('/admin/users');
  };

  const revokeSessions = async () => {
    setRevoking(true);
    setRevokeError('');
    setRevokeSuccess(false);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/sessions`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setRevokeError(data.error ?? 'Erreur');
        return;
      }
      setRevokeSuccess(true);
      router.refresh();
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary uppercase">{user.username[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">@{user.username}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            <InfoCell label="Rôle">
              <Badge label={user.role} color={ROLE_BADGE[user.role]} />
            </InfoCell>
            <InfoCell label="Sessions actives">
              <span className={cn('font-semibold', activeSessions > 0 ? 'text-green-400' : 'text-muted-foreground')}>
                {activeSessions}
              </span>
            </InfoCell>
            <InfoCell label="Créé le">
              <span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
            </InfoCell>
            <InfoCell label="Modifié le">
              <span className="text-sm text-muted-foreground">{new Date(user.updatedAt).toLocaleDateString('fr-FR')}</span>
            </InfoCell>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Sessions actives</h2>
            <span className="text-sm text-muted-foreground">{activeSessions} session{activeSessions !== 1 ? 's' : ''}</span>
          </div>
          {revokeError && <Alert severity="error">{revokeError}</Alert>}
          {revokeSuccess && <Alert severity="success">Toutes les sessions ont été révoquées.</Alert>}
          <Button
            variant="outline"
            size="sm"
            loading={revoking}
            disabled={activeSessions === 0}
            onClick={revokeSessions}
            className="self-start"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Révoquer toutes les sessions
          </Button>
        </div>

        {/* Groupes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Groupes</h2>
            </div>
            <span className="text-sm font-semibold text-foreground">{groups.length}</span>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun groupe.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {groups.map((g) => (
                  <tr key={g._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/admin/groups/${g._id}`} className="text-foreground hover:text-primary transition-colors font-medium">
                        {g.name}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        g.role === 'ADMIN' ? 'bg-blue-900/40 text-blue-400' : 'bg-muted text-muted-foreground',
                      )}>
                        {g.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Scouting */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Scouting</h2>
            </div>
            <span className="text-sm font-semibold text-foreground">{scoutingStats.total} report{scoutingStats.total !== 1 ? 's' : ''}</span>
          </div>
          {scoutingStats.byTournament.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun report enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {scoutingStats.byTournament.map((t) => (
                  <tr key={t.tournamentId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-foreground truncate max-w-xs">{t.tournamentName}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">
                      {t.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit récent */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Activité récente</h2>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune activité enregistrée.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', ACTION_STYLES[log.action] ?? 'bg-muted text-muted-foreground')}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editOpen && <UserEditModal user={user} onClose={() => setEditOpen(false)} onSuccess={onMutationSuccess} />}
      {deleteOpen && <UserDeleteConfirm userId={user._id} username={user.username} onClose={() => setDeleteOpen(false)} onSuccess={onDeleteSuccess} />}
    </>
  );
}

function InfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </div>
  );
}
