import mongoose from 'mongoose';
import TournamentPlayersDeckModel, {
  type ITournamentPlayersDeck,
  type ITournamentPlayerDeck,
} from '@models/TournamentPlayersDeck';
import connectToMongoDB from '@/src/lib/db';
import type { Deck } from '@/src/types/ink';

// Exactly one of groupId or userId must be set
export interface DeckScope {
  groupId?: string | null;
  userId?: string | null;
}

export interface PlayerInfo {
  id: number;
  best_identifier: string;
  pronouns: string | null;
  eventBestIdentifier: string;
}

export interface PlayersPage {
  players: Array<{ playerId: number; best_identifier: string; event_best_identifier: string; decks: string[][] }>;
  total: number;
}

function scopeQuery(scope: DeckScope) {
  return {
    groupId: scope.groupId ?? null,
    userId: scope.userId ?? null,
  };
}

// Aggregation $match doesn't auto-cast strings to ObjectId — do it explicitly.
function scopeQueryForAgg(scope: DeckScope) {
  return {
    groupId: scope.groupId ? new mongoose.Types.ObjectId(scope.groupId) : null,
    userId: scope.userId ? new mongoose.Types.ObjectId(scope.userId) : null,
  };
}

function toPlayerDoc(p: PlayerInfo) {
  return {
    playerId: p.id,
    best_identifier: p.best_identifier,
    pronouns: p.pronouns,
    event_best_identifier: p.eventBestIdentifier,
    decks: [],
  };
}

