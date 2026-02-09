import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import {
  Send,
  Loader2,
  Globe,
  Sparkles,
  Code,
  Copy,
  Check,
  Paperclip,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { VoiceRecorder } from "./VoiceRecorder";
import { ImageGenerator } from "./ImageGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

interface ChatInterfaceProps {
  conversationId: number;
  initialMessages?: Message[];
}

export default function ChatInterface({
  conversationId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState<"file" | "voice" | "image" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId,
          role: "assistant",
          content: data.content,
          createdAt: new Date(),
        },
      ]);
      setIsStreaming(false);
      
      if (data.webSearchResults && data.webSearchResults.length > 0) {
        toast.success(`${data.webSearchResults.length} résultats web trouvés`);
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi du message");
      setIsStreaming(false);
    },
  });

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    sendMessageMutation.mutate({
      conversationId,
      message: input,
      includeWebSearch,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">
                Bienvenue sur Mon Agent IA
              </h2>
              <p className="text-muted-foreground">
                Posez-moi n'importe quelle question pour commencer
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-card border border-border"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copier
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-4">
              <div className="bg-card border border-border rounded-lg p-4 max-w-[80%]">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          {/* Options */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant={includeWebSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeWebSearch(!includeWebSearch)}
            >
              <Globe className="h-4 w-4 mr-2" />
              Recherche web
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenModal("file")}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Fichier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenModal("voice")}
            >
              <Mic className="h-4 w-4 mr-2" />
              Vocal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenModal("image")}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </Button>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="lg"
              className="self-end"
            >
              {isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={openModal === "file"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploader des fichiers</DialogTitle>
          </DialogHeader>
          <FileUpload
            conversationId={conversationId}
            onFileUploaded={(file) => {
              setInput((prev) => prev + `\n\n[Fichier uploadé: ${file.url}]`);
              setOpenModal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "voice"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrement vocal</DialogTitle>
          </DialogHeader>
          <VoiceRecorder
            onTranscribed={(text) => {
              setInput((prev) => prev + " " + text);
              setOpenModal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "image"} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Génération d'images</DialogTitle>
          </DialogHeader>
          <ImageGenerator
            onImageGenerated={(url) => {
              setInput((prev) => prev + `\n\n[Image générée: ${url}]`);
              setOpenModal(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
