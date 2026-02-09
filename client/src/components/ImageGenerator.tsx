import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateImageMutation = trpc.advanced.generateImage.useMutation();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez entrer une description");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateImageMutation.mutateAsync({
        prompt,
      });

      if (result.url) {
        setGeneratedImage(result.url);
        onImageGenerated?.(result.url);
      }
      toast.success("Image générée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la génération de l'image");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image téléchargée !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
      console.error(error);
    }
  };

  const copyImageUrl = () => {
    if (!generatedImage) return;
    navigator.clipboard.writeText(generatedImage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copiée !");
  };

  const resetGenerator = () => {
    setGeneratedImage(null);
    setPrompt("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold mb-4 text-foreground">
          Génération d'images IA
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description de l'image
            </label>
            <Textarea
              placeholder="Ex: Un coucher de soleil sur une plage tropicale avec palmiers..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="h-24 resize-none"
            />
          </div>

          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer une image
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Image Display */}
      {generatedImage && (
        <Card className="overflow-hidden bg-card border-border">
          <div className="aspect-square bg-muted/50 flex items-center justify-center">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 space-y-3 border-t border-border">
            <div className="flex gap-2">
              <Button
                onClick={downloadImage}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>

              <Button
                onClick={copyImageUrl}
                variant="outline"
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier URL
                  </>
                )}
              </Button>

              <Button
                onClick={resetGenerator}
                variant="outline"
                className="flex-1"
              >
                Nouvelle image
              </Button>
            </div>

            {/* Image Info */}
            <div className="bg-muted/50 p-3 rounded text-sm">
              <p className="text-muted-foreground">
                <span className="font-semibold">Prompt:</span> {prompt}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
