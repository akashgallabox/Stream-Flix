const https = require("https");
const http = require("http");
const { getDb } = require("../../../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id } = req.query;

  try {
    const db = getDb();
    const docSnap = await db.collection("videos").doc(id).get();

    if (!docSnap.exists) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    const video = docSnap.data();

    if (video.isExternal || !video.url) {
      res.redirect(302, video.url);
      return;
    }

    const targetUrl = video.url;
    const client = targetUrl.startsWith("https") ? https : http;

    const proxyReq = client.get(targetUrl, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.error(`[STREAM /api/videos/${id}/stream] Proxy error:`, err?.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to proxy stream" });
      }
    });

    req.pipe(proxyReq, { end: true });
  } catch (err) {
    console.error(`[STREAM /api/videos/${id}/stream]`, err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream error" });
    }
  }
};
