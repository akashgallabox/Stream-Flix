// Shared Firebase Admin utilities for all API routes
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

let initialized = false;

function initFirebase() {
  if (initialized || getApps().length > 0) { initialized = true; return; }

  const projectId   = process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const bucket      = process.env.VITE_FIREBASE_STORAGE_BUCKET;

  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(`Firebase credentials missing: projectId=${!!projectId} email=${!!clientEmail} key=${!!privateKey}`);
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket: bucket });
  console.log("[Firebase] ✅ Initialized:", projectId);
  initialized = true;
}

function getDb() {
  initFirebase();
  const databaseId = process.env.VITE_FIREBASE_DATABASE_ID;
  if (databaseId && databaseId !== "(default)") {
    return getFirestore(getApps()[0], databaseId);
  }
  return getFirestore(getApps()[0]);
}

function getBucket() {
  initFirebase();
  return getStorage(getApps()[0]).bucket(process.env.VITE_FIREBASE_STORAGE_BUCKET);
}

function checkAuth(req) {
  const secret = process.env.UPLOAD_SECRET_TOKEN || "";
  if (!secret) return false;
  const auth  = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

function json(res, status, data) {
  res.status(status).json(data);
}

module.exports = { getDb, getBucket, checkAuth, json };
