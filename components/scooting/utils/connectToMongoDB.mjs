// utils/connectToMongoDB.js
import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function connectToMongoDB() {
	if (cached.conn) return cached.conn;

	if (!process.env.MONGO_URI) throw new Error('MONGO_URI manquant');

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(process.env.MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then((mongoose) => {
				console.log('✅ Connecté à MongoDB');
				console.log('Mongoose readyState:', mongoose.connection.readyState);
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
