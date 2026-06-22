import https from "https";
import http  from "http";
import { getDb } from "../../../_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id } = req.query;

  try {
    const db       = getDb();
    const doc      = await db.collection("videos").doc(id as string).get();
    if (!doc.exists) { res.status(404).send("Video not found"); return; }

    const video = { id: doc.id, ...doc.data() } as any;

    // Firebase Storage videos: redirect directly to CDN URL (no proxy needed)
    if (!video.isExternal && video.url && video.url.startsWith("https://firebasestorage")) {
      res.redirect(video.url);
      return;
    }

    // External videos: proxy the stream so the browser can seek properly
    if (video.isExternal || video.url?.startsWith("http")) {
      const targetUrl = video.url as string;
      const parsed    = new URL(targetUrl);
      const client    = parsed.protocol === "https:" ? https : http;

      const proxyHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (compatible; StreamFlix/1.0)",
      };
      if (req.headers.range) proxyHeaders["Range"] = req.headers.range;

      const proxyReq = client.get(targetUrl, { headers: proxyHeaders }, (proxyRes) => {
        const status = proxyRes.statusCode || 200;
        const outHeaders: Record<string, string | string[] | undefined> = {
          "Content-Type":  proxyRes.headers["content-type"]  || "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        };
        if (proxyRes.headers["content-length"]) outHeaders["Content-Length"] = proxyRes.headers["content-length"];
        if (proxyRes.headers["content-range"])  outHeaders["Content-Range"]  = proxyRes.headers["content-range"];
        res.writeHead(status, outHeaders);
        proxyRes.pipe(res);
      });

      proxyReq.on("error", () => {
        if (!res.headersSent) res.redirect(targetUrl);
      });
      return;
    }

    res.status(404).send("Stream not available");
  } catch (err) {
    console.error("[GET /api/videos/:id/stream]", err);
    res.status(500).send("Stream error");
  }
}
