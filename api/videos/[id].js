const { getDb, getBucket, checkAuth, json } = require("../../_utils");

module.exports = async function handler(req, res) {
  const { id } = req.query;

  // ── DELETE ──────────────────────────────────────────────────
  if (req.method === "DELETE") {
    if (!checkAuth(req)) return json(res, 401, { error: "Unauthorized" });

    try {
      const db = getDb();
      const docRef = db.collection("videos").doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) return json(res, 404, { error: "Video not found" });

      const data = docSnap.data();

      // If it's a storage video, delete the file from the bucket
      if (!data.isExternal && data.url) {
        try {
          const bucket = getBucket();
          const fileName = data.url.split("/").pop().split("?")[0];
          const file = bucket.file(`videos/${fileName}`);
          await file.delete();
          console.log(`[DELETE] Deleted file videos/${fileName}`);
        } catch (e) {
          console.warn("[DELETE] Failed to delete file from storage:", e?.message);
        }
      }

      await docRef.delete();
      return json(res, 200, { success: true });
    } catch (err) {
      console.error(`[DELETE /api/videos/${id}]`, err?.message);
      return json(res, 500, { error: "Failed to delete video" });
    }
  }

  // ── GET ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const db = getDb();
      const docSnap = await db.collection("videos").doc(id).get();

      if (!docSnap.exists) return json(res, 404, { error: "Video not found" });

      return json(res, 200, { id: docSnap.id, ...docSnap.data() });
    } catch (err) {
      console.error(`[GET /api/videos/${id}]`, err?.message);
      return json(res, 500, { error: "Failed to load video details" });
    }
  }

  return json(res, 405, { error: "Method not allowed" });
};
