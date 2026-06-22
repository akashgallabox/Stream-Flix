const { getDb, json } = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  try {
    const keys = Object.keys(process.env).filter(k => k.includes("FIREBASE") || k.includes("VITE"));
    console.log("ENV KEYS AVAILABLE:", keys);
    
    const db = getDb();
    const snapshot = await db.collection("videos").orderBy("uploadedAt", "desc").get();
    const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return json(res, 200, videos);
  } catch (err) {
    console.error("[GET /api/videos] Error:", err?.message, err?.code);
    return json(res, 500, { error: "Failed to load videos", detail: err?.message });
  }
};
