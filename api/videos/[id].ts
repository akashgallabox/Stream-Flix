import { getDb, getBucket, checkAuth, json } from "../_utils";

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  // ── DELETE ────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    if (!checkAuth(req)) return json(res, 401, { error: "Unauthorized" });
    try {
      const db  = getDb();
      const ref = db.collection("videos").doc(id as string);
      const doc = await ref.get();
      if (!doc.exists) return json(res, 404, { error: "Video not found" });

      const data = doc.data()!;
      await ref.delete();

      // Also delete from Firebase Storage if it was an uploaded file
      if (!data.isExternal && data.storagePath) {
        try {
          await getBucket().file(data.storagePath).delete();
        } catch { /* ignore storage delete errors */ }
      }

      return json(res, 200, { success: true, deleted: id });
    } catch (err: any) {
      console.error("[DELETE /api/videos/:id]", err);
      return json(res, 500, { error: "Failed to delete video" });
    }
  }

  return json(res, 405, { error: "Method not allowed" });
}
