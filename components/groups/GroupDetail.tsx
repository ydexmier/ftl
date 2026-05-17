'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Trophy, ArrowLeft, Crown, UserMinus, Trash2, GitMerge } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { InviteMemberModal } from './InviteMemberModal';

interface Member {
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: string;
  invitedBy: string;
  username: string;
  email: string;
}

interface GroupTournament {
  tournamentId: number;
  name: string;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  group: Group;
  currentUserId: string;
  myRole: 'MEMBER' | 'ADMIN';
  groupTournaments: GroupTournament[];
}

function MergeMemberModal({
  groupId,
  member,
  tournaments,
  onClose,
  onSuccess,
}: {
  groupId: string;
  member: Member;
  tournaments: GroupTournament[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tournamentId, setTournamentId] = useState<number | ''>(tournaments[0]?.tournamentId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!tournamentId) { setError('Sélectionnez un tournoi'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${member.userId}/merge-tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur lors de la fusion');
        return;
      }
      setDone(true);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-foreground">Fusionner les données de {member.username}</h2>
        <p className="text-sm text-muted-foreground">
          Les données de scouting personnelles de ce membre seront importées dans le groupe pour le tournoi sélectionné.
          Des conflits seront créés si les encres diffèrent.
        </p>
        {done ? (
          <p className="text-sm text-success">Fusion effectuée avec succès.</p>
        ) : (
          <>
            {tournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun tournoi lié à ce groupe.</p>
            ) : (
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {tournaments.map((t) => (
                  <option key={t.tournamentId} value={t.tournamentId}>{t.name}</option>
                ))}
              </select>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Fermer</Button>
          {!done && tournaments.length > 0 && (
            <Button onClick={submit} loading={loading}>
              <GitMerge className="h-4 w-4" />
              Fusionner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GroupDetail({ group, currentUserId, myRole, groupTournaments }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(group.members);
  const [showInvite, setShowInvite] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Member | null>(null);

  const isAdmin = myRole === 'ADMIN';

  const removeMember = async (userId: string) => {
    if (!confirm('Retirer ce membre du groupe ?')) return;
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/groups/${group._id}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        if (userId === currentUserId) { router.push('/groups'); return; }
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    } finally {
      setLoadingId(null);
    }
  };

  const toggleRole = async (userId: string, currentRole: 'MEMBER' | 'ADMIN') => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/groups/${group._id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)),
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const leaveGroup = async () => {
    if (!confirm('Quitter ce groupe ?')) return;
    await fetch(`/api/groups/${group._id}/members/${currentUserId}`, { method: 'DELETE' });
    router.push('/groups');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
          )}
        </div>
        {!isAdmin && (
          <Button variant="outline" size="sm" onClick={leaveGroup}>
            Quitter
          </Button>
        )}
      </div>

      {/* Quick nav */}
      <div className="flex gap-2">
        <Link
          href={`/groups/${group._id}/tournaments`}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-accent/50 text-sm font-medium transition-colors"
        >
          <Trophy className="h-4 w-4 text-muted-foreground" />
          Tournois du groupe
        </Link>
      </div>

      {/* Members */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Users className="h-4 w-4" />
            Membres ({members.length})
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              Inviter
            </Button>
          )}
        </div>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-foreground shrink-0 uppercase">
                  {m.username.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{m.username}</span>
                    {m.userId === currentUserId && (
                      <span className="text-xs text-muted-foreground">(moi)</span>
                    )}
                    <Badge
                      label={m.role === 'ADMIN' ? 'Admin' : 'Membre'}
                      color={m.role === 'ADMIN' ? 'primary' : 'secondary'}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
              </div>
              {isAdmin && m.userId !== currentUserId && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMergeTarget(m)}
                    title="Fusionner les données de scouting"
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loadingId === m.userId}
                    onClick={() => toggleRole(m.userId, m.role)}
                    title={m.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir admin'}
                  >
                    <Crown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loadingId === m.userId}
                    onClick={() => removeMember(m.userId)}
                    title="Retirer du groupe"
                    className="hover:text-destructive"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {!isAdmin && m.userId === currentUserId && (
                <Button size="sm" variant="ghost" onClick={leaveGroup} className="hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showInvite && (
        <InviteMemberModal
          groupId={group._id}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); router.refresh(); }}
        />
      )}

      {mergeTarget && (
        <MergeMemberModal
          groupId={group._id}
          member={mergeTarget}
          tournaments={groupTournaments}
          onClose={() => setMergeTarget(null)}
          onSuccess={() => setMergeTarget(null)}
        />
      )}
    </div>
  );
}
