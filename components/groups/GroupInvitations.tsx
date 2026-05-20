'use client';
import { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface Invitation {
  _id: string;
  groupId: string;
  invitedBy: string;
  expiresAt: string;
}

interface Props {
  invitations: Invitation[];
  onDone: () => void;
}

export function GroupInvitations({ invitations, onDone }: Props) {
  const [pending, setPending] = useState(invitations);
  const [loading, setLoading] = useState<string | null>(null);

  const respond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    setLoading(id);
    try {
      await fetch(`/api/groups/invitations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const next = pending.filter((i) => i._id !== id);
      setPending(next);
      if (next.length === 0) onDone();
    } finally {
      setLoading(null);
    }
  };

  if (pending.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Bell className="h-4 w-4 text-primary" />
        Invitations en attente
        <span className="rounded-full px-1.5 py-px text-[10px] font-bold min-w-[18px] text-center leading-4 bg-destructive text-white">
          {pending.length > 99 ? '99+' : pending.length}
        </span>
      </div>
      <div className="space-y-2">
        {pending.map((inv) => (
          <div
            key={inv._id}
            className="flex items-center justify-between gap-3 p-3 rounded-md bg-card border border-border"
          >
            <div className="text-sm text-foreground">
              Vous avez été invité à rejoindre un groupe.
              <span className="block text-xs text-muted-foreground mt-0.5">
                Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="success"
                loading={loading === inv._id}
                onClick={() => respond(inv._id, 'ACCEPTED')}
              >
                <Check className="h-3.5 w-3.5" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={loading === inv._id}
                onClick={() => respond(inv._id, 'REJECTED')}
              >
                <X className="h-3.5 w-3.5" />
                Refuser
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
