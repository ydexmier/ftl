import TournamentPlayersDeck from '@models/TournamentPlayersDeck.js';
import connectToMongoDB from '@/src/lib/db';
import type { Deck } from '@/src/types/ink';

// Exactly one of groupId or userId must be set
export interface DeckScope {
  groupId?: string | null;
  userId?: string | null;
}

function scopeQuery(scope: DeckScope) {
  return {
    groupId: scope.groupId ?? null,
    userId: scope.userId ?? null,
  };
}

export const TournamentPlayersDeckRepository = {
  async findByScope(tournamentId: number, scope: DeckScope) {
    await connectToMongoDB();
    return TournamentPlayersDeck.findOne({ tournamentId, ...scopeQuery(scope) }).lean();
  },

  async upsert(tournamentId: number, players: unknown[], scope: DeckScope) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };
    return TournamentPlayersDeck.findOneAndUpdate(
      query,
      { ...query, players },
      { new: true, upsert: true },
    );
  },

  async deleteMany(tournamentId: number) {
    await connectToMongoDB();
    return TournamentPlayersDeck.deleteMany({ tournamentId });
  },

  async assignDecks(
    tournamentId: number,
    assignments: { playerId: number; bestIdentifier: string; eventBestIdentifier: string; decks: Deck[] }[],
    scope: DeckScope,
  ) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc = await TournamentPlayersDeck.findOne(query) as any;
    if (!doc) {
      doc = await TournamentPlayersDeck.create({ ...query, players: [] });
    }

    const modified: unknown[] = [];

    for (const { playerId, bestIdentifier, eventBestIdentifier, decks } of assignments) {
      const idx = doc.players.findIndex((p: { playerId: number }) => p.playerId === playerId);

      if (idx !== -1) {
        if (!decks || decks.length === 0) {
          doc.players.splice(idx, 1);
          doc.markModified('players');
          modified.push({ playerId, decks });
        } else {
          doc.set(`players.${idx}.decks`, decks);
          modified.push({ ...doc.players[idx].toObject(), decks });
        }
      } else if (decks.length > 0) {
        doc.players.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks });
        modified.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks });
      }
    }

    await doc.save();
    return modified;
  },
};
