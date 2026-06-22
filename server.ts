import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up directory paths
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const TEMP_UPLOADS_DIR = path.resolve(UPLOADS_DIR, "temp");
const DB_FILE = path.resolve(UPLOADS_DIR, "db.json");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_UPLOADS_DIR)) {
  fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
}

// Pre-seeded high quality movies for Netflix visual experience
const INITIAL_VIDEOS = [
  {
    id: "seed-sintel",
    title: "Sintel (CGI Cinematic)",
    description: "Sintel is an indie CGI film created by the Blender Foundation. It tells the story of a lonely female warrior who searches for her baby dragon companion, experiencing loss and sacrifice along the way. Features stunning fantasy environments and emotional storytelling.",
    duration: 888,
    durationStr: "14m 48s",
    size: 243000000,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    isExternal: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop",
    category: "Sci-Fi",
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    views: 14205,
    rating: "98% Match",
    year: "2024",
    maturityRating: "PG-13"
  },
  {
    id: "seed-tears-of-steel",
    title: "Tears of Steel (Sci-Fi / VFX)",
    description: "Centering on a sci-fi cybernetic experiment, Tears of Steel combines live-action footages of Amsterdam with spectacular futuristic war robots and advanced military tech in a gripping narrative.",
    duration: 734,
    durationStr: "12m 14s",
    size: 198000000,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    isExternal: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
    category: "Action",
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    views: 8931,
    rating: "95% Match",
    year: "2023",
    maturityRating: "PG-13"
  },
  {
    id: "seed-bunny",
    title: "Big Buck Bunny (Family Animated)",
    description: "A comedy about a giant forest rabbit whose daily peaceful routine is rudely disrupted by three mischievous squirrels who throw physical pranks at him. The rabbit plots a spectacular comical revenge scheme.",
    duration: 596,
    durationStr: "9m 56s",
    size: 158000000,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isExternal: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    category: "Comedy",
    uploadedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    views: 24905,
    rating: "99% Match",
    year: "2022",
    maturityRating: "G"
  },
  {
    id: "seed-elephants-dream",
    title: "Elephant's Dream (Abstract Drama)",
    description: "A bizarre, mechanical world inhabited by two individuals - any old elder and a young assistant - who navigate the emotional complexity, tension, and visual fantasy of their surrounding machinery.",
    duration: 653,
    durationStr: "10m 53s",
    size: 180000000,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    isExternal: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop",
    category: "Drama",
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    views: 5312,
    rating: "91% Match",
    year: "2019",
    maturityRating: "TV-14"
  }
];

// Initialize DB file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_VIDEOS, null, 2), "utf-8");
}

const readVideos = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("DB read error, using fallback state:", error);
    return INITIAL_VIDEOS;
  }
};

const writeVideos = (videos: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2), "utf-8");
  } catch (error) {
    console.error("DB write error:", error);
  }
};

// Express parsers
app.use(express.json());
// Parsing raw octet-stream up to 20MB chunks dynamically
app.use(express.raw({ type: "application/octet-stream", limit: "20mb" }));

// HTTP REST API routes
app.get("/api/videos", (req, res) => {
  const list = readVideos();
  res.json(list);
});

// Create video via manual URL addition
app.post("/api/videos/external", (req, res) => {
  const { title, description, url, category, duration, durationStr, year, maturityRating } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Title and Stream URL are completely required." });
  }

  const list = readVideos();
  const newVideo = {
    id: "ext-" + Date.now(),
    title,
    description: description || "No custom description provided.",
    duration: Number(duration) || 300,
    durationStr: durationStr || "5m 00s",
    size: 0,
    url,
    isExternal: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
    category: category || "Other",
    uploadedAt: new Date().toISOString(),
    views: 0,
    rating: `${90 + Math.floor(Math.random() * 10)}% Match`,
    year: year || "2026",
    maturityRating: maturityRating || "PG-13"
  };

  list.unshift(newVideo);
  writeVideos(list);
  res.json(newVideo);
});

