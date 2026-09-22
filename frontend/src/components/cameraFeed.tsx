import React from 'react';
import { useWebcam } from '../hooks/useWebCam';

export const CameraFeed: React.FC = () => {
  const { videoRef, isReady, error } = useWebcam({ width: 640, height: 480 });

  if (error) {
    return <div className="error-message">Error: {error}. Por favor otorga permisos de cámara.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      {!isReady && <p>Cargando cámara...</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Efecto espejo para mayor comodidad del usuario
          borderRadius: '8px',
        }}
      />
    </div>
  );
};