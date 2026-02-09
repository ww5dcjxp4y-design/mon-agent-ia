import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeEditor } from "@/components/CodeEditor";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
];

export default function CodeGenerator() {
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [generatedCode, setGeneratedCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const generateCodeMutation = trpc.code.generateCode.useMutation();
  const analyzeCodeMutation = trpc.code.analyzeCode.useMutation();
  const createProjectMutation = trpc.code.createProject.useMutation();

  const handleGenerateCode = async () => {
    if (!description.trim()) {
      toast.error("Veuillez décrire ce que vous voulez générer");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCodeMutation.mutateAsync({
        description,
        language,
      });
      setGeneratedCode(result.code);
      toast.success("Code généré avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la génération du code");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeCode = async () => {
    if (!generatedCode.trim()) {
      toast.error("Veuillez générer ou coller du code d'abord");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeCodeMutation.mutateAsync({
        code: generatedCode,
        language,
      });
      setAnalysis(result.analysis);
      toast.success("Analyse complétée !");
    } catch (error) {
      toast.error("Erreur lors de l'analyse du code");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error("Veuillez entrer un nom pour le projet");
      return;
    }

    if (!generatedCode.trim()) {
      toast.error("Veuillez générer du code d'abord");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: projectName,
        language,
      });
      toast.success("Projet créé avec succès !");
      setProjectName("");
      setDescription("");
      setGeneratedCode("");
    } catch (error) {
      toast.error("Erreur lors de la création du projet");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Générateur de Code
          </h1>
          <p className="text-muted-foreground">
            Générez, analysez et gérez du code avec l'IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-4">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Décrivez votre code
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Langage
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Ex: Créez une fonction qui valide une adresse email..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-32 resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerateCode}
                  disabled={isGenerating || !description.trim()}
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
                      Générer du code
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Project Save */}
            {generatedCode && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  Sauvegarder le projet
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nom du projet
                    </label>
                    <Input
                      placeholder="Mon projet"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSaveProject}
                    variant="outline"
                    className="w-full"
                  >
                    Sauvegarder le projet
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Code Editor */}
          <div className="space-y-4">
            {generatedCode ? (
              <>
                <CodeEditor
                  code={generatedCode}
                  language={language}
                  onChange={setGeneratedCode}
                  onGenerate={handleGenerateCode}
                />

                <Button
                  onClick={handleAnalyzeCode}
                  variant="outline"
                  className="w-full"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Analyser le code
                    </>
                  )}
                </Button>

                {analysis && (
                  <Card className="p-4 bg-muted/50 border-border">
                    <h3 className="font-semibold mb-2 text-foreground">
                      Analyse
                    </h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 bg-muted/50 border-border border-dashed flex items-center justify-center min-h-96">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Générez du code en décrivant ce que vous voulez
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
