import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || '';

if (!MONGO_URI) {
	throw new Error('Please define the MONGO_URI environment variable');
}
if (!MONGO_DB_NAME) {
	throw new Error('Please define the MONGO_DB_NAME environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
	cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGO_URI + '/' + MONGO_DB_NAME).then((mongoose) => mongoose);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}

export default dbConnect;
