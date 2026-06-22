const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');

const envParsed = dotenv.parse(fs.readFileSync('.env', 'utf-8'));

const varsToPush = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'UPLOAD_SECRET_TOKEN',
  'VITE_APP_USERNAME',
  'VITE_APP_PASSWORD'
];

const environments = ['production', 'preview', 'development'];

for (const key of varsToPush) {
  const value = envParsed[key];
  if (!value) { console.warn(`Skipping ${key} - not in .env`); continue; }

  // Step 1: Remove from all environments first
  console.log(`\nRemoving ${key} from all environments...`);
  for (const env of environments) {
    try {
      execSync(`npx vercel env rm ${key} ${env} --yes`, { stdio: 'ignore' });
    } catch (_) { /* not found is fine */ }
  }

  // Step 2: Re-add with correct value using --force
  console.log(`Adding ${key} to all environments...`);
  for (const env of environments) {
    try {
      execSync(`npx vercel env add ${key} ${env} --force`, {
        input: value,
        shell: true,
        stdio: ['pipe', 'inherit', 'inherit']
      });
    } catch (e) {
      console.error(`  Failed for ${env}: ${e.message}`);
    }
  }
}

console.log('\nAll variables synced! Deploying...');
execSync('npx vercel deploy --prod --yes', { stdio: 'inherit' });
console.log('\nDone!');
