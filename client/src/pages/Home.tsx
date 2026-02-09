import { useAuth } from "@/_core/hooks/useAuth";
import ChatLayout from "@/components/ChatLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare,
  Sparkles,
  Globe,
  FileText,
  Mic,
  Image as ImageIcon,
  Zap,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const createConversationMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setLocation(`/chat/${data.id}`);
    },
    onError: () => {
      toast.error("Erreur lors de la création de la conversation");
    },
  });

  const startNewChat = () => {
    createConversationMutation.mutate({
      title: "Nouvelle conversation",
      model: "gpt-4.1-nano",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-2xl">
          <Sparkles className="h-20 w-20 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Mon Agent IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Votre assistant intelligent avec recherche web, analyse de documents, et bien plus
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Se connecter</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout>
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div>
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Bienvenue, {user?.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              Que puis-je faire pour vous aujourd'hui ?
            </p>
          </div>

          <Button
            size="lg"
            onClick={startNewChat}
            disabled={createConversationMutation.isPending}
            className="text-lg px-8 py-6"
          >
            {createConversationMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="h-5 w-5 mr-2" />
            )}
            Commencer une conversation
          </Button>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Recherche web</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Analyse de documents</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <Mic className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Speech-to-text</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Génération d'images</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Multi-modèles LLM</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Agents autonomes</p>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