// 1. Initializing chunked upload
app.post("/api/upload/init", (req, res) => {
  const { fileName, totalSize, totalChunks } = req.body;
  if (!fileName || !totalSize || !totalChunks) {
    return res.status(400).json({ error: "fileName, totalSize, totalChunks details are mandatory." });
  }

  const uploadId = "up-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
  
  // Create an empty target file placeholder so we can write to it at specific offsets
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const finalFileName = `${uploadId}-${safeFileName}`;
  const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

  try {
    const fd = fs.openSync(finalFilePath, "w");
    fs.closeSync(fd);
  } catch (err) {
    console.error("Failed creating upload placeholder:", err);
  }

  res.json({
    uploadId,
    chunkSize: Math.ceil(totalSize / totalChunks),
    streamUrl: `/api/videos/${uploadId}/stream`
  });
});

// 2. Accepting binary chunk uploads
app.post("/api/upload/chunk", (req, res) => {
  const uploadId = req.headers["x-upload-id"] as string;
  const chunkIndex = req.headers["x-chunk-index"] as string;
  const fileNameHeader = (req.headers["x-file-name"] as string) || "video.mp4";

  if (!uploadId || !chunkIndex) {
    return res.status(400).json({ error: "Headers x-upload-id and x-chunk-index must be provided." });
  }

  const safeFileName = fileNameHeader.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const finalFileName = `${uploadId}-${safeFileName}`;
  const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

  try {
    // Write req.body directly which is of Buffer type due to octet-stream parser
    const buffer = req.body as Buffer;
    if (!Buffer.isBuffer(buffer)) {
      return res.status(400).json({ error: "Provided request body is not binary octet-stream format." });
    }

    const index = parseInt(chunkIndex, 10);
    // Standard chunk size from client is 10MB
    const CHUNK_SIZE = 10 * 1024 * 1024;
    const offset = index * CHUNK_SIZE;

    // Open existing file and write the chunk at the precise byte offset
    let fd;
    if (!fs.existsSync(finalFilePath)) {
      fd = fs.openSync(finalFilePath, "w");
      fs.closeSync(fd);
    }

    fd = fs.openSync(finalFilePath, "r+");
    fs.writeSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);

    res.json({ success: true, chunkWritten: chunkIndex });
  } catch (err: any) {
    console.error("Error writing chunk directly to storage:", err);
    res.status(500).json({ error: "Could not save chunk onto disk storage." });
  }
});

