import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onRecordingComplete: (file: File, duration: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const shouldSendRef = useRef(true);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      shouldSendRef.current = true;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });

        if (shouldSendRef.current) {
          onRecordingComplete(file, duration);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.info("Enregistrement annulé");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (disabled) return null;

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={startRecording}
          className="h-10 border-red-200 bg-red-50 px-3 text-red-600 hover:border-red-300 hover:bg-red-100 hover:text-red-700"
          aria-label="Enregistrer un vocal"
        >
          <Mic className="h-4 w-4" />
          <span className="hidden text-xs font-semibold sm:inline">Vocal</span>
        </Button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 shadow-sm ring-2 ring-red-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-700">{formatTime(recordingTime)}</span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="default"
            onClick={stopRecording}
            className="h-8 w-8 bg-green-600 text-white hover:bg-green-700"
            aria-label="Envoyer le vocal"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={cancelRecording}
            className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600"
            aria-label="Annuler le vocal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
