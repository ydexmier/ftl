'use client';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import InkButton, { types } from '@components/ui/InkButton';
import Ink from '@components/ui/Ink';
import { PlayerHistory } from '@components/match/PlayerHistory';
import { usePlayerHistory } from '@/src/hooks/usePlayerHistory';

interface PlayerRow {
  playerId: number;
  best_identifier: string;
  event_best_identifier: string;
  decks: string[][];
}

interface PlayerDeckModalProps {
  player: PlayerRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: (playerId: number, decks: string[][], commentSaved: boolean) => void;
  tournamentId: number;
  groupId?: string | null;
}

function sameCombo(a: string[], b: string[]) {
  return a.length === b.length && a.every((ink) => b.includes(ink));
}

type Tab = 'assignation' | 'historique';

export function PlayerDeckModal({
  player,
  open,
  onClose,
  onSaved,
  tournamentId,
  groupId,
}: PlayerDeckModalProps) {
  const [tab, setTab] = useState<Tab>('assignation');
  const [selectedInks, setSelectedInks] = useState<string[]>([]);
  const [blinking, setBlinking] = useState(false);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { entries, loading: historyLoading, error: historyError } = usePlayerHistory(
    tournamentId,
    open && tab === 'historique' ? (player?.playerId ?? null) : null,
    groupId,
  );

  useEffect(() => {
    if (open && player) {
      setTab('assignation');
      setSelectedInks(player.decks[0] ?? []);
      setComment('');
      setError(null);
    }
  }, [open, player]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [comment]);

  const toggleChip = (deck: string[]) => {
    setSelectedInks((prev) => (sameCombo(prev, deck) ? [] : [...deck]));
  };

  const toggleInk = (ink: string) => {
    setSelectedInks((prev) => {
      if (prev.includes(ink)) return prev.filter((i) => i !== ink);
      if (prev.length >= 2) {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 1000);
        return prev;
      }
      return [...prev, ink];
    });
  };

  const handleSave = async () => {
    if (!player) return;
    setSaving(true);
    setError(null);
    try {
      const decks = selectedInks.length > 0 ? [selectedInks] : [];
      const body: { decks: string[][]; groupId?: string; comment?: string } = { decks };
      if (groupId) body.groupId = groupId;
      if (comment.trim()) body.comment = comment.trim();

      const res = await fetch(
        `/api/tournaments/${tournamentId}/players/${player.playerId}/assign_deck`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erreur lors de la sauvegarde');
        return;
      }

      onSaved(player.playerId, decks, !!(comment.trim() && decks.length > 0));
      onClose();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !player) return null;

  const knownCombos = player.decks.filter((d) => d.length > 0);
  const charCount = comment.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — bottom sur mobile, centré sur desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-4" onClick={onClose}>
        <div
          data-testid="player-deck-modal"
          className={[
            'bg-card border-border w-full flex flex-col',
            'rounded-t-2xl border-t border-x md:rounded-xl md:border md:max-w-md md:shadow-xl',
            'max-h-[92dvh] overflow-hidden',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <div className="truncate">
              <h2 className="font-semibold text-foreground truncate">
                {player.event_best_identifier || player.best_identifier}
              </h2>
              {player.event_best_identifier && player.event_best_identifier !== player.best_identifier && (
                <p className="text-xs text-muted-foreground truncate">{player.best_identifier}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-3 p-1"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-5 shrink-0">
            {(['assignation', 'historique'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  'px-3 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                  tab === t
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {t === 'assignation' ? 'Assignation' : 'Historique'}
              </button>
            ))}
          </div>

          {/* Tab: Assignation */}
          {tab === 'assignation' && (
            <>
              <div className="flex flex-col gap-5 px-5 py-4 overflow-y-auto overscroll-contain">
                {/* Combinaisons connues */}
                {knownCombos.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Combinaison{knownCombos.length > 1 ? 's' : ''} connue{knownCombos.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {knownCombos.map((deck, i) => {
                        const active = sameCombo(selectedInks, deck);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleChip(deck)}
                            className={[
                              'flex items-center rounded-full border-2 px-3 py-2 transition-colors min-h-[52px]',
                              active
                                ? 'border-white/60 bg-white/5'
                                : 'border-transparent hover:border-white/20',
                            ].join(' ')}
                          >
                            <Ink type={deck} width={32} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sélection manuelle */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {knownCombos.length > 0 ? 'Ajuster manuellement' : 'Combinaison'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {types.map((type) => (
                      <InkButton
                        key={type}
                        type={type}
                        isSelected={selectedInks.includes(type)}
                        isInactive={selectedInks.length >= 2 && !selectedInks.includes(type)}
                        isBlinking={blinking && selectedInks.includes(type)}
                        onClick={() => toggleInk(type)}
                      />
                    ))}
                  </div>
                  {selectedInks.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <Ink type={selectedInks} width={32} />
                      <span className="text-xs text-muted-foreground">{selectedInks.join(' + ')}</span>
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                {/* Commentaire */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Note (optionnel)
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    placeholder="Deck agressif, joue double tour 3…"
                    rows={2}
                    className={[
                      'w-full resize-none rounded-lg border bg-background px-3 py-2',
                      'text-sm text-foreground placeholder:text-muted-foreground',
                      'border-border focus:border-white/40 focus:outline-none transition-colors',
                      'min-h-[64px]',
                    ].join(' ')}
                  />
                  <p className={['text-xs text-right', charCount > 450 ? 'text-amber-400' : 'text-muted-foreground'].join(' ')}>
                    {charCount}/500
                  </p>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              {/* Footer sticky */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
                {selectedInks.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedInks([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Effacer la sélection
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    Annuler
                  </Button>
                  <Button variant="success" onClick={handleSave} loading={saving}>
                    Valider
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Tab: Historique */}
          {tab === 'historique' && (
            <div className="overflow-y-auto px-5 py-2 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              <PlayerHistory entries={entries} loading={historyLoading} error={historyError} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
