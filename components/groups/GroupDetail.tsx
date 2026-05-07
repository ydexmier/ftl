'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Trophy, ArrowLeft, Crown, UserMinus, RefreshCw, Trash2 } from 'lucide-react';
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
}

export function GroupDetail({ group, currentUserId, myRole }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(group.members);
  const [showInvite, setShowInvite] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
    </div>
  );
}
