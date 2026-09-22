import React, { useEffect, useState } from 'react';
import { useFaceDetection } from '../../hooks/useFaceDetection';

interface CameraFeedProps {
  userId: string;
  onSuccess: (token: string) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ userId, onSuccess }) => {
  const { videoRef, startCamera, stopCamera, captureFrameVector, isProcessing } = useFaceDetection();
  const [statusMessage, setStatusMessage] = useState<string>('Inicializando cámara...');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleAuthenticate = async () => {
    setStatusMessage('Procesando rostro...');
    const result = captureFrameVector();

    if (!result || !result.livenessPassed) {
      setStatusMessage('Prueba de vida no superada. Intente de nuevo.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/verify-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          vector: result.embedding,
          liveness_score: result.score,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage('¡Autenticación exitosa!');
        if (data.access_token) {
          onSuccess(data.access_token);
        }
      } else {
        setStatusMessage(data.message || 'Error en la verificación.');
      }
    } catch (error) {
      setStatusMessage('Error al conectar con el servidor.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: '640px', height: '480px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
      </div>
      <p style={{ fontWeight: 'bold' }}>{statusMessage}</p>
      <button 
        onClick={handleAuthenticate}
        disabled={isProcessing}
        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', background: '#0066ff', color: '#fff', border: 'none' }}
      >
        {isProcessing ? 'Verificando...' : 'Autenticar Rostro'}
      </button>
    </div>
  );
};