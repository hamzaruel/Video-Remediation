import { useState, useCallback, useRef } from "react";

export type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export type GenerationType =
  | "captions"
  | "transcript"
  | "audio-description"
  | "all";

export interface AccessibilityResult {
  success: boolean;
  sessionId: string;
  transcript?: string;
  captions?: string;
  audioDescription?: string;
}

export function useAccessibilityGenerator() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setStatus("idle");
    setProgress(0);
    setFile(null);
    setResult(null);
    setError(null);
  }, []);

  const selectFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

const generate = useCallback((generationTypes: GenerationType[]) => {
  if (!file || generationTypes.length === 0) return;

  setStatus("uploading");
  setProgress(0);
  setError(null);

  const formData = new FormData();
  formData.append("video", file);

  generationTypes.forEach((type) => {
    formData.append("generationTypes", type);
  });

  const xhr = new XMLHttpRequest();
  xhrRef.current = xhr;

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      setProgress(percentComplete);

      if (percentComplete >= 100) {
        setStatus("processing");
      }
    }
  };

  xhr.onload = () => {
    try {
      const response = JSON.parse(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300 && response.success) {
        setResult(response);
        setStatus("success");
      } else {
        setError(response.error || "An error occurred during generation.");
        setStatus("error");
      }
    } catch (err) {
      setError("Failed to parse server response.");
      setStatus("error");
    }
  };

  xhr.onerror = () => {
    setError("Network error occurred while uploading the file.");
    setStatus("error");
  };

  xhr.open("POST", "/api/accessibility/generate", true);
  xhr.send(formData);
}, [file]);

  return {
    status,
    progress,
    file,
    result,
    error,
    selectFile,
    generate,
    reset,
  };
}
