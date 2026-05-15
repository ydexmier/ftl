'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import InkButton, { types } from '@components/ui/InkButton';
import Ink from '@components/ui/Ink';

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
  onSaved: (playerId: number, decks: string[][]) => void;
  tournamentId: number;
  groupId?: string | null;
}

function sameCombo(a: string[], b: string[]) {
  return a.length === b.length && a.every((ink) => b.includes(ink));
}

export function PlayerDeckModal({
  player,
  open,
  onClose,
  onSaved,
  tournamentId,
  groupId,
}: PlayerDeckModalProps) {
  const [selectedInks, setSelectedInks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && player) {
      // Pré-sélectionner la première combinaison si elle existe
      setSelectedInks(player.decks[0] ?? []);
      setError(null);
    }
  }, [open, player]);

  const toggleChip = (deck: string[]) => {
    setSelectedInks((prev) => (sameCombo(prev, deck) ? [] : [...deck]));
  };

  const toggleInk = (ink: string) => {
    setSelectedInks((prev) =>
      prev.includes(ink) ? prev.filter((i) => i !== ink) : [...prev, ink],
    );
  };

  const handleSave = async () => {
    if (!player) return;
    setSaving(true);
    setError(null);
    try {
      const decks = selectedInks.length > 0 ? [selectedInks] : [];
      const body: { decks: string[][]; groupId?: string } = { decks };
      if (groupId) body.groupId = groupId;

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

      onSaved(player.playerId, decks);
      onClose();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !player) return null;

  const knownCombos = player.decks.filter((d) => d.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl flex flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="truncate">
            <h2 className="font-semibold text-foreground truncate">{player.event_best_identifier || player.best_identifier}</h2>
            {player.event_best_identifier && player.event_best_identifier !== player.best_identifier && (
              <p className="text-xs text-muted-foreground truncate">{player.best_identifier}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <hr className="border-border" />

        {/* Combinaisons connues (raccourcis) */}
        {knownCombos.length > 0 && (
          <div className="space-y-2">
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
                      'flex items-center rounded-full border-2 px-2 py-1 transition-colors',
                      active
                        ? 'border-white/60 bg-white/5'
                        : 'border-transparent hover:border-white/20',
                    ].join(' ')}
                  >
                    <Ink type={deck} width={28} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sélection manuelle */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {knownCombos.length > 0 ? 'Ajuster manuellement' : 'Combinaison'}
          </p>
          <div className="flex flex-wrap gap-1">
            {types.map((type) => (
              <InkButton
                key={type}
                type={type}
                isSelected={selectedInks.includes(type)}
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

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-between items-center pt-2">
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
      </div>
    </div>
  );
}
