import React, { useState, useRef, useEffect } from 'react';
import { capturarImagenDesdeVideo, registrarRostroConFastAPI } from '../services/fastApiService';

export const FaceRegister: React.FC = () => {
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    iniciarCamara();
    return () => detenerCamara();
  }, []);

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMensaje('Error al acceder a la cámara web.');
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoRef.current) return;

    setLoading(true);
    setMensaje('Capturando rostro y registrando en la BD...');

    try {
      const blob = await capturarImagenDesdeVideo(videoRef.current);
      if (!blob) {
        setMensaje('No se pudo capturar la foto.');
        setLoading(false);
        return;
      }

      const res = await registrarRostroConFastAPI(nombre, email, blob);
      if (res.exito) {
        setMensaje('¡Usuario registrado exitosamente!');
        setNombre('');
        setEmail('');
      } else {
        setMensaje('Ocurrió un error al registrar.');
      }
    } catch (err: any) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card-header">
        <h2 className="card-title">Registrar Nuevo Usuario Facial</h2>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '1rem' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
          <label className="input-label">Nombre Completo</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej. Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="input-wrapper" style={{ marginBottom: '1rem' }}>
          <label className="input-label">Correo Electrónico</label>
          <input
            type="email"
            className="input-field"
            placeholder="juan@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mensaje && (
          <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            {mensaje}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Guardando...' : 'Capturar Rostro y Guardar'}
        </button>
      </form>
    </div>
  );
};