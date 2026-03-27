import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UploadCloud, Cpu, CheckCircle2 } from "lucide-react";
import { UploadStatus } from "@/hooks/use-accessibility";

interface ProcessingStatusProps {
  status: UploadStatus;
  progress: number;
}

const PROCESSING_STEPS = [
  "Reviewing video content...",
  "Processing audio...",
  "Preparing transcript...",
  "Creating captions...",
  "Preparing audio description...",
  "Finalizing your files...",
];

export function ProcessingStatus({ status, progress }: ProcessingStatusProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === "processing") {
      // Cycle through messages while processing
      interval = setInterval(() => {
        setStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
      }, 4500); // Change message every 4.5 seconds
    } else {
      setStepIndex(0);
    }

    return () => clearInterval(interval);
  }, [status]);

  if (status === "idle" || status === "error") return null;

  const isUploading = status === "uploading";
  const isProcessing = status === "processing";

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full bg-card rounded-2xl border border-border p-6 shadow-lg shadow-black/5 overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center py-6 text-center">
        
        <div className="relative mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-primary w-16 h-16 opacity-50"
          />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {isUploading ? <UploadCloud className="w-7 h-7" /> : <Cpu className="w-7 h-7" />}
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          {isUploading ? "Uploading Video" : "Processing"}
        </h3>

        <div className="h-6 relative w-full overflow-hidden mb-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={isUploading ? "uploading" : stepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-muted-foreground absolute"
            >
              {isUploading ? `Sending to secure servers...` : PROCESSING_STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-md bg-muted rounded-full h-3 overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: isUploading ? `${progress}%` : "100%" }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          />
          
          {/* Shimmer effect for processing state */}
          {isProcessing && (
            <motion.div 
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ left: "-50%" }}
              animate={{ left: "150%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          )}
        </div>
        
        {isUploading && (
          <p className="text-sm font-medium text-foreground mt-3">{progress}% complete</p>
        )}
        {isProcessing && (
          <p className="text-xs text-muted-foreground mt-4">
            This usually takes 4-5 minutes depending on video length. Feel free to grab a coffee!
          </p>
        )}

      </div>
    </motion.div>
  );
}
