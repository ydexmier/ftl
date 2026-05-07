'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, ChevronRight, Bell } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupInvitations } from './GroupInvitations';

interface GroupSummary {
  _id: string;
  name: string;
  description?: string;
  memberCount: number;
  myRole: 'MEMBER' | 'ADMIN';
  createdAt: string;
}

interface InvitationSummary {
  _id: string;
  groupId: string;
  invitedBy: string;
  expiresAt: string;
}

interface Props {
  groups: GroupSummary[];
  invitations: InvitationSummary[];
  currentUserId: string;
}

export function GroupsList({ groups, invitations, currentUserId }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvitations, setShowInvitations] = useState(invitations.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes groupes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos groupes et collaborez sur le scouting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invitations.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowInvitations((v) => !v)}>
              <Bell className="h-4 w-4" />
              {invitations.length} invitation{invitations.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Créer un groupe
          </Button>
        </div>
      </div>

      {showInvitations && invitations.length > 0 && (
        <GroupInvitations
          invitations={invitations}
          onDone={() => { setShowInvitations(false); router.refresh(); }}
        />
      )}

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Vous n&apos;êtes membre d&apos;aucun groupe.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez un groupe ou attendez une invitation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <Link
              key={g._id}
              href={`/groups/${g._id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{g.name}</span>
                    {g.myRole === 'ADMIN' && <Badge label="Admin" color="primary" size="sm" />}
                  </div>
                  {g.description && (
                    <p className="text-sm text-muted-foreground truncate">{g.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-sm text-muted-foreground">
                  {g.memberCount} membre{g.memberCount > 1 ? 's' : ''}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); router.push(`/groups/${id}`); }}
        />
      )}
    </div>
  );
}
