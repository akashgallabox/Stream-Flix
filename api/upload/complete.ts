import { getDb, getBucket, checkAuth, json } from "../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!checkAuth(req))       return json(res, 401, { error: "Unauthorized" });

  const { uploadId, storagePath, fileName, category, description, duration, durationStr, year, maturityRating } = req.body;
  if (!uploadId || !storagePath || !fileName) {
    return json(res, 400, { error: "uploadId, storagePath, and fileName are required" });
  }

  try {
    const bucket  = getBucket();
    const file    = bucket.file(storagePath);

    // Set a permanent download token so the video URL never expires
    const downloadToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: downloadToken } });

    const bucketName  = bucket.name;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    const cleanTitle  = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
    const newVideo    = {
      title:          cleanTitle,
      description:    description    || "Uploaded video file",
      duration:       Number(duration) || 7200,
      durationStr:    durationStr    || "2h 00s",
      size:           0,
      url:            downloadUrl,
      storagePath,                   // kept for deletion later
      isExternal:     false,
      thumbnailUrl:   "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
      category:       category       || "Uploader",
      uploadedAt:     new Date().toISOString(),
      views:          0,
      rating:         `${93 + Math.floor(Math.random() * 7)}% Match`,
      year:           year           || new Date().getFullYear().toString(),
      maturityRating: maturityRating || "PG-13",
    };

    const db  = getDb();
    await db.collection("videos").doc(uploadId).set(newVideo);

    return json(res, 200, { id: uploadId, ...newVideo });
  } catch (err: any) {
    console.error("[POST /api/upload/complete]", err);
    return json(res, 500, { error: "Failed to register video: " + err.message });
  }
}
