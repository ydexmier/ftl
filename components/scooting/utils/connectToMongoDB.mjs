import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charge les variables d'environnement dans process.env
dotenv.config();

export default async function connectToMongoDB() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('La variable MONGO_URI est introuvable dans process.env');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');
}