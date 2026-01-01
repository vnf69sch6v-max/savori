'use client';

import { useState, useRef, useCallback } from 'react';

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    audioBlob: Blob | null;
    audioUrl: string | null;
    duration: number;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
}

/**
 * React hook for recording audio using MediaRecorder API
 * Works on all modern browsers including iOS Safari
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            setAudioUrl(null);
            setDuration(0);
            chunksRef.current = [];

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000, // Good quality for speech
                }
            });

            // Determine best audio format
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : 'audio/wav';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Create blob
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Clear duration interval
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                }
            };

            mediaRecorder.onerror = () => {
                setError('Błąd nagrywania. Spróbuj ponownie.');
                setIsRecording(false);
            };

            // Start recording
            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Update duration every 100ms
            durationIntervalRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 100);

        } catch (err) {
            console.error('Recording error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Brak dostępu do mikrofonu. Zezwól w ustawieniach.');
                } else if (err.name === 'NotFoundError') {
                    setError('Nie znaleziono mikrofonu.');
                } else {
                    setError('Błąd mikrofonu: ' + err.message);
                }
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const resetRecording = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
        setError(null);
        chunksRef.current = [];
    }, [audioUrl]);

    return {
        isRecording,
        audioBlob,
        audioUrl,
        duration,
        error,
        startRecording,
        stopRecording,
        resetRecording,
    };
}
