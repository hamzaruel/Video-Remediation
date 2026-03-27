import { motion, AnimatePresence } from "framer-motion";
import { UploadZone } from "@/components/upload-zone";
import { ProcessingStatus } from "@/components/processing-status";
import { ResultCard } from "@/components/result-card";
import { useAccessibilityGenerator } from "@/hooks/use-accessibility";
import { AlertTriangle, Sparkles, RefreshCcw, Github } from "lucide-react";
import logo from "../assets/images/ecomback.png";
import AppLogo from "../assets/images/Applogo.png";
import { useState } from "react";



import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Home() {
  const { status, progress, file, result, error, selectFile, generate, reset } = useAccessibilityGenerator();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
const [selectedGenerationTypes, setSelectedGenerationTypes] = useState<
  ("captions" | "transcript" | "audio-description")[]
>([]);
const toggleGenerationType = (
  type: "captions" | "transcript" | "audio-description"
) => {
  setSelectedGenerationTypes((prev) =>
    prev.includes(type)
      ? prev.filter((item) => item !== type)
      : [...prev, type]
  );
};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
  <div className="w-9 h-9 overflow-hidden rounded-lg shrink-0">
    <img
      src={AppLogo}
      alt="MediaDescribe Pro logo"
      className="w-full h-full object-cover scale-110"
    />
  </div>
  <span className="font-display font-bold text-xl tracking-tight text-foreground">
    MediaDescribe Pro
  </span>
</div>
          </div>
      <div className="text-sm font-medium text-muted-foreground hidden sm:flex items-center gap-1">
  <span>Powered by</span>
  <a href="https://ecomback.com" target="_blank" rel="noopener noreferrer">
    <img src={logo} alt="EcomBack" className="h-5 w-auto hover:opacity-80" />
  </a>
</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col">
        
        <AnimatePresence mode="wait">
          {/* View 1: Upload & Processing */}
          {status !== "success" && (
            <motion.div 
              key="upload-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              className="max-w-3xl mx-auto w-full flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4 tracking-tight">
                  Make Your Videos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Accessible</span>
                </h1>
                <p className="text-lg max-w-2xl mx-auto text-[#5E6D82]">
                Upload your video to generate captions, transcript, and audio description in one place.
                </p>
              </div>

              {error && (
                <div className="w-full mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Generation Failed</h4>
                    <p className="text-sm opacity-90 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {status === "idle" || status === "error" ? (
                <div className="w-full flex flex-col items-center">
                  <UploadZone onFileSelect={selectFile} selectedFile={file} />
                  
                {file && (
  <>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 w-full"
    >
      <button
    onClick={() => {
  setSelectedGenerationTypes([]);
  setIsGenerateModalOpen(true);
}}
        className="w-full py-4 px-8 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-primary to-indigo-500 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        Generate Files
      </button>
    </motion.div>

   <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
  <DialogContent className="sm:max-w-lg rounded-2xl">
    <DialogHeader>
      <DialogTitle>Select files to generate</DialogTitle>
      <DialogDescription>
        Choose one or more options, then generate the selected files.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-3 mt-4">
      <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
        <input
          type="checkbox"
          checked={selectedGenerationTypes.includes("captions")}
          onChange={() => toggleGenerationType("captions")}
          className="mt-1"
        />
        <div>
          <div className="font-semibold text-foreground">Captions</div>
          <div className="text-sm text-muted-foreground mt-1">
            Generate subtitle files for your video.
          </div>
        </div>
      </label>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
        <input
          type="checkbox"
          checked={selectedGenerationTypes.includes("transcript")}
          onChange={() => toggleGenerationType("transcript")}
          className="mt-1"
        />
        <div>
          <div className="font-semibold text-foreground">Transcript</div>
          <div className="text-sm text-muted-foreground mt-1">
            Generate plain text of spoken content.
          </div>
        </div>
      </label>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
        <input
          type="checkbox"
          checked={selectedGenerationTypes.includes("audio-description")}
          onChange={() => toggleGenerationType("audio-description")}
          className="mt-1"
        />
        <div>
          <div className="font-semibold text-foreground">Audio Description</div>
          <div className="text-sm text-muted-foreground mt-1">
            Generate descriptions of important visual content.
          </div>
        </div>
      </label>
    </div>

  <div className="mt-5 pt-4 border-t border-border space-y-3">
  <button
    onClick={() => {
      if (selectedGenerationTypes.length === 0) return;
      setIsGenerateModalOpen(false);
      generate(selectedGenerationTypes);
    }}
    disabled={selectedGenerationTypes.length === 0}
    className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-indigo-500 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Generate Selected
  </button>

  <button
    onClick={() => {
      setIsGenerateModalOpen(false);
      generate(["captions", "transcript", "audio-description"]);
    }}
    className="w-full py-3 px-4 rounded-xl font-semibold border border-border bg-background text-foreground hover:bg-muted transition-colors"
  >
    Generate All
  </button>
</div>
  </DialogContent>
</Dialog>
  </>
)}
                </div>
              ) : (
                <div className="w-full mt-4">
                  <ProcessingStatus status={status} progress={progress} />
                </div>
              )}
            </motion.div>
          )}

          {/* View 2: Results */}
          {status === "success" && result && (
            <motion.div 
              key="result-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-display font-bold text-foreground mb-2">Your Files Are Ready</h2>
                  <p className="text-muted-foreground">Your transcript, captions, and audio description are ready.</p>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Process Another Video
                </button>
              </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
  {result.transcript && (
    <ResultCard
      type="transcript"
      title="Transcript"
      description="Plain text of all spoken dialogue."
      content={result.transcript}
      sessionId={result.sessionId}
      delay={0.1}
    />
  )}

  {result.captions && (
    <ResultCard
      type="captions"
      title="Captions"
      description="Timed subtitles ready for video players."
      content={result.captions}
      sessionId={result.sessionId}
      delay={0.2}
    />
  )}

  {result.audioDescription && (
    <ResultCard
      type="audio-description"
      title="Audio Description"
      description="Visual context for blind & low-vision users."
      content={result.audioDescription}
      sessionId={result.sessionId}
      delay={0.3}
    />
  )}
</div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4"
              >
                <div className="p-2 bg-background rounded-full shrink-0">
                  <span className="text-xl" aria-hidden="true">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Pro Tip</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                 Mediadescribe Pro can make mistakes, Check important info.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
Generated transcript, captions, and audio description should be reviewed for final accessibility compliance.
          </p>
         
        </div>
      </footer>
    </div>
  );
}
