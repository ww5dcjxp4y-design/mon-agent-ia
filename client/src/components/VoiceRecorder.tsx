import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VoiceRecorderProps {
  onTranscribed?: (text: string) => void;
}

export function VoiceRecorder({ onTranscribed }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const transcribeAudioMutation = trpc.advanced.transcribeAudio.useMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Enregistrement démarré");
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      setIsRecording(false);
      toast.success("Enregistrement arrêté");
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error("Veuillez d'abord enregistrer de l'audio");
      return;
    }

    setIsTranscribing(true);

    try {
      // Créer une URL temporaire pour l'audio
      const audioUrl = URL.createObjectURL(audioBlob);

      const result = await transcribeAudioMutation.mutateAsync({
        audioUrl,
      });

      setTranscription(result.text);
      onTranscribed?.(result.text);
      toast.success("Transcription complétée !");
    } catch (error) {
      toast.error("Erreur lors de la transcription");
      console.error(error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadAudio = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Audio téléchargé !");
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscription("");
    audioChunksRef.current = [];
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border-border">
        <h3 className="font-semibold mb-4 text-foreground">
          Enregistrement vocal
        </h3>

        <div className="space-y-4">
          {/* Recording Controls */}
          {!audioBlob ? (
            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  variant="default"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Démarrer l'enregistrement
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="flex-1"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Arrêter l'enregistrement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Audio Playback */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Aperçu de l'audio
                </p>
                <audio
                  ref={audioRef}
                  src={URL.createObjectURL(audioBlob)}
                  controls
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="flex-1"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Transcription...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Transcrire
                    </>
                  )}
                </Button>

                <Button
                  onClick={downloadAudio}
                  variant="outline"
                  size="icon"
                  title="Télécharger l'audio"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  onClick={resetRecording}
                  variant="outline"
                  size="icon"
                  title="Réinitialiser"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Result */}
      {transcription && (
        <Card className="p-4 bg-muted/50 border-border">
          <h4 className="font-semibold mb-2 text-foreground text-sm">
            Transcription
          </h4>
          <p className="text-sm text-foreground">{transcription}</p>
        </Card>
      )}
    </div>
  );
}