export const TournamentPlayersDeckRepository = {
  async findByScope(tournamentId: number, scope: DeckScope) {
    await connectToMongoDB();
    return TournamentPlayersDeckModel.findOne({ tournamentId, ...scopeQuery(scope) }).lean();
  },

  async upsert(tournamentId: number, players: unknown[], scope: DeckScope) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };
    return TournamentPlayersDeckModel.findOneAndUpdate(
      query,
      { ...query, players },
      { new: true, upsert: true },
    );
  },

  async deleteMany(tournamentId: number) {
    await connectToMongoDB();
    return TournamentPlayersDeckModel.deleteMany({ tournamentId });
  },

  async deleteManyByGroupId(groupId: string) {
    await connectToMongoDB();
    return TournamentPlayersDeckModel.deleteMany({ groupId });
  },

  async deleteUserScope(tournamentId: number, userId: string) {
    await connectToMongoDB();
    return TournamentPlayersDeckModel.findOneAndDelete({ tournamentId, userId, groupId: null });
  },

  // Adds players (decks: []) to one scope without overwriting existing deck assignments.
  async upsertMissingPlayers(tournamentId: number, players: PlayerInfo[], scope: DeckScope) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };
    const doc = await TournamentPlayersDeckModel.findOne(query, { 'players.playerId': 1 }).lean();
    const toInsert = players.map(toPlayerDoc);

    if (!doc) {
      try {
        await TournamentPlayersDeckModel.findOneAndUpdate(
          query,
          { $setOnInsert: { ...query, players: toInsert } },
          { upsert: true },
        );
      } catch (err: unknown) {
        // Stale unique index on tournamentId from before group scoping — ignore.
        if ((err as { code?: number }).code !== 11000) throw err;
      }
      return;
    }

    const existingIds = new Set(doc.players.map((p) => p.playerId));
    const missing = toInsert.filter((p) => !existingIds.has(p.playerId));
    if (missing.length > 0) {
      await TournamentPlayersDeckModel.updateOne(query, {
        $push: { players: { $each: missing } },
      });
    }
  },

  // Updates all existing TournamentPlayersDeck documents for a tournament (any scope).
  // Called after a round fetch to keep every scope in sync.
  async upsertMissingPlayersAllExisting(tournamentId: number, players: PlayerInfo[]) {
    await connectToMongoDB();
    const docs = await TournamentPlayersDeckModel.find(
      { tournamentId },
      { _id: 1, 'players.playerId': 1 },
    ).lean();

    const toInsert = players.map(toPlayerDoc);

    for (const doc of docs) {
      const existingIds = new Set(doc.players.map((p) => p.playerId));
      const missing = toInsert.filter((p) => !existingIds.has(p.playerId));
      if (missing.length > 0) {
        await TournamentPlayersDeckModel.updateOne(
          { _id: doc._id },
          { $push: { players: { $each: missing } } },
        );
      }
    }
  },

  // Paginated query using MongoDB aggregation on the players array.
  async findPlayersPaginated(
    tournamentId: number,
    scope: DeckScope,
    options: { search?: string; page?: number; perPage?: number } = {},
  ): Promise<PlayersPage> {
    const { search = '', page = 1, perPage = 25 } = options;
    await connectToMongoDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: { tournamentId, ...scopeQueryForAgg(scope) } },
      { $unwind: '$players' },
    ];
    if (search.trim()) {
      pipeline.push({ $match: { 'players.best_identifier': { $regex: search.trim(), $options: 'i' } } });
    }
    pipeline.push(
      { $sort: { 'players.best_identifier': 1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
            { $replaceRoot: { newRoot: '$players' } },
          ],
          total: [{ $count: 'count' }],
        },
      },
    );

    const [result] = await TournamentPlayersDeckModel.aggregate(pipeline);
    if (!result) return { players: [], total: 0 };

    return {
      players: (result.data as ITournamentPlayerDeck[]).map((p) => {
        const raw = p.event_best_identifier ?? '';
        return {
          playerId: p.playerId,
          best_identifier: p.best_identifier,
          // event_best_identifier stores the pseudo (user_event_status.best_identifier).
          // Older documents may contain an actual image URL — discard those.
          event_best_identifier: /^https?:\/\//.test(raw) ? '' : raw,
          decks: p.decks ?? [],
        };
      }),
      total: (result.total as Array<{ count: number }>)[0]?.count ?? 0,
    };
  },

  // Updates event_best_identifier for existing players that currently have an empty value.
  async syncPlayerIdentifiers(tournamentId: number, players: PlayerInfo[]) {
    await connectToMongoDB();
    const ops = players
      .filter((p) => p.eventBestIdentifier)
      .map((p) => ({
        updateMany: {
          filter: { tournamentId, 'players.playerId': p.id },
          update: { $set: { 'players.$[elem].event_best_identifier': p.eventBestIdentifier } },
          arrayFilters: [{ 'elem.playerId': p.id, 'elem.event_best_identifier': '' }],
        },
      }));
    if (ops.length > 0) await TournamentPlayersDeckModel.bulkWrite(ops);
  },

  async assignDecks(
    tournamentId: number,
    assignments: { playerId: number; bestIdentifier: string; eventBestIdentifier: string; decks: Deck[] }[],
    scope: DeckScope,
  ) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };

    let doc: ITournamentPlayersDeck | null = await TournamentPlayersDeckModel.findOne(query);
    if (!doc) {
      try {
        doc = await TournamentPlayersDeckModel.create({ ...query, players: [] });
      } catch (err: unknown) {
        // Stale unique index on tournamentId from before group scoping — ignore.
        if ((err as { code?: number }).code === 11000) {
          doc = await TournamentPlayersDeckModel.findOne({ tournamentId });
          if (!doc) throw err;
        } else {
          throw err;
        }
      }
    }

    const modified: unknown[] = [];

    for (const { playerId, bestIdentifier, eventBestIdentifier, decks } of assignments) {
      const idx = doc.players.findIndex((p) => p.playerId === playerId);

      if (idx !== -1) {
        if (!decks || decks.length === 0) {
          doc.players.splice(idx, 1);
          doc.markModified('players');
          modified.push({ playerId, decks });
        } else {
          doc.set(`players.${idx}.decks`, decks);
          modified.push({ ...doc.players[idx], decks });
        }
      } else if (decks.length > 0) {
        doc.players.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, pronouns: null, decks });
        modified.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks });
      }
    }

    await doc.save();
    return modified;
  },
};
