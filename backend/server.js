import express       from "express";
import mongoose       from "mongoose";
import cors           from "cors";
import path           from "path";
import { fileURLToPath } from "url";
import dotenv         from "dotenv";
import uploadRouter   from "./routes/upload.js";
import fs from 'fs';
import cron from 'node-cron';
import Puzzle from './models/Puzzle.js';
dotenv.config();

// ─── ESM __dirname shim ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── App ──────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods:     ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static – serve uploaded images ──────────────────────────────────────
//  e.g. GET http://localhost:5000/uploads/1718123456789-puzzle.png
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api", uploadRouter);

// ─── Health check ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── Global error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[server error]", err.message);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error" });
});
// ─── Automated Cleanup Sweep ───────────────────────────────────────────────
// This cron job runs at the top of every hour ('0 * * * *')
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running automated puzzle cleanup...');
  try {
    // 1. Define the expiration time (e.g., 24 hours ago)
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Find all puzzles created before that time
    const expiredPuzzles = await Puzzle.find({ createdAt: { $lt: expirationTime } });

    for (const puzzle of expiredPuzzles) {
      // 3. Delete the physical image file from the /uploads folder
      const filename = path.basename(puzzle.imageUrl);
      const filePath = path.join(__dirname, 'uploads', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Deletes the file
      }

      // 4. Delete the document from MongoDB
      await Puzzle.findByIdAndDelete(puzzle._id);
    }

    if (expiredPuzzles.length > 0) {
      console.log(`✅ Cleaned up ${expiredPuzzles.length} expired puzzles.`);
    } else {
      console.log('✨ No expired puzzles to clean.');
    }
  } catch (error) {
    console.error('❌ Error during cleanup sweep:', error.message);
  }
});
// ─── MongoDB → then listen ────────────────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/puzzle-grove";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅  MongoDB connected`);
    app.listen(PORT, () =>
      console.log(`🚀  Server running   → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });