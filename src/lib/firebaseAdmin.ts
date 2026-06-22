/**
 * Firebase Admin SDK — Server-Side Firestore Connection
 * Used by server.ts to store/retrieve video metadata in Firestore
 * instead of the local db.json file.
 *
 * Requires in .env:
 *   FIREBASE_CLIENT_EMAIL  — from Firebase Console Service Account
 *   FIREBASE_PRIVATE_KEY   — from Firebase Console Service Account
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_DATABASE_ID
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;
let _initialized = false;

export function getDb(): Firestore | null {
  if (_initialized) return _db;
  _initialized = true;

  const projectId   = process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseId  = process.env.VITE_FIREBASE_DATABASE_ID || "(default)";

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "\n[Firebase] ⚠️  Firestore NOT connected — missing service account credentials." +
      "\n           Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to your .env file." +
      "\n           Falling back to local db.json storage.\n"
    );
    return null;
  }

  try {
    const existingApps = getApps();
    let app: App;

    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }

    _db = getFirestore(app, databaseId);
    console.log(`[Firebase] ✅ Firestore connected  (project: ${projectId}, database: ${databaseId})`);
    return _db;
  } catch (err) {
    console.error("[Firebase] ❌ Failed to connect to Firestore:", err);
    return null;
  }
}

/** Read all videos from Firestore, ordered by uploadedAt descending */
export async function fsReadVideos(): Promise<any[]> {
  const db = getDb();
  if (!db) return [];

  const snapshot = await db
    .collection("videos")
    .orderBy("uploadedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/** Save a single video document to Firestore */
export async function fsAddVideo(video: any): Promise<void> {
  const db = getDb();
  if (!db) return;
  const { id, ...data } = video;
  await db.collection("videos").doc(id).set(data);
}

/** Delete a single video document from Firestore */
export async function fsDeleteVideo(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.collection("videos").doc(id).delete();
}
