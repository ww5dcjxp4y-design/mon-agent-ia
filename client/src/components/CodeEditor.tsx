import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Copy,
  Check,
  Download,
  Play,
  Sparkles,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";

interface CodeEditorProps {
  code: string;
  language: string;
  filename?: string;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  onGenerate?: () => void;
  onRun?: () => void;
  readOnly?: boolean;
}

export function CodeEditor({
  code,
  language,
  filename = "code",
  onChange,
  onSave,
  onGenerate,
  onRun,
  readOnly = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.textContent = localCode;
      Prism.highlightElement(highlightRef.current);
    }
  }, [localCode, language]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    onChange?.(newCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copié !");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([localCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Fichier téléchargé !");
  };

  const handleSave = () => {
    onSave?.(localCode);
    toast.success("Code sauvegardé !");
  };

  return (
    <Card className="overflow-hidden bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/50 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-muted-foreground">
            {filename}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onGenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              title="Générer du code"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}

          {onRun && language === "javascript" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRun}
              title="Exécuter le code"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copier le code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Télécharger le fichier"
          >
            <Download className="h-4 w-4" />
          </Button>

          {onSave && !readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              title="Sauvegarder"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative bg-[#1e1e1e] text-white font-mono text-sm overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={handleCodeChange}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-white resize-none outline-none border-none focus:ring-0 font-mono text-sm"
          style={{
            color: "transparent",
            caretColor: "white",
            zIndex: 2,
            fontFamily: "Fira Code, Courier New, monospace",
            lineHeight: "1.5",
            tabSize: 2,
          }}
          spellCheck="false"
        />

      <pre
        ref={highlightRef}
        className={`language-${language === "html" ? "markup" : language} p-4 m-0 pointer-events-none overflow-hidden`}
        style={{
          fontFamily: "Fira Code, Courier New, monospace",
          lineHeight: "1.5",
          fontSize: "14px",
        }}
      />
      </div>

      {/* Line numbers (optional) */}
      <style>{`
        .line-numbers {
          position: absolute;
          left: 0;
          top: 0;
          width: 50px;
          background: #252526;
          color: #858585;
          padding: 1rem 0.5rem;
          text-align: right;
          border-right: 1px solid #3e3e42;
          user-select: none;
          font-family: Fira Code, Courier New, monospace;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </Card>
  );
}
