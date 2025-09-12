// utils/connectToMongoDB.js
import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function connectToMongoDB() {
	if (cached.conn) return cached.conn;

	if (!process.env.MONGO_URI) throw new Error('MONGO_URI manquant');
	if (!process.env.MONGO_DB_NAME) throw new Error('MONGO_DB_NAME manquant');

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(process.env.MONGO_URI + '/' + process.env.MONGO_DB_NAME, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then((mongoose) => {
				console.log('✅ Connecté à MongoDB sur la bdd ' + MONGO_DB_NAME);
				return mongoose;
			})
			.catch((err) => {
				cached.promise = null;
				throw err;
			});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
