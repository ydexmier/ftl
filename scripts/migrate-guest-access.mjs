import 'dotenv/config';
import mongoose from 'mongoose';

// ── Environnements ─────────────────────────────────────────────────────────────

const ENVS = {
  PREVIEW: { uri: process.env.MONGO_URI_PREVIEW, db: process.env.MONGO_DB_NAME_PREVIEW },
  PROD:    { uri: process.env.MONGO_URI_PROD,    db: process.env.MONGO_DB_NAME_PROD },
};

// ── Migration ──────────────────────────────────────────────────────────────────

async function migrate(envName, { uri, db }) {
  if (!uri || !db) {
    console.error(`[${envName}] ❌  Variables d'environnement manquantes (MONGO_URI / MONGO_DB_NAME).`);
    process.exit(1);
  }

  console.log(`\n[${envName}] Connexion à ${db}…`);
  await mongoose.connect(uri, { dbName: db });
  const col = mongoose.connection.collection('tournamentexternalaccesses');

  // 1. Nettoyer les accessToken: null explicites
  const unset = await col.updateMany({ accessToken: null }, { $unset: { accessToken: '' } });
  console.log(`[${envName}] accessToken null nettoyés : ${unset.modifiedCount} document(s)`);

  // 2. Supprimer les index obsolètes (ignorer l'erreur si déjà absent)
  for (const indexName of ['accessToken_1', 'pendingToken_1']) {
    try {
      await col.dropIndex(indexName);
      console.log(`[${envName}] Index "${indexName}" supprimé.`);
    } catch {
      console.log(`[${envName}] Index "${indexName}" déjà absent — ignoré.`);
    }
  }

  // 3. Recréer l'index accessToken sparse + unique
  await col.createIndex({ accessToken: 1 }, { unique: true, sparse: true, name: 'accessToken_1' });
  console.log(`[${envName}] Index "accessToken_1" recréé (sparse + unique).`);

  await mongoose.disconnect();
  console.log(`[${envName}] ✅  Migration terminée.`);
}

// ── Point d'entrée ─────────────────────────────────────────────────────────────

const arg = process.argv[2]?.toUpperCase();

if (!arg || !['PROD', 'PREVIEW', 'ALL'].includes(arg)) {
  console.log('Usage : node scripts/migrate-guest-access.mjs <PROD|PREVIEW|ALL>');
  process.exit(1);
}

const targets = arg === 'ALL' ? ['PREVIEW', 'PROD'] : [arg];

for (const env of targets) {
  await migrate(env, ENVS[env]);
}
