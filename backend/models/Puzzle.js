import mongoose from "mongoose";

// ─── Schema ───────────────────────────────────────────────────────────────
const puzzleSchema = new mongoose.Schema(
  {
    imageUrl: {
      type:     String,
      required: [true, "imageUrl is required"],
      trim:     true,
    },

    difficulty: {
      type:    Number,
      default: 4,
      enum:    {
        values:  [4, 5, 6],
        message: "difficulty must be 4 (easy), 5 (medium), or 6 (hard)",
      },
    },

    originalName: {
      type:  String,
      trim:  true,
    },

    fileSizeBytes: {
      type: Number,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    createdAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    // Adds createdAt + updatedAt automatically; overrides our manual createdAt
    // so we keep "default: Date.now" above just for clarity in seeding.
    timestamps: true,
    versionKey: false,
  }
);

// ─── Index – useful when listing puzzles newest-first ─────────────────────
puzzleSchema.index({ createdAt: -1 });

// ─── Virtual – grid label (e.g. "4×4") ───────────────────────────────────
puzzleSchema.virtual("gridLabel").get(function () {
  return `${this.difficulty}×${this.difficulty}`;
});

// ─── Model ────────────────────────────────────────────────────────────────
const Puzzle = mongoose.model("Puzzle", puzzleSchema);

export default Puzzle;