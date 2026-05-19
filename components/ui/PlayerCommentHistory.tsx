'use client';
import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Check, XCircle, Send } from 'lucide-react';
import Ink from '@components/ui/Ink';
import { Spinner } from '@components/ui/Spinner';

interface Comment {
  _id: string;
  content: string;
  inks: string[];
  authorId: { _id: string; username: string } | string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlayerCommentHistoryProps {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  playerId: number;
  playerName: string;
  groupId?: string | null;
  currentUserId: string;
  isGroupAdmin?: boolean;
  onCommentAdded?: () => void;
}

function authorName(comment: Comment): string {
  if (typeof comment.authorId === 'object') return comment.authorId.username;
  return 'Inconnu';
}

function authorId(comment: Comment): string {
  if (typeof comment.authorId === 'object') return comment.authorId._id;
  return String(comment.authorId);
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function PlayerCommentHistory({
  open,
  onClose,
  tournamentId,
  playerId,
  playerName,
  groupId,
  currentUserId,
  isGroupAdmin = false,
  onCommentAdded,
}: PlayerCommentHistoryProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewContent('');
      setEditingId(null);
      setEditContent('');
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    fetch(`/api/tournaments/${tournamentId}/players/${playerId}/comments?${params}`)
      .then((r) => (r.ok ? r.json() : { comments: [] }))
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setError('Impossible de charger les commentaires'))
      .finally(() => setLoading(false));
  }, [open, tournamentId, playerId, groupId]);

  const startEdit = (c: Comment) => {
    setEditingId(c._id);
    setEditContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/player-comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (!res.ok) { setError('Erreur lors de la modification'); return; }
      const data = await res.json();
      setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, content: data.comment.content, updatedAt: data.comment.updatedAt } : c));
      cancelEdit();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      const res = await fetch(`/api/player-comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) { setError('Erreur lors de la suppression'); return; }
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      setError('Erreur réseau');
    }
  };

  const submitComment = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: { content: string; groupId?: string } = { content: newContent.trim() };
      if (groupId) body.groupId = groupId;
      const res = await fetch(`/api/tournaments/${tournamentId}/players/${playerId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError('Erreur lors de l\'ajout'); return; }
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewContent('');
      onCommentAdded?.();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-4"
        onClick={onClose}
      >
        <div
          className={[
            'bg-card border-border w-full flex flex-col',
            'rounded-t-2xl border-t border-x md:rounded-xl md:border md:max-w-lg md:shadow-xl',
            'max-h-[85dvh]',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <div>
              <h2 className="font-semibold text-foreground">Commentaires</h2>
              <p className="text-xs text-muted-foreground truncate">{playerName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors ml-3 p-1"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <hr className="border-border mx-5 shrink-0" />

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            )}

            {!loading && comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun commentaire pour ce joueur.
              </p>
            )}

            {!loading && comments.map((c) => {
              const isAuthor = authorId(c) === currentUserId;
              const canDelete = isAuthor || isGroupAdmin;
              const isEditing = editingId === c._id;

              return (
                <div key={c._id} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {authorName(c)}
                      </span>
                      {c.inks.length > 0 && <Ink type={c.inks} width={20} />}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{relativeDate(c.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value.slice(0, 500))}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-white/40 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Annuler
                        </button>
                        <button
                          onClick={() => saveEdit(c._id)}
                          disabled={saving}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                      {(isAuthor || canDelete) && (
                        <div className="flex gap-3 justify-end">
                          {isAuthor && (
                            <button
                              onClick={() => startEdit(c)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3 w-3" /> Modifier
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteComment(c._id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" /> Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </div>

          {/* New comment form */}
          <div className="shrink-0 px-5 py-4 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2 items-end">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value.slice(0, 500))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
                }}
                placeholder="Ajouter un commentaire…"
                rows={2}
                className={[
                  'flex-1 resize-none rounded-lg border bg-background px-3 py-2',
                  'text-sm text-foreground placeholder:text-muted-foreground',
                  'border-border focus:border-white/40 focus:outline-none transition-colors',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting || !newContent.trim()}
                className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-80"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
