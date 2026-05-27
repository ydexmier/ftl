import { createHash, randomBytes } from 'crypto';
import ApiTokenModel, { type IApiToken } from '@models/ApiToken';
import connectToMongoDB from '@/src/lib/db';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

export interface CreateApiTokenInput {
  name: string;
  scopeType: 'group' | 'user';
  tournamentId: number;
  groupId?: string | null;
  userId?: string | null;
  createdBy: string;
}

export const ApiTokenRepository = {
  async findByRawToken(raw: string): Promise<IApiToken | null> {
    await connectToMongoDB();
    return ApiTokenModel.findOne({ token: hashToken(raw), status: 'ACTIVE' }).lean() as Promise<IApiToken | null>;
  },

  async findByGroupAndTournament(groupId: string, tournamentId: number): Promise<IApiToken[]> {
    await connectToMongoDB();
    return ApiTokenModel.find({ scopeType: 'group', groupId, tournamentId }).sort({ createdAt: -1 }).lean() as Promise<IApiToken[]>;
  },

  async findByUserAndTournament(userId: string, tournamentId: number): Promise<IApiToken[]> {
    await connectToMongoDB();
    return ApiTokenModel.find({ scopeType: 'user', userId, tournamentId }).sort({ createdAt: -1 }).lean() as Promise<IApiToken[]>;
  },

  async create(input: CreateApiTokenInput): Promise<{ token: IApiToken; rawToken: string }> {
    await connectToMongoDB();
    const rawToken = generateRawToken();
    const token = await ApiTokenModel.create({
      token: hashToken(rawToken),
      name: input.name,
      scopeType: input.scopeType,
      tournamentId: input.tournamentId,
      groupId: input.groupId ?? null,
      userId: input.userId ?? null,
      createdBy: input.createdBy,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      lastUsedAt: null,
    });
    return { token: token.toObject() as IApiToken, rawToken };
  },

  async revoke(tokenId: string, requesterId: string, scope: { groupId?: string; userId?: string }): Promise<IApiToken | null> {
    await connectToMongoDB();
    const filter: Record<string, unknown> = { _id: tokenId, createdBy: requesterId };
    if (scope.groupId) filter.groupId = scope.groupId;
    if (scope.userId) filter.userId = scope.userId;
    return ApiTokenModel.findOneAndUpdate(filter, { status: 'REVOKED' }, { new: true }).lean() as Promise<IApiToken | null>;
  },

  async updateLastUsed(tokenId: string): Promise<void> {
    await connectToMongoDB();
    await ApiTokenModel.findByIdAndUpdate(tokenId, { lastUsedAt: new Date() });
  },
};
