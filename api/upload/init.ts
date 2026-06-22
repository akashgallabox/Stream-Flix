import { getBucket, checkAuth, json } from "../../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!checkAuth(req))       return json(res, 401, { error: "Unauthorized" });

  const { fileName, contentType = "video/mp4" } = req.body;
  if (!fileName) return json(res, 400, { error: "fileName is required" });

  const uploadId   = "up-" + Math.random().toString(36).slice(2) + "-" + Date.now();
  const safeFile   = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `videos/${uploadId}/${safeFile}`;

  try {
    const bucket = getBucket();
    const file   = bucket.file(storagePath);

    // Generate a V4 signed URL for the client to PUT the video directly to Firebase Storage
    const [signedUrl] = await file.getSignedUrl({
      version:     "v4",
      action:      "write",
      expires:     Date.now() + 60 * 60 * 1000, // 1 hour
      contentType,
    });

    return json(res, 200, { uploadId, signedUrl, storagePath });
  } catch (err: any) {
    console.error("[POST /api/upload/init]", err);
    return json(res, 500, { error: "Failed to generate upload URL: " + err.message });
  }
}
