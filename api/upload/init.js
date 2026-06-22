const { getBucket, checkAuth, json } = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!checkAuth(req))       return json(res, 401, { error: "Unauthorized" });

  const { fileName, fileType } = req.body;
  if (!fileName || !fileType) return json(res, 400, { error: "fileName and fileType required" });

  try {
    const bucket = getBucket();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${fileName}`;
    const file = bucket.file(`videos/${uniqueName}`);

    // Generate a signed URL that allows writing (PUT)
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: fileType,
    });

    return json(res, 200, { uploadUrl: url, storagePath: `videos/${uniqueName}` });
  } catch (err) {
    console.error("[POST /api/upload/init]", err?.message);
    return json(res, 500, { error: "Failed to initialize upload" });
  }
};
