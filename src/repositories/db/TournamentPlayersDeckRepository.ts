import mongoose from 'mongoose';
import TournamentPlayersDeckModel, {
  type ITournamentPlayersDeck,
  type ITournamentPlayerDeck,
} from '@models/TournamentPlayersDeck';
import connectToMongoDB from '@/src/lib/db';
import type { Deck } from '@/src/types/ink';
import { normalizeInkCombo } from '@/src/domain/value-objects/Ink';

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
    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId, ...scopeQuery(scope) }).lean();
    if (!doc) return doc;
    return {
      ...doc,
      players: doc.players.map((p) => ({
        ...p,
        decks: (p.decks as string[][]).map((d) => normalizeInkCombo(d)),
      })),
    };
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
    options: { search?: string; page?: number; perPage?: number; sortOrder?: 'asc' | 'desc' } = {},
  ): Promise<PlayersPage> {
    const { search = '', page = 1, perPage = 25, sortOrder = 'asc' } = options;
    await connectToMongoDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: { tournamentId, ...scopeQueryForAgg(scope) } },
      { $unwind: '$players' },
    ];
    if (search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      pipeline.push({ $match: { $or: [{ 'players.best_identifier': regex }, { 'players.event_best_identifier': regex }] } });
    }
    const sortDir = sortOrder === 'desc' ? -1 : 1;
    pipeline.push(
      { $sort: { 'players.event_best_identifier': sortDir, 'players.best_identifier': sortDir } },
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
          decks: (p.decks as string[][] ?? []).map((d) => normalizeInkCombo(d)),
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

  async getScoutingStats(tournamentId: number, scope: DeckScope) {
    await connectToMongoDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: { tournamentId, ...scopeQueryForAgg(scope) } },
      { $unwind: '$players' },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                scouted: {
                  $sum: { $cond: [{ $gt: [{ $size: '$players.decks' }, 0] }, 1, 0] },
                },
              },
            },
          ],
          deckDistribution: [
            { $match: { 'players.decks.0': { $exists: true } } },
            { $unwind: '$players.decks' },
            { $group: { _id: '$players.decks', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
          ],
        },
      },
    ];

    const [result] = await TournamentPlayersDeckModel.aggregate(pipeline);
    const totals = (result?.totals as Array<{ total: number; scouted: number }>)?.[0] ?? { total: 0, scouted: 0 };
    const rawDistribution = (result?.deckDistribution as Array<{ _id: string[]; count: number }> ?? []);
    const mergedMap = new Map<string, { inks: string[]; count: number }>();
    for (const d of rawDistribution) {
      const normalized = normalizeInkCombo(d._id);
      const key = normalized.join('/');
      const existing = mergedMap.get(key);
      if (existing) existing.count += d.count;
      else mergedMap.set(key, { inks: normalized, count: d.count });
    }
    const distribution = Array.from(mergedMap.values()).sort((a, b) => b.count - a.count);

    return {
      total: totals.total,
      scouted: totals.scouted,
      unscouted: totals.total - totals.scouted,
      coverage: totals.total > 0 ? Math.round((totals.scouted / totals.total) * 100) : 0,
      deckDistribution: distribution,
    };
  },

  async getDetailedScoutingStats(tournamentId: number, scope: DeckScope) {
    await connectToMongoDB();
    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId, ...scopeQuery(scope) }).lean() as ITournamentPlayersDeck | null;
    const players = doc?.players ?? [];

    let fullyScouted = 0;
    let partiallyScouted = 0;
    let unscouted = 0;
    const deckCountMap = new Map<string, { inks: string[]; count: number }>();

    for (const player of players) {
      const decks = player.decks as string[][];
      if (decks.length === 0) {
        unscouted++;
      } else if (decks.length === 1 && decks[0].length === 2) {
        fullyScouted++;
        const normalized = normalizeInkCombo(decks[0]);
        const key = normalized.join('/');
        const existing = deckCountMap.get(key);
        if (existing) existing.count++;
        else deckCountMap.set(key, { inks: normalized, count: 1 });
      } else {
        partiallyScouted++;
      }
    }

    return {
      total: players.length,
      fullyScouted,
      partiallyScouted,
      unscouted,
      inkDistribution: Array.from(deckCountMap.values()).sort((a, b) => b.count - a.count),
    };
  },

  async assignDecks(
    tournamentId: number,
    assignments: { playerId: number; bestIdentifier: string; eventBestIdentifier: string; decks: Deck[] }[],
    scope: DeckScope,
  ) {
    await connectToMongoDB();
    const query = { tournamentId, ...scopeQuery(scope) };

    // Ensure the parent document exists. $setOnInsert is a no-op if it already exists,
    // making this safe under concurrent calls.
    await TournamentPlayersDeckModel.findOneAndUpdate(
      query,
      { $setOnInsert: { ...query, players: [] } },
      { upsert: true },
    );

    const modified: Array<{
      playerId: number;
      best_identifier: string;
      event_best_identifier: string;
      decks: string[][];
    }> = [];

    for (const { playerId, bestIdentifier, eventBestIdentifier, decks } of assignments) {
      const normalizedDecks = (decks ?? []).map((d) => normalizeInkCombo(d) as Deck);

      if (!decks || decks.length === 0) {
        // Atomic removal — no read required.
        await TournamentPlayersDeckModel.updateOne(query, { $pull: { players: { playerId } } });
        modified.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks: [] });
      } else {
        // Atomic update of an existing player's decks via positional operator.
        const result = await TournamentPlayersDeckModel.updateOne(
          { ...query, 'players.playerId': playerId },
          { $set: { 'players.$.decks': normalizedDecks } },
        );
        if (result.matchedCount === 0) {
          // Player not yet in the array — add atomically.
          await TournamentPlayersDeckModel.updateOne(query, {
            $push: {
              players: {
                playerId,
                best_identifier: bestIdentifier,
                event_best_identifier: eventBestIdentifier,
                pronouns: null,
                decks: normalizedDecks,
              },
            },
          });
        }
        modified.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks: normalizedDecks });
      }
    }

    return modified;
  },
};
