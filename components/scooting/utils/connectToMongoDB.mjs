import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config(); // charge .env automatiquement à la racine

export default async function connectToMongoDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ftl'; // Remplacez par votre URI MongoDB
  if (!mongoUri) {
    throw new Error('La variable MONGO_URI est introuvable dans process.env');
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connecté à MongoDB ==> ', mongoUri);
}
