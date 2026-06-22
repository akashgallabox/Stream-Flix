const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

const envContent = fs.readFileSync('.env', 'utf-8');
const envParsed = dotenv.parse(envContent);

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

for (const key of varsToPush) {
  if (envParsed[key]) {
    console.log(`Resetting ${key}...`);
    try {
      execSync(`npx vercel env rm ${key} production preview development --yes`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore if it doesn't exist
    }
    
    // Add it correctly
    try {
      let val = envParsed[key];
      
      const environments = ['production', 'preview', 'development'];
      for (const env of environments) {
        execSync(`npx vercel env add ${key} ${env}`, { 
          input: val,
          shell: true,
          stdio: ['pipe', 'inherit', 'inherit']
        });
      }
    } catch (e) {
      console.error(`Failed to push ${key}`);
    }
  }
}

// Deploy to push changes live
console.log("Triggering deployment...");
execSync("npx vercel deploy --prod --yes", { stdio: 'inherit' });

console.log("Finished pushing all variables and redeploying!");
