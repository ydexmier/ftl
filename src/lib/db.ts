import mongoose from 'mongoose';

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	// eslint-disable-next-line no-var
	var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

export default async function connectToMongoDB(): Promise<typeof mongoose> {
	if (cached.conn) return cached.conn;

	if (!process.env.MONGO_URI) throw new Error('MONGO_URI manquant');
	if (!process.env.MONGO_DB_NAME) throw new Error('MONGO_DB_NAME manquant');

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB_NAME}`)
			.then((m) => {
				console.log(`✅ Connecté à MongoDB — ${process.env.MONGO_DB_NAME}`);
				return m;
			})
			.catch((err) => {
				cached.promise = null;
				throw err;
			});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
