import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../lib/logger";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }

  return new GoogleGenAI({ apiKey });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ALLOWED_MIME_TYPES[ext];
  if (!mimeType) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  return mimeType;
}

function cleanMarkdownBlocks(text: string): string {
  return text.replace(/^```[\w]*\n?/gm, "").replace(/^```\s*$/gm, "").trim();
}

async function uploadVideoToGemini(filePath: string): Promise<string> {
  const ai = getAiClient();
  const mimeType = getMimeType(filePath);
  const fileContent = fs.readFileSync(filePath);

  logger.info({ filePath, mimeType }, "Uploading video to Gemini Files API");

  const uploadResult = await ai.files.upload({
    file: new Blob([fileContent], { type: mimeType }),
    config: { mimeType, displayName: path.basename(filePath) },
  });

  if (!uploadResult.name) {
    throw new Error("Failed to get file name from Gemini Files API upload.");
  }

  let fileState = uploadResult;
  let attempts = 0;
  const maxAttempts = 30;

  while (fileState.state !== "ACTIVE") {
    if (attempts >= maxAttempts) {
      throw new Error("Gemini file processing timed out after 5 minutes.");
    }
    if (fileState.state === "FAILED") {
      throw new Error(
        `Gemini file processing failed: ${fileState.error?.message ?? "unknown error"}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
    fileState = await ai.files.get({ name: uploadResult.name! });
    attempts++;
    logger.info(
      { state: fileState.state, attempt: attempts },
      "Waiting for Gemini file to be active"
    );
  }

  logger.info({ fileUri: fileState.uri }, "Gemini file is ready");
  return fileState.uri!;
}

async function deleteGeminiFile(fileUri: string): Promise<void> {
  const ai = getAiClient();

  try {
    const name = fileUri.split("/").slice(-2).join("/");
    await ai.files.delete({ name });
    logger.info({ fileUri }, "Deleted Gemini file");
  } catch (err) {
    logger.warn({ err, fileUri }, "Failed to delete Gemini file (non-fatal)");
  }
}

export async function generateTranscript(localFilePath: string): Promise<string> {
  const ai = getAiClient();
  const fileUri = await uploadVideoToGemini(localFilePath);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: getMimeType(localFilePath),
                fileUri,
              },
            },
            {
              text: "Transcribe all spoken dialogue in this video accurately. Return only clean plain text transcript. Do not add explanations, timestamps, speaker labels, or any other formatting. Just the spoken words.",
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "";
    return cleanMarkdownBlocks(raw);
  } finally {
    await deleteGeminiFile(fileUri);
  }
}

export async function generateCaptions(localFilePath: string): Promise<string> {
  const ai = getAiClient();
  const fileUri = await uploadVideoToGemini(localFilePath);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: getMimeType(localFilePath),
                fileUri,
              },
            },
            {
              text: `Generate captions for this video in valid SRT subtitle format with timestamps. Follow this exact format for each subtitle entry:

1
00:00:01,000 --> 00:00:04,000
Subtitle text here

2
00:00:05,000 --> 00:00:08,000
Next subtitle text

Keep subtitle chunks short (1-2 sentences max), readable, and natural. Each chunk should be 2-5 seconds. Return ONLY the raw SRT content with no extra explanation, no markdown, no code blocks.`,
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "";
    return cleanMarkdownBlocks(raw);
  } finally {
    await deleteGeminiFile(fileUri);
  }
}

export async function generateAudioDescription(localFilePath: string): Promise<string> {
  const ai = getAiClient();
  const fileUri = await uploadVideoToGemini(localFilePath);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: getMimeType(localFilePath),
                fileUri,
              },
            },
            {
              text: "Generate a concise audio description script for this video, focusing only on important visual information needed by blind or low-vision users. Describe key visual events, scene changes, on-screen actions, and important visual elements that are not conveyed by the audio. Write in present tense. Return only plain text, no markdown formatting, no explanations.",
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "";
    return cleanMarkdownBlocks(raw);
  } finally {
    await deleteGeminiFile(fileUri);
  }
}