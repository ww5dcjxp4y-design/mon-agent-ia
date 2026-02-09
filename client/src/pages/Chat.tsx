import { useAuth } from "@/_core/hooks/useAuth";
import ChatInterface from "@/components/ChatInterface";
import ChatLayout from "@/components/ChatLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Star, Trash2, Settings } from "lucide-react";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Chat() {
  const { loading: authLoading } = useAuth();
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const conversationId = params?.id ? parseInt(params.id) : null;

  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.chat.getConversation.useQuery(
    { id: conversationId! },
    { enabled: !!conversationId }
  );

  const updateMutation = trpc.chat.updateConversation.useMutation({
    onSuccess: () => {
      utils.chat.getConversations.invalidate();
      utils.chat.getConversation.invalidate({ id: conversationId! });
    },
  });

  const deleteMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation supprimée");
      utils.chat.getConversations.invalidate();
      setLocation("/");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const toggleFavorite = () => {
    if (!data?.conversation) return;
    updateMutation.mutate({
      id: conversationId!,
      isFavorite: data.conversation.isFavorite === 1 ? 0 : 1,
    });
  };

  const deleteConversation = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      deleteMutation.mutate({ id: conversationId! });
    }
  };

  if (authLoading || isLoading) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ChatLayout>
    );
  }

  if (error || !data) {
    return (
      <ChatLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Conversation introuvable</p>
          <Button onClick={() => setLocation("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {data.conversation.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Modèle: {data.conversation.model}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              disabled={updateMutation.isPending}
            >
              <Star
                className={`h-5 w-5 ${
                  data.conversation.isFavorite === 1
                    ? "fill-yellow-500 text-yellow-500"
                    : ""
                }`}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={deleteConversation}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          conversationId={conversationId!}
          initialMessages={data.messages}
        />
      </div>
    </ChatLayout>
  );
}
