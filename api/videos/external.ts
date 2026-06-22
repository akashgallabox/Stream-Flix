import { getDb, checkAuth, json } from "../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!checkAuth(req))       return json(res, 401, { error: "Unauthorized" });

  const { title, description, url, category, duration, durationStr, year, maturityRating } = req.body;
  if (!title || !url) return json(res, 400, { error: "Title and URL are required" });

  const newVideo = {
    title,
    description:    description    || "External stream link",
    duration:       Number(duration) || 300,
    durationStr:    durationStr    || "5m 00s",
    size:           0,
    url,
    isExternal:     true,
    thumbnailUrl:   "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
    category:       category       || "Other",
    uploadedAt:     new Date().toISOString(),
    views:          0,
    rating:         `${90 + Math.floor(Math.random() * 10)}% Match`,
    year:           year           || "2026",
    maturityRating: maturityRating || "PG-13",
  };

  try {
    const db  = getDb();
    const ref = await db.collection("videos").add(newVideo);
    return json(res, 200, { id: ref.id, ...newVideo });
  } catch (err: any) {
    console.error("[POST /api/videos/external]", err);
    return json(res, 500, { error: "Failed to save video" });
  }
}
