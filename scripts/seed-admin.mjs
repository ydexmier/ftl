import 'dotenv/config';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';

// ── Environnements ────────────────────────────────────────────────────────────

const ENVS = {
  LOCAL:   { uri: process.env.MONGO_URI,         db: process.env.MONGO_DB_NAME },
  PREVIEW: { uri: process.env.MONGO_URI_PREVIEW,  db: process.env.MONGO_DB_NAME_PREVIEW },
  PROD:    { uri: process.env.MONGO_URI_PROD,     db: process.env.MONGO_DB_NAME_PROD },
};

// ── Schéma (miroir de models/User.ts) ────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['USER', 'ADMIN', 'SUPERUSER'], default: 'USER' },
  },
  { timestamps: true }
);
const User = mongoose.models.User ?? mongoose.model('User', UserSchema);

// ── Helpers CLI ───────────────────────────────────────────────────────────────

function choose(label, options) {
  console.log(`\n${label}`);
  options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
  return options;
}

function readHidden(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const handler = (char) => {
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', handler);
        stdout.write('\n');
        resolve(value);
      } else if (char === '') {
        process.exit();
      } else if (char === '') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on('data', handler);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  // 1. Environnement
  const envKeys = Object.keys(ENVS);
  choose('Environnement :', envKeys);
  const envInput = await rl.question('Choix (1-3) : ');
  const envKey = envKeys[parseInt(envInput) - 1];
  if (!envKey) { console.error('Choix invalide.'); process.exit(1); }

  const { uri, db } = ENVS[envKey];
  if (!uri || !db) {
    console.error(`Variables manquantes pour ${envKey} dans .env`);
    process.exit(1);
  }

  // 2. Login
  const username = (await rl.question('\nLogin : ')).trim();
  if (!username) { console.error('Login requis.'); process.exit(1); }

  // 3. Email
  const email = (await rl.question('Email : ')).trim();
  if (!email || !email.includes('@')) { console.error('Email invalide.'); process.exit(1); }

  rl.close();

  // 4. Mot de passe (caché)
  const password = await readHidden('Mot de passe : ');
  if (password.length < 12) {
    console.error('Le mot de passe doit faire au moins 12 caractères.');
    process.exit(1);
  }

  // 5. Rôle (nouveau readline car stdin a été repris en raw mode)
  const rl2 = createInterface({ input: stdin, output: stdout });
  const roles = ['USER', 'ADMIN', 'SUPERUSER'];
  choose('Rôle :', roles);
  const roleInput = await rl2.question('Choix (1-3) : ');
  rl2.close();

  const role = roles[parseInt(roleInput) - 1];
  if (!role) { console.error('Rôle invalide.'); process.exit(1); }

  // ── Connexion & création ──────────────────────────────────────────────────

  console.log(`\nConnexion à ${envKey} (${db})…`);
  await mongoose.connect(uri, { dbName: db });

  // Supprime les index obsolètes (ex: ancien champ "login" renommé en "username")
  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  const legacy = indexes.filter((idx) => idx.name !== '_id_' && !['username_1', 'email_1'].includes(idx.name));
  for (const idx of legacy) {
    await collection.dropIndex(idx.name);
    console.log(`   Index obsolète supprimé : ${idx.name}`);
  }

  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing) {
    const conflict = existing.username === username.toLowerCase() ? 'login' : 'email';
    console.error(`Ce ${conflict} est déjà utilisé.`);
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await User.create({ username, email, passwordHash, role });

  console.log(`\n✅ Compte créé sur ${envKey}`);
  console.log(`   Login : ${username}`);
  console.log(`   Email : ${email}`);
  console.log(`   Rôle  : ${role}`);
}

main()
  .catch((err) => { console.error('\n❌', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
