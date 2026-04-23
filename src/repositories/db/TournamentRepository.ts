import Tournament from '@models/Tournament.js';
import connectToMongoDB from '@/src/lib/db';

export const TournamentRepository = {
	async findAll() {
		await connectToMongoDB();
		return Tournament.find().lean();
	},

	async findById(id: number) {
		await connectToMongoDB();
		return Tournament.findOne({ id }).lean();
	},

	async upsert(data: Record<string, unknown>) {
		await connectToMongoDB();
		return Tournament.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).lean();
	},

	async deleteById(id: number) {
		await connectToMongoDB();
		return Tournament.findOneAndDelete({ id });
	},
};
