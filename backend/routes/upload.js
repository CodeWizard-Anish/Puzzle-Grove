import express    from "express";
import multer     from "multer";
import path       from "path";
import { fileURLToPath } from "url";
import fs         from "fs";
import Puzzle     from "../models/Puzzle.js";

const router     = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Ensure uploads/ directory exists ─────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Multer – disk storage ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename(_req, file, cb) {
    // e.g. 1718123456789-my-photo.png
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

// ─── File-type filter ─────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."), {
        status: 415,
      }),
      false
    );
  }
};

// ─── Multer instance ──────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

// ─── POST /api/upload ─────────────────────────────────────────────────────
//  Body (multipart/form-data):
//    image       — the image file  (required)
//    difficulty  — 4 | 5 | 6       (optional, defaults to 4)
//
//  Response 201:
//  {
//    success:    true,
//    imageUrl:   "http://localhost:5000/uploads/1718123456789-123456.png",
//    puzzle:     { _id, imageUrl, difficulty, gridLabel, createdAt }
//  }
// ─────────────────────────────────────────────────────────────────────────
router.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    // Multer didn't attach a file → fileFilter rejected it or no file sent
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file received. Send the file under the field name 'image'.",
      });
    }

    const difficulty = parseInt(req.body.difficulty, 10) || 4;

    // Build the publicly accessible URL
    const host     = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${host}/uploads/${req.file.filename}`;

    // Persist metadata in MongoDB
    const puzzle = await Puzzle.create({
      imageUrl,
      difficulty,
      originalName:  req.file.originalname,
      fileSizeBytes: req.file.size,
      mimeType:      req.file.mimetype,
    });

    return res.status(201).json({
      success:  true,
      imageUrl,                           // ← frontend loads this directly into the puzzle board
      puzzle: {
        _id:       puzzle._id,
        imageUrl:  puzzle.imageUrl,
        difficulty: puzzle.difficulty,
        gridLabel: puzzle.gridLabel,      // virtual: "4×4"
        createdAt: puzzle.createdAt,
      },
    });
  } catch (err) {
    // Multer size error → 413
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum allowed size is 10 MB.",
      });
    }
    next(err);
  }
});

// ─── GET /api/puzzles – list all saved puzzles (newest first) ─────────────
router.get("/puzzles", async (_req, res, next) => {
  try {
    const puzzles = await Puzzle.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: puzzles.length, puzzles });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/puzzles/:id – remove a puzzle + its file ─────────────────
router.delete("/puzzles/:id", async (req, res, next) => {
  try {
    const puzzle = await Puzzle.findByIdAndDelete(req.params.id);
    if (!puzzle) {
      return res.status(404).json({ success: false, message: "Puzzle not found." });
    }

    // Best-effort file removal
    const filename  = path.basename(puzzle.imageUrl);
    const filePath  = path.join(UPLOAD_DIR, filename);
    fs.unlink(filePath, () => {}); // ignore errors if already gone

    res.json({ success: true, message: "Puzzle deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;