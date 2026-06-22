/**
 * Shared utilities for all Vercel API routes
 */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ── Firebase Admin init (shared singleton) ────────────────────
let initialized = false;

export function initFirebase() {
  if (initialized || getApps().length > 0) {
    initialized = true;
    return;
  }
  const projectId   = process.env.VITE_FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const bucket      = process.env.VITE_FIREBASE_STORAGE_BUCKET!;

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket: bucket });
  initialized = true;
}

export function getDb() {
  initFirebase();
  const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || "(default)";
  return getFirestore(getApps()[0], databaseId);
}

export function getBucket() {
  initFirebase();
  const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET!;
  return getStorage().bucket(bucketName);
}

// ── Auth check ────────────────────────────────────────────────
export function checkAuth(req: any): boolean {
  const secret = process.env.UPLOAD_SECRET_TOKEN || "";
  if (!secret) return false;
  const auth  = (req.headers["authorization"] as string) || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

// ── JSON helper ───────────────────────────────────────────────
export function json(res: any, status: number, data: any) {
  res.status(status).json(data);
}
