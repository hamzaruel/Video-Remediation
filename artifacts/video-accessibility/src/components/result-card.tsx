import { useState } from "react";
import { Check, Copy, Download, FileText, Type, Headphones } from "lucide-react";
import { motion } from "framer-motion";

type ResultType = "transcript" | "captions" | "audio-description";

interface ResultCardProps {
  type: ResultType;
  title: string;
  description: string;
  content: string;
  sessionId: string;
  delay?: number;
}

const ICONS = {
  "transcript": FileText,
  "captions": Type,
  "audio-description": Headphones,
};

export function ResultCard({ type, title, description, content, sessionId, delay = 0 }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[type];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const downloadUrl = `/api/accessibility/download/${type}?sessionId=${sessionId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="bg-card rounded-2xl border border-border shadow-lg shadow-black/5 overflow-hidden flex flex-col h-[500px]"
    >
      <div className="p-5 border-b border-border bg-muted/30 flex items-start space-x-4">
        <div className="p-2.5 bg-background rounded-xl shadow-sm border border-border text-primary shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex-1 p-0 relative group">
        <div className="absolute inset-0 overflow-y-auto p-5 custom-scrollbar bg-background/50">
          {type === "captions" ? (
            <pre className="font-mono text-sm text-foreground/80 whitespace-pre-wrap">
              {content || "No captions generated."}
            </pre>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
              {content ? (
                content.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <p className="italic text-muted-foreground">No content generated.</p>
              )}
            </div>
          )}
        </div>
        
        {/* Fade effect at bottom to indicate scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all text-foreground bg-background border border-border hover:bg-muted hover:border-border/80 shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Text"}
        </button>
        
        <a
          href={downloadUrl}
          download
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all text-primary-foreground bg-primary border border-transparent hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </motion.div>
  );
}
