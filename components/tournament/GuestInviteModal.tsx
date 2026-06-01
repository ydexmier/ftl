'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Link, Copy, Check, RefreshCw, Users, UserX } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Spinner } from '@components/ui/Spinner';

interface GuestEntry {
  _id: string;
  username: string | null;
  email: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' | 'REJECTED';
  createdAt: string;
}

interface Props {
  groupId: string;
  tournamentId: number;
  tournamentName: string;
  onClose: () => void;
}

function StatusBadge({ status }: { status: GuestEntry['status'] }) {
  switch (status) {
    case 'PENDING': return <Badge label="En attente" color="warning" size="sm" />;
    case 'ACCEPTED': return <Badge label="Actif" color="success" size="sm" />;
    default: return <Badge label="Inactif" color="secondary" size="sm" />;
  }
}

export function GuestInviteModal({ groupId, tournamentId, tournamentName, onClose }: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const buildLink = (token: string) => `${window.location.origin}/guest/${token}`;

  useEffect(() => {
    fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/magic-link`)
      .then((res) => (res.ok ? res.json() : { link: null }))
      .then((data) => { if (data.link?.token) setLink(buildLink(data.link.token)); })
      .catch(() => {})
      .finally(() => setLoadingLink(false));
  }, [groupId, tournamentId]);

  const loadGuests = useCallback(() => {
    setLoadingGuests(true);
    fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/guests`)
      .then((res) => (res.ok ? res.json() : { guests: [] }))
      .then((data) => setGuests(data.guests ?? []))
      .catch(() => setGuests([]))
      .finally(() => setLoadingGuests(false));
  }, [groupId, tournamentId]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/magic-link`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.link?.token) setLink(buildLink(data.link.token));
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const act = async (accessId: string, action: 'approve' | 'reject' | 'revoke') => {
    setActing(accessId);
    try {
      const res = await fetch(`/api/groups/${groupId}/guests/${accessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setGuests((prev) =>
          prev.map((g) => (g._id === accessId ? { ...g, status: data.access.status } : g)),
        );
      }
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">Accès invités</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{tournamentName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Section lien */}
          <div className="p-5 space-y-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Lien d&apos;accès</h3>
            <p className="text-xs text-muted-foreground">
              Partagez ce lien — chaque personne crée un compte et attend votre validation.
            </p>

            {loadingLink ? (
              <div className="flex justify-center py-3"><Spinner size="sm" /></div>
            ) : link ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground font-mono flex-1 truncate">{link}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={copy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copié !' : 'Copier le lien'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generate}
                    loading={generating}
                    title="Régénérer (invalide l'ancien lien pour les nouveaux entrants)"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Régénérer invalide l&apos;ancien lien — les personnes déjà acceptées conservent leur accès.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground flex-1">Aucun lien actif.</p>
                <Button size="sm" onClick={generate} loading={generating}>
                  <Link className="h-3.5 w-3.5" />
                  Générer
                </Button>
              </div>
            )}
          </div>

          {/* Section invités */}
          <div className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Invités
              {guests.length > 0 && (
                <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">{guests.length}</span>
              )}
            </h3>

            {loadingGuests ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : guests.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Aucun invité pour ce tournoi.
              </p>
            ) : (
              <div className="space-y-1">
                {guests.map((g) => (
                  <div
                    key={g._id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/10 px-3 py-2"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm text-foreground font-medium truncate">
                        {g.username ?? <span className="text-muted-foreground italic">—</span>}
                      </span>
                      {g.email && (
                        <span className="text-xs text-muted-foreground truncate">{g.email}</span>
                      )}
                    </div>
                    <StatusBadge status={g.status} />
                    <div className="flex gap-1 shrink-0">
                      {g.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => act(g._id, 'approve')}
                            disabled={acting === g._id}
                            title="Accepter"
                            className="inline-flex items-center justify-center h-6 w-6 rounded border border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/40 disabled:opacity-50 transition-colors"
                          >
                            {acting === g._id ? <Spinner size="sm" /> : <Check className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={() => act(g._id, 'reject')}
                            disabled={acting === g._id}
                            title="Refuser"
                            className="inline-flex items-center justify-center h-6 w-6 rounded border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {g.status === 'ACCEPTED' && (
                        <button
                          onClick={() => act(g._id, 'revoke')}
                          disabled={acting === g._id}
                          title="Révoquer l'accès"
                          className="inline-flex items-center justify-center h-6 w-6 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 disabled:opacity-50 transition-colors"
                        >
                          {acting === g._id ? <Spinner size="sm" /> : <UserX className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
