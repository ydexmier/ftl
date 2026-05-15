'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bug, Lightbulb } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import { cn } from '@components/ui/cn';
import type { FeedbackStatus, FeedbackType } from '@models/Feedback';

interface FeedbackItem {
  _id: string;
  type: FeedbackType;
  title: string;
  description: string;
  page: string;
  username?: string;
  status: FeedbackStatus;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'open', label: 'Ouvert' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'done', label: 'Résolu' },
  { value: 'closed', label: 'Fermé' },
];

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  'open': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'in-progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'done': 'bg-green-500/15 text-green-400 border-green-500/30',
  'closed': 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  'open': 'Ouvert',
  'in-progress': 'En cours',
  'done': 'Résolu',
  'closed': 'Fermé',
};

function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function TypeIcon({ type }: { type: FeedbackType }) {
  return type === 'bug'
    ? <Bug className="h-3.5 w-3.5 text-destructive shrink-0" />
    : <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
}

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (status: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/feedback?${params}`);
      const data = await res.json();
      setItems(data.feedbacks ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback(statusFilter, page);
  }, [statusFilter, page, fetchFeedback]);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setUpdating(id);
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setItems((prev) => prev.map((item) => item._id === id ? { ...item, status } : item));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feedback utilisateurs</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">{total} entrée{total > 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="flex gap-3">
        <div className="w-48">
          <Select
            label="Statut"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="md" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Aucun feedback.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item._id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <TypeIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setExpanded(expanded === item._id ? null : item._id)}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left"
                    >
                      {item.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{item.username || 'Anonyme'}</span>
                      <span>·</span>
                      <span className="font-mono truncate max-w-[200px]">{item.page}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {expanded === item._id && (
                  <div className="ml-6 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['open', 'in-progress', 'done', 'closed'] as FeedbackStatus[]).map((s) => (
                        <button
                          key={s}
                          disabled={item.status === s || updating === item._id}
                          onClick={() => updateStatus(item._id, s)}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50',
                            item.status === s
                              ? STATUS_STYLES[s]
                              : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                          )}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} sur {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
