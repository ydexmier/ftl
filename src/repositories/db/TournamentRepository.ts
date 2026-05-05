import Tournament from '@models/Tournament.js';
import connectToMongoDB from '@/src/lib/db';
import { mergeDeep } from '@/src/lib/mergeDeep';
import type { Tournament as TournamentType } from '@/src/types/tournament';

export const TournamentRepository = {
	async findAll(): Promise<TournamentType[]> {
		await connectToMongoDB();
		return Tournament.find().lean() as Promise<TournamentType[]>;
	},

	async findById(id: number): Promise<TournamentType | null> {
		await connectToMongoDB();
		return Tournament.findOne({ id }).lean() as Promise<TournamentType | null>;
	},

	async upsert(data: Record<string, unknown>) {
		await connectToMongoDB();
		return Tournament.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).lean();
	},

	async deleteById(id: number) {
		await connectToMongoDB();
		return Tournament.findOneAndDelete({ id });
	},

	async mergeAndSave(data: Record<string, unknown>, isRefetch: boolean) {
		await connectToMongoDB();
		const existing = await Tournament.findOne({ id: data.id });
		if (!isRefetch && existing) throw new Error('Le tournoi existe déjà');
		if (existing) {
			mergeDeep(existing as unknown as Record<string, unknown>, data);
			await existing.save();
			return existing;
		}
		return Tournament.create(data);
	},
};
