import mongoose from 'mongoose';
import PlayerCommentModel from '@models/PlayerComment';
import type { IPlayerComment } from '@models/PlayerComment';
import '@models/User';
import connectToMongoDB from '@/src/lib/db';

export interface PlayerCommentInput {
  tournamentId: number;
  playerId: number;
  groupId: string | null;
  inks: string[];
  content: string;
  // Exactement l'un des deux doit être fourni — validé dans ScoutingService
  authorId?: string | null;
  guestAccessId?: string | null;
  guestDisplayName?: string | null;
}

export const PlayerCommentRepository = {
  async create(data: PlayerCommentInput): Promise<IPlayerComment> {
    await connectToMongoDB();
    const doc = await PlayerCommentModel.create(data);
    return doc.populate('authorId', 'username');
  },

  async findByPlayer(
    tournamentId: number,
    playerId: number,
    scope: { groupId?: string | null },
  ): Promise<IPlayerComment[]> {
    await connectToMongoDB();
    const filter: Record<string, unknown> = { tournamentId, playerId };
    if (scope.groupId !== undefined) {
      filter.groupId = scope.groupId ? new mongoose.Types.ObjectId(scope.groupId) : null;
    }
    return PlayerCommentModel.find(filter)
      .populate('authorId', 'username')
      .sort({ createdAt: -1 })
      .lean() as Promise<IPlayerComment[]>;
  },

  async findById(id: string): Promise<IPlayerComment | null> {
    await connectToMongoDB();
    return PlayerCommentModel.findById(id).lean() as Promise<IPlayerComment | null>;
  },

  async update(id: string, content: string): Promise<IPlayerComment | null> {
    await connectToMongoDB();
    return PlayerCommentModel.findByIdAndUpdate(
      id,
      { content },
      { new: true },
    ).lean() as Promise<IPlayerComment | null>;
  },

  async delete(id: string): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.findByIdAndDelete(id);
  },

  async migrateToGroup(
    tournamentId: number,
    playerIds: number[],
    authorId: string,
    groupId: string,
  ): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.updateMany(
      {
        tournamentId,
        playerId: { $in: playerIds },
        authorId: new mongoose.Types.ObjectId(authorId),
        groupId: null,
      },
      { groupId: new mongoose.Types.ObjectId(groupId) },
    );
  },

  async deleteForPlayerAndUser(
    tournamentId: number,
    playerId: number,
    authorId: string,
  ): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.deleteMany({
      tournamentId,
      playerId,
      authorId: new mongoose.Types.ObjectId(authorId),
      groupId: null,
    });
  },

  async deleteForPlayerAndGroup(
    tournamentId: number,
    playerId: number,
    groupId: string,
  ): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.deleteMany({
      tournamentId,
      playerId,
      groupId: new mongoose.Types.ObjectId(groupId),
    });
  },

  async countByPlayers(
    tournamentId: number,
    playerIds: number[],
    scope: { groupId?: string | null },
  ): Promise<Record<number, number>> {
    await connectToMongoDB();
    const filter: Record<string, unknown> = {
      tournamentId,
      playerId: { $in: playerIds },
    };
    if (scope.groupId !== undefined) {
      filter.groupId = scope.groupId ? new mongoose.Types.ObjectId(scope.groupId) : null;
    }
    const results = await PlayerCommentModel.aggregate<{ _id: number; count: number }>([
      { $match: filter },
      { $group: { _id: '$playerId', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(results.map((r) => [r._id, r.count]));
  },

  async deleteManyByGroupId(groupId: string): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.deleteMany({ groupId: new mongoose.Types.ObjectId(groupId) });
  },

  async findByTournament(
    tournamentId: number,
    scope: { groupId?: string | null; userId?: string | null },
  ): Promise<IPlayerComment[]> {
    await connectToMongoDB();
    const filter: Record<string, unknown> = { tournamentId };
    if (scope.groupId !== undefined) {
      filter.groupId = scope.groupId ? new mongoose.Types.ObjectId(scope.groupId) : null;
    }
    if (scope.userId !== undefined && scope.userId !== null) {
      filter.authorId = new mongoose.Types.ObjectId(scope.userId);
      filter.groupId = null;
    }
    return PlayerCommentModel.find(filter)
      .select('playerId inks content createdAt guestDisplayName')
      .sort({ playerId: 1, createdAt: -1 })
      .lean() as Promise<IPlayerComment[]>;
  },

  async deleteByGuestAccessId(guestAccessId: string): Promise<void> {
    await connectToMongoDB();
    await PlayerCommentModel.deleteMany({
      guestAccessId: new mongoose.Types.ObjectId(guestAccessId),
    });
  },
};