// 3. Merging chunks into finished stream files (now registering)
app.post("/api/upload/complete", async (req, res) => {
  const { uploadId, fileName, category, description, durationStr, duration, year, maturityRating } = req.body;
  if (!uploadId || !fileName) {
    return res.status(400).json({ error: "uploadId and fileName are mandatory requirements." });
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const finalFileName = `${uploadId}-${safeFileName}`;
  const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

  // If the file doesn't exist on disk (e.g. storage error, or client used secure IndexedDB only),
  // we still register it so the client plays it perfectly via IndexedDB local cache fallback!
  let fileSize = 0;
  try {
    if (fs.existsSync(finalFilePath)) {
      const stat = fs.statSync(finalFilePath);
      fileSize = stat.size;
    }
  } catch (e) {
    console.warn("Could not retrieve file stat, registering as virtual index:", e);
  }

  try {
    const list = readVideos();
    const newVideo = {
      id: uploadId,
      title: fileName.substring(0, fileName.lastIndexOf(".")) || fileName,
      description: description || "Direct high-fidelity lossless upload (100% video stream source resolution).",
      duration: Number(duration) || 7200,
      durationStr: durationStr || "2h 00s",
      size: fileSize,
      url: `/api/videos/${uploadId}/stream`,
      isExternal: false,
      thumbnailUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
      category: category || "Uploader",
      uploadedAt: new Date().toISOString(),
      views: 0,
      rating: `${93 + Math.floor(Math.random() * 7)}% Match`,
      year: year || new Date().getFullYear().toString(),
      maturityRating: maturityRating || "PG-13"
    };

    list.unshift(newVideo);
    writeVideos(list);

    res.json(newVideo);
  } catch (err: any) {
    console.error("Error finalizing file stream combination:", err);
    res.status(500).json({ error: "Failed assembling chunk stream files." });
  }
});

// 4. Video Streaming Endpoint with range seeking support
app.get("/api/videos/:id/stream", (req, res) => {
  const { id } = req.params;
  const list = readVideos();
  const video = list.find((v: any) => v.id === id);

  if (!video) {
    return res.status(404).send("Requested streaming file not registered.");
  }

  // If external video, we proxy the stream of external resources using standard https/http range streaming
  // to avoid CORS, iframe sandboxing, mixed content restrictions, and external server latency!
  if (video.isExternal) {
    try {
      const parsedUrl = new URL(video.url);
      const clientModule = parsedUrl.protocol === "https:" ? https : http;

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };

      // Forward the browser's Range header so the remote storage/CDN returns the requested chunk instantly!
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const proxyRequest = clientModule.get(video.url, { headers }, (proxyResponse) => {
        const statusCode = proxyResponse.statusCode || 200;
        
        const resHeaders: Record<string, string | string[] | undefined> = {
          "Content-Type": proxyResponse.headers["content-type"] || "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff"
        };

        if (proxyResponse.headers["content-length"]) {
          resHeaders["Content-Length"] = proxyResponse.headers["content-length"];
        }
        if (proxyResponse.headers["content-range"]) {
          resHeaders["Content-Range"] = proxyResponse.headers["content-range"];
        }

        res.writeHead(statusCode, resHeaders);
        proxyResponse.pipe(res);
      });

      proxyRequest.on("error", (err) => {
        console.error("External streaming proxy encountered an error:", err);
        if (!res.headersSent) {
          res.redirect(video.url);
        }
      });

      return;
    } catch (urlErr) {
      console.error("Error parsing/fetching external URL:", urlErr);
      return res.redirect(video.url);
    }
  }

  // Local file. Locate it!
  const fileNamePattern = `${id}-`;
  const files = fs.readdirSync(UPLOADS_DIR);
  const matchedFile = files.find(file => file.startsWith(fileNamePattern));

  if (!matchedFile) {
    return res.status(404).send("Physical streaming media file not found on server.");
  }

  const filePath = path.join(UPLOADS_DIR, matchedFile);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Media source file is missing from target path.");
  }

  const stats = fs.statSync(filePath);
  const totalSize = stats.size;
  const rangeHeader = req.headers.range;

  // Detect MIME type based on file extension
  let contentType = "video/mp4";
  if (matchedFile.endsWith(".webm")) {
    contentType = "video/webm";
  } else if (matchedFile.endsWith(".mkv")) {
    contentType = "video/x-matroska";
  } else if (matchedFile.endsWith(".avi")) {
    contentType = "video/x-msvideo";
  }

  // Handle standard HTTP Range Request
  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    // Validate bounds
    if (start >= totalSize || end >= totalSize || start > end) {
      res.writeHead(416, {
        "Content-Range": `bytes */${totalSize}`
      });
      return res.end();
    }

    const chunkSize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    // HTTP 206 Partial Content optimized for instant playback seeking
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
      "Cache-Control": "public, no-cache",
      "X-Content-Type-Options": "nosniff"
    });

    fileStream.on("error", (streamErr) => {
      console.error("Stream reading error:", streamErr);
      if (!res.headersSent) {
        res.status(500).send("Error reading file stream.");
      }
    });

    fileStream.pipe(res);
  } else {
    // No segment or range requested, stream the full file (HTTP 200)
    res.writeHead(200, {
      "Content-Length": totalSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, no-cache",
      "X-Content-Type-Options": "nosniff"
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (streamErr) => {
      console.error("Full stream reading error:", streamErr);
      if (!res.headersSent) {
        res.status(500).send("Error streaming whole file.");
      }
    });

    fileStream.pipe(res);
  }
});

// 5. Delete registered media item
app.delete("/api/videos/:id", (req, res) => {
  const { id } = req.params;
  const list = readVideos();
  const index = list.findIndex((v: any) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Media uploader details not found." });
  }

  const [video] = list.splice(index, 1);
  writeVideos(list);

  if (!video.isExternal) {
    try {
      const fileNamePattern = `${id}-`;
      const files = fs.readdirSync(UPLOADS_DIR);
      const matchedFile = files.find(file => file.startsWith(fileNamePattern));
      if (matchedFile) {
        fs.unlinkSync(path.join(UPLOADS_DIR, matchedFile));
      }
    } catch (e) {
      console.error("Failed to delete local stream representation:", e);
    }
  }

  res.json({ success: true, deleted: id });
});

// Vite middleware for dev or standard static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Video platform custom server listening at http://localhost:${PORT}`);
  });
}

startServer();
