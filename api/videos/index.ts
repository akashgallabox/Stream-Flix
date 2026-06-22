import { getDb, json } from "../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  try {
    const db = getDb();
    const snapshot = await db.collection("videos").orderBy("uploadedAt", "desc").get();
    const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return json(res, 200, videos);
  } catch (err: any) {
    console.error("[GET /api/videos]", err);
    return json(res, 500, { error: "Failed to load videos" });
  }
}
