import { useRef, useState, useCallback } from 'react';

export interface DetectionResult {
  embedding: number[];
  livenessPassed: boolean;
  score: number;
}

export const useFaceDetection = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureFrameVector = useCallback((): DetectionResult | null => {
    if (!videoRef.current) return null;
    setIsProcessing(true);

    // Simulación de cálculo local de embedding (128 dimensiones) y Liveness
    const mockEmbedding = Array.from({ length: 128 }, () => Math.random());
    const mockLivenessScore = 0.95; 

    setIsProcessing(false);
    return {
      embedding: mockEmbedding,
      livenessPassed: mockLivenessScore >= 0.7,
      score: mockLivenessScore,
    };
  }, []);

  return {
    videoRef,
    startCamera,
    stopCamera,
    captureFrameVector,
    isProcessing,
  };
};