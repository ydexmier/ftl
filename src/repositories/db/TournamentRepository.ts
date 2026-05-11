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

	async mergeAndSave(data: Record<string, unknown>, isRefetch: boolean) {
		await connectToMongoDB();
		const existing = await TournamentModel.findOne({ id: data.id });
		if (!isRefetch && existing) throw new Error('Le tournoi existe déjà');
		if (existing) {
			mergeDeep(existing as unknown as Record<string, unknown>, data);
			await existing.save();
			return existing;
		}
		return TournamentModel.create(data);
	},
};
