import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Env vars requis par les modules testés
process.env.SESSION_SECRET = 'test-secret-key-32-chars-minimum!';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.MONGO_URI = 'unused-in-tests';
process.env.MONGO_DB_NAME = 'test';

// Mock l'envoi d'email — aucun email réel ne part pendant les tests
vi.mock('@/src/lib/email', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendGuestInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock connectToMongoDB : mongoose est déjà connecté via MongoMemoryServer
vi.mock('@/src/lib/db', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Remet la DB à zéro entre chaque test
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});
