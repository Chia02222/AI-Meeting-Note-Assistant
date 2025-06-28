
import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  audioURL: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  resetRecording: () => void;
}

export const useAudioRecorder = (): AudioRecorderState => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setAudioURL(null);
    setError(null);
    audioChunksRef.current = [];
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    resetRecording(); // Reset previous state
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("getUserMedia not supported on your browser!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        // stream.getTracks().forEach(track => track.stop()); // Ensure stream is stopped
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Error during recording.");
        setIsRecording(false);
        // stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Microphone permission denied. Please enable it in your browser settings.");
        } else {
          setError(`Could not start recording: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while trying to access the microphone.");
      }
      setIsRecording(false);
    }
  }, [resetRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.onstop = () => {
              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
              }
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
              const url = URL.createObjectURL(audioBlob);
              setAudioURL(url);
              setIsRecording(false);
              resolve(audioBlob);
            };
            mediaRecorderRef.current.stop();
        } else {
            // If not recording or recorder not initialized, resolve with null
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach(track => track.stop());
              mediaStreamRef.current = null;
            }
            setIsRecording(false);
            resolve(null);
        }
    });
  }, []);

  return { isRecording, audioURL, startRecording, stopRecording, error, resetRecording };
};
