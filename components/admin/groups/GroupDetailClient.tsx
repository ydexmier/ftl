'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ChevronDown, Trophy, ArrowLeft, GitMerge, UserPlus, X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { AdminConflictModal } from '@components/groups/AdminConflictModal';
import { InviteMemberModal } from './InviteMemberModal';
import { AddTournamentModal } from './AddTournamentModal';
import { MergeMemberModal } from './MergeMemberModal';
import type { Member, Tournament, RawConflict } from './MergeMemberModal';

interface PendingInvitation {
  _id: string;
  invitedUserId: string;
  username: string;
  email: string;
  invitedByUsername: string;
  expiresAt: string;
}

interface ConflictModalState {
  conflicts: RawConflict[];
  tournamentName: string;
  member: Member;
}

interface Props {
  groupId: string;
  groupName: string;
  description?: string;
  members: Member[];
  tournaments: Tournament[];
  pendingInvitations: PendingInvitation[];
}

export function GroupDetailClient({ groupId, groupName, description, members, tournaments, pendingInvitations: initialPendingInvitations }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'members' | 'tournaments'>('members');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addTournamentOpen, setAddTournamentOpen] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [removeTournamentLoading, setRemoveTournamentLoading] = useState<number | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Member | null>(null);
  const [conflictModal, setConflictModal] = useState<ConflictModalState | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState(initialPendingInvitations);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const onMutationSuccess = () => {
    setInviteOpen(false);
    setAddTournamentOpen(false);
    router.refresh();
  };

  const updateRole = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    setRoleLoading(userId);
    await fetch(`/api/admin/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setRoleLoading(null);
    router.refresh();
  };

  const removeMember = async (userId: string) => {
    setRemoveLoading(userId);
    await fetch(`/api/admin/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
    setRemoveLoading(null);
    router.refresh();
  };

  const removeTournament = async (tournamentId: number) => {
    setRemoveTournamentLoading(tournamentId);
    await fetch(`/api/admin/groups/${groupId}/tournaments/${tournamentId}`, { method: 'DELETE' });
    setRemoveTournamentLoading(null);
    router.refresh();
  };

  const cancelInvitation = async (invId: string) => {
    setCancelLoading(invId);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/invitations/${invId}`, { method: 'DELETE' });
      if (res.ok) setPendingInvitations((prev) => prev.filter((i) => i._id !== invId));
    } finally {
      setCancelLoading(null);
    }
  };

  const handleMergeConflicts = (conflicts: RawConflict[], tournamentName: string) => {
    const member = mergeTarget!;
    setMergeTarget(null);
    setConflictModal({ conflicts, tournamentName, member });
  };

  return (
    <>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div>
          <Link href="/admin/groups" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" />
            Tous les groupes
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{groupName}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>

        {/* Onglets */}
        <div className="flex gap-1 border-b border-border">
          {(['members', 'tournaments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'members' ? `Membres (${members.length})` : `Tournois (${tournaments.length})`}
            </button>
          ))}
        </div>

        {/* Membres */}
        {tab === 'members' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Inviter un membre
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucun membre.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Utilisateur</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 text-left">Rôle</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.userId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/users/${m.userId}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {m.username}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{m.email}</td>
                        <td className="px-4 py-3">
                          <Badge label={m.role} color={m.role === 'ADMIN' ? 'info' : 'secondary'} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setMergeTarget(m)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors"
                              title="Fusionner les données de scouting"
                            >
                              <GitMerge className="h-3.5 w-3.5" />
                            </button>
                            <div className="relative">
                              <select
                                value={m.role}
                                onChange={(e) => updateRole(m.userId, e.target.value as 'ADMIN' | 'MEMBER')}
                                disabled={roleLoading === m.userId}
                                className="appearance-none pl-2 pr-6 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                              >
                                <option value="MEMBER">MEMBER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                            </div>
                            <button
                              onClick={() => removeMember(m.userId)}
                              disabled={removeLoading === m.userId}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Retirer du groupe"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {pendingInvitations.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invitations en attente ({pendingInvitations.length})
                </h3>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Utilisateur</th>
                        <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Invité par</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Expire le</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvitations.map((inv) => (
                        <tr key={inv._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{inv.username}</td>
                          <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{inv.email}</td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{inv.invitedByUsername}</td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs font-mono">
                            {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => cancelInvitation(inv._id)}
                              disabled={cancelLoading === inv._id}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Annuler l'invitation"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tournois */}
        {tab === 'tournaments' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddTournamentOpen(true)}>
                <Trophy className="h-4 w-4" />
                Lier un tournoi
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {tournaments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucun tournoi lié.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Tournoi</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.tournamentId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/tournaments/${t.tournamentId}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {t.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs font-mono">
                          {t.start_datetime ? new Date(t.start_datetime).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={t.status} color={t.status === 'ACTIVE' ? 'success' : 'secondary'} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeTournament(t.tournamentId)}
                            disabled={removeTournamentLoading === t.tournamentId}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Retirer du groupe"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {inviteOpen && (
        <InviteMemberModal groupId={groupId} onClose={() => setInviteOpen(false)} onSuccess={onMutationSuccess} />
      )}
      {addTournamentOpen && (
        <AddTournamentModal groupId={groupId} onClose={() => setAddTournamentOpen(false)} onSuccess={onMutationSuccess} />
      )}
      {mergeTarget && (
        <MergeMemberModal
          groupId={groupId}
          member={mergeTarget}
          tournaments={tournaments}
          onClose={() => setMergeTarget(null)}
          onConflicts={handleMergeConflicts}
          onSuccess={() => { setMergeTarget(null); router.refresh(); }}
        />
      )}
      {conflictModal && (
        <AdminConflictModal
          groupId={groupId}
          tournamentName={conflictModal.tournamentName}
          conflicts={conflictModal.conflicts.map((c) => ({
            ...c,
            userId: { _id: conflictModal.member.userId, username: conflictModal.member.username },
          }))}
          onConflictResolved={(id) => {
            setConflictModal((prev) =>
              prev ? { ...prev, conflicts: prev.conflicts.filter((c) => c._id !== id) } : null,
            );
          }}
          onClose={() => { setConflictModal(null); router.refresh(); }}
        />
      )}
    </>
  );
}
