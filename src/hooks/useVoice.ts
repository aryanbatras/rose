'use client';

import { useState, useRef, useCallback } from 'react';
import type { RecordingState } from '@/services/voice-processor';

export function useVoiceRecorder(maxDurationMs = 120000) {
  const [state, setState] = useState<RecordingState>({
    status: 'idle',
    duration: 0,
    audioBlob: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setState({ status: 'recording', duration: 0, audioBlob: null });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const duration = Date.now() - startTimeRef.current;
        setState({ status: 'preview', duration, audioBlob: blob });
      };

      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setState({ status: 'error', duration: 0, audioBlob: null, error: 'Recording error' });
      };

      recorder.start(100);

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setState((prev) => ({ ...prev, duration: elapsed }));
        if (elapsed >= maxDurationMs && recorder.state === 'recording') {
          recorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 100);
    } catch (err) {
      setState({
        status: 'error',
        duration: 0,
        audioBlob: null,
        error: err instanceof Error ? err.message : 'Microphone access denied',
      });
    }
  }, [maxDurationMs]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const discardRecording = useCallback(() => {
    setState({ status: 'idle', duration: 0, audioBlob: null });
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setState({ status: 'idle', duration: 0, audioBlob: null });
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    discardRecording,
    cleanup,
  };
}
