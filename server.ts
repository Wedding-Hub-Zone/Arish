import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure assets directory exists
  const assetsDir = path.join(process.cwd(), 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // API Route for uploading video
  app.post("/api/upload-video", (req, res) => {
    const filePath = path.join(assetsDir, "custom_engagement_video.mp4");
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log("Custom video saved to:", filePath);
      res.json({ success: true, url: "/assets/custom_engagement_video.mp4" });
    });

    writeStream.on("error", (err) => {
      console.error("Video upload file write error:", err);
      res.status(500).json({ error: "Failed to save video" });
    });
  });

  // API Route for deleting/resetting custom video
  postResetVideo(app, assetsDir);

  // Check if custom video exists
  app.get("/api/video-status", (req, res) => {
    const filePath = path.join(assetsDir, "custom_engagement_video.mp4");
    const exists = fs.existsSync(filePath);
    res.json({ hasCustomVideo: exists, url: exists ? "/assets/custom_engagement_video.mp4" : null });
  });

  // Serve assets folder statically
  app.use('/assets', express.static(assetsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function postResetVideo(app: express.Express, assetsDir: string) {
  app.post("/api/reset-video", (req, res) => {
    const filePath = path.join(assetsDir, "custom_engagement_video.mp4");
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        res.json({ success: true });
      } catch (e) {
        console.error("Failed to delete video file:", e);
        res.status(500).json({ error: "Failed to delete video file" });
      }
    } else {
      res.json({ success: true, message: "No custom video existed" });
    }
  });
}

startServer();
