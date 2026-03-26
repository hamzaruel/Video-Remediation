import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileVideo, AlertCircle } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
  "video/x-m4v": [".m4v"],
};

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export function UploadZone({ onFileSelect, selectedFile }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      } else if (rejectedFiles.length > 0) {
        const file = rejectedFiles[0].file;
        const error = rejectedFiles[0].errors[0];
        
        // We could bubble this error up, but for now we'll just let the dropzone handle the UI feedback
        console.error("File rejected:", file.name, error.message);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
  });

  const hasError = fileRejections.length > 0;
  const errorMessage = hasError ? fileRejections[0].errors[0].message : null;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...getRootProps()}
            className={`
              relative overflow-hidden rounded-2xl border-2 border-dashed p-10 
              transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-center min-h-[320px]
              ${isDragActive && !isDragReject ? "border-primary bg-primary/5 scale-[1.02]" : ""}
              ${isDragReject || hasError ? "border-destructive bg-destructive/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
            `}
          >
            <input {...getInputProps()} />
            
            <div className={`p-4 rounded-full mb-6 ${isDragReject || hasError ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              {isDragReject || hasError ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-foreground text-center mb-2">
              {isDragActive && !isDragReject
                ? "Drop the video here"
                : isDragReject
                ? "File type not supported"
                : "Drag & drop your video"}
            </h3>
            
            <p className="text-center max-w-sm text-[#5E6D82]">
              {hasError 
                ? errorMessage === "File is larger than 209715200 bytes" ? "File exceeds 200MB limit" : errorMessage
                : "or click to browse from your computer. We support MP4, MOV, WEBM, and M4V files up to 200MB."}
            </p>

            <button className="mt-8 px-6 py-2.5 rounded-xl font-medium bg-background border border-border shadow-sm hover:shadow hover:border-primary/30 transition-all text-sm pointer-events-none">
              Select Video File
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border overflow-hidden bg-card shadow-lg shadow-black/5"
          >
            <div className="bg-muted p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileVideo className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[#606F85]">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onFileSelect(null as any); }}
    className="text-xs font-medium px-3 py-1.5 rounded-lg text-[#606F85]"
              >
                Change
              </button>
            </div>
            <div className="bg-black/95 relative aspect-video flex items-center justify-center">
              <video 
                src={URL.createObjectURL(selectedFile)} 
                controls 
                className="max-h-[400px] w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
