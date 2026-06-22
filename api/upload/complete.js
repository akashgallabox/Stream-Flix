const { getDb, getBucket, checkAuth, json } = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!checkAuth(req))       return json(res, 401, { error: "Unauthorized" });

  const { storagePath, title, description, category, size, duration, durationStr, year, maturityRating } = req.body;
  if (!storagePath || !title) return json(res, 400, { error: "storagePath and title required" });

  try {
    const bucket = getBucket();
    const file = bucket.file(storagePath);

    // Get a permanent download token/URL for the file
    // Firebase Storage UI uses download tokens. We can generate a signed URL or make it public.
    // For StreamFlix, we will make it public to easily stream it via CDN without expiring links.
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    const newVideo = {
      title,
      description: description || "Uploaded video",
      duration: Number(duration) || 0,
      durationStr: durationStr || "0m 00s",
      size: Number(size) || 0,
      url: publicUrl,
      isExternal: false,
      thumbnailUrl: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=800&auto=format&fit=crop", // Movie slate thumbnail
      category: category || "Other",
      uploadedAt: new Date().toISOString(),
      views: 0,
      rating: `${90 + Math.floor(Math.random() * 10)}% Match`,
      year: year || "2026",
      maturityRating: maturityRating || "PG-13",
    };

    const db = getDb();
    const ref = await db.collection("videos").add(newVideo);

    return json(res, 200, { id: ref.id, ...newVideo });
  } catch (err) {
    console.error("[POST /api/upload/complete]", err?.message);
    return json(res, 500, { error: "Failed to finalize upload" });
  }
};
