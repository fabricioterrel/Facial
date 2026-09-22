import { useEffect, useRef, useState } from 'react';

interface UseWebcamOptions {
  width?: number;
  height?: number;
}

export const useWebcam = (options: UseWebcamOptions = { width: 640, height: 480 }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: options.width },
            height: { ideal: options.height },
            facingMode: 'user', // Cámara frontal
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al acceder a la cámara';
        setError(errorMsg);
        console.error('Error al inicializar la cámara:', err);
      }
    };

    startCamera();

    // Cleanup: Apaga la cámara al desmontar el componente
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [options.width, options.height]);

  return { videoRef, isReady, error };
};