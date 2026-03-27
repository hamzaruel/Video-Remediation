import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { generateTranscript, generateCaptions, generateAudioDescription } from "../services/gemini";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const OUTPUTS_DIR = path.resolve(process.cwd(), "outputs");

[UPLOADS_DIR, OUTPUTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

router.post(
  "/accessibility/generate",
  upload.single("video"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No video file uploaded." });
      return;
    }

const videoPath = req.file.path;
const sessionId = uuidv4();

const rawGenerationTypes = req.body.generationTypes;
const generationTypes = Array.isArray(rawGenerationTypes)
  ? rawGenerationTypes
  : rawGenerationTypes
    ? [rawGenerationTypes]
    : ["captions", "transcript", "audio-description"];

req.log.info(
  { sessionId, file: req.file.originalname, generationTypes },
  "Starting accessibility generation"
);

    try {
      let transcript: string | undefined;
let captions: string | undefined;
let audioDescription: string | undefined;

// Save outputs to disk
const sessionDir = path.join(OUTPUTS_DIR, sessionId);
fs.mkdirSync(sessionDir, { recursive: true });

if (generationTypes.includes("transcript")) {
  req.log.info({ sessionId }, "Generating transcript");
  transcript = await generateTranscript(videoPath);
  fs.writeFileSync(path.join(sessionDir, "transcript.txt"), transcript, "utf-8");
}

if (generationTypes.includes("captions")) {
  req.log.info({ sessionId }, "Generating captions");
  captions = await generateCaptions(videoPath);
  fs.writeFileSync(path.join(sessionDir, "captions.srt"), captions, "utf-8");
  fs.writeFileSync(path.join(sessionDir, "captions.txt"), captions, "utf-8");
}

if (generationTypes.includes("audio-description")) {
  req.log.info({ sessionId }, "Generating audio description");
  audioDescription = await generateAudioDescription(videoPath);
  fs.writeFileSync(
    path.join(sessionDir, "audio-description.txt"),
    audioDescription,
    "utf-8"
  );
}

req.log.info({ sessionId, generationTypes }, "Accessibility generation complete");

res.json({
  success: true,
  sessionId,
  transcript,
  captions,
  audioDescription,
});
    } catch (err) {
      req.log.error({ err, sessionId }, "Error generating accessibility files");
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      res.status(500).json({ success: false, error: message });
    } finally {
      // Clean up the uploaded video file
      try {
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      } catch (cleanupErr) {
        logger.warn({ cleanupErr }, "Failed to clean up uploaded file");
      }
    }
  }
);

router.get("/accessibility/download/:type", (req: Request, res: Response) => {
  const { type } = req.params;
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ success: false, error: "sessionId query parameter is required." });
    return;
  }

  const validTypes: Record<string, string> = {
    transcript: "transcript.txt",
    captions: "captions.txt",
    "audio-description": "audio-description.txt",
  };

  const filename = validTypes[type];
  if (!filename) {
    res.status(400).json({ success: false, error: `Invalid type. Allowed: ${Object.keys(validTypes).join(", ")}` });
    return;
  }

  // Sanitize sessionId to prevent path traversal
  if (!/^[a-f0-9-]+$/.test(sessionId)) {
    res.status(400).json({ success: false, error: "Invalid sessionId." });
    return;
  }

  const filePath = path.join(OUTPUTS_DIR, sessionId, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: "File not found. It may have expired." });
    return;
  }

  res.download(filePath, filename);
});

export default router;
