import TournamentModel from '@models/Tournament';
import type { ITournament } from '@models/Tournament';
import connectToMongoDB from '@/src/lib/db';
import { mergeDeep } from '@/src/lib/mergeDeep';

export const TournamentRepository = {
	async findAll(): Promise<ITournament[]> {
		await connectToMongoDB();
		return TournamentModel.find().lean() as Promise<ITournament[]>;
	},

	async findById(id: number): Promise<ITournament | null> {
		await connectToMongoDB();
		return TournamentModel.findOne({ id }).lean() as Promise<ITournament | null>;
	},

	async upsert(data: Record<string, unknown>) {
		await connectToMongoDB();
		return TournamentModel.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).lean();
	},

	async deleteById(id: number) {
		await connectToMongoDB();
		return TournamentModel.findOneAndDelete({ id });
	},

	async findByIds(ids: number[]): Promise<ITournament[]> {
		await connectToMongoDB();
		if (ids.length === 0) return [];
		return TournamentModel.find({ id: { $in: ids } }).lean() as Promise<ITournament[]>;
	},

	async search(query: string): Promise<ITournament[]> {
		await connectToMongoDB();
		const numericId = Number(query);
		if (!isNaN(numericId) && numericId > 0) {
			const byId = await TournamentModel.findOne({ id: numericId }).lean() as ITournament | null;
			return byId ? [byId] : [];
		}
		return TournamentModel.find({ name: { $regex: query, $options: 'i' } }).limit(10).lean() as Promise<ITournament[]>;
	},

	async mergeAndSave(data: Record<string, unknown>) {
		await connectToMongoDB();
		const existing = await TournamentModel.findOne({ id: data.id });
		if (existing) {
			mergeDeep(existing as unknown as Record<string, unknown>, data);
			existing.lastFetchedAt = new Date();
			await existing.save();
			return existing;
		}
		return TournamentModel.create({ ...data, lastFetchedAt: new Date() });
	},
};
