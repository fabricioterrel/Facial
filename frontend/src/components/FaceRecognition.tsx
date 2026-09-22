import React, { useState, useRef, useEffect } from 'react';
import { capturarImagenDesdeVideo, autenticarConFastAPI } from '../services/fastApiService';
import type { UsuarioFacial } from '../types';

export const FaceRecognition: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>('Enfoca tu rostro a la cámara');
  const [porcentaje, setPorcentaje] = useState<number | null>(null);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioFacial | null>(null);
  const [escanearContinuo, setEscanearContinuo] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    iniciarCamara();
    return () => {
      detenerCamara();
      detenerEscaneo();
    };
  }, []);

  // Efecto para controlar la lectura continua en tiempo real cuando se activa el switch/escaneo
  useEffect(() => {
    if (escanearContinuo) {
      intervalRef.current = setInterval(() => {
        ejecutarIdentificacion();
      }, 1500); // Evalúa cada 1.5 segundos
    } else {
      detenerEscaneo();
    }
    return () => detenerEscaneo();
  }, [escanearContinuo]);

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
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

  const detenerEscaneo = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // FUNCIÓN NÚCLEO DE IDENTIFICACIÓN (Uso manual o en bucle continuo)
  const ejecutarIdentificacion = async () => {
    if (!videoRef.current || loading) return;

    setLoading(true);

    try {
      const blob = await capturarImagenDesdeVideo(videoRef.current);
      if (!blob) {
        setMensaje('Error al capturar el fotograma');
        setLoading(false);
        return;
      }

      // Petición a la API
      const res = await autenticarConFastAPI(blob);

      console.log('✅ DATOS RECIBIDOS DEL SERVIDOR:', {
        exito: res.exito,
        mensaje: res.mensaje,
        usuario: res.usuario,
        similitud_raw: res.usuario?.similarity ?? res.similitud
      });

      const valSimilitud = res.usuario?.similarity ?? res.similitud ?? 0;
      const pct = Math.min(Math.round(valSimilitud * 100), 100);
      
      // Actualiza la barra dinámicamente en tiempo real
      setPorcentaje(pct);

      if (res.exito && res.usuario) {
        setUsuarioEncontrado(res.usuario);
        setMensaje('¡Rostro identificado con éxito!');
        console.log(`👤 Usuario detectado: ${res.usuario.nombre} (${res.usuario.email})`);
      } else {
        setUsuarioEncontrado(null);
        setMensaje(res.mensaje || 'Rostro no reconocido');
        console.warn('⚠️ No se encontró ningún rostro registrado coincidente.');
      }
    } catch (err: any) {
      console.error('❌ Error durante la petición:', err);
      setMensaje(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejador del botón único de clic
  const handleIdentificar = () => {
    console.clear();
    console.log('📸 [EVENTO CLIC]: Iniciando captura e identificación...');
    ejecutarIdentificacion();
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="card-header" style={{ justifyContent: 'center' }}>
        <h2 className="card-title">Identificación Facial en Tiempo Real</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* BARRA DINÁMICA DE PROBABILIDAD DE COINCIDENCIA */}
        {porcentaje !== null && (
          <div style={{ width: '100%', marginTop: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#94a3b8' }}>
              <span>Probabilidad de Coincidencia:</span>
              <strong style={{ color: porcentaje >= 58 ? '#34d399' : '#f87171' }}>
                {porcentaje}%
              </strong>
            </div>

            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${porcentaje}%`,
                  background: porcentaje >= 58 
                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                  transition: 'width 0.5s ease-in-out'
                }}
              />
            </div>
          </div>
        )}

        {/* TARJETA DE USUARIO RECONOCIDO */}
        {usuarioEncontrado && (
          <div
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
              ✓ Usuario Reconocido:
            </div>
            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
              👤 Nombre: <span style={{ fontWeight: 400 }}>{usuarioEncontrado.nombre}</span>
            </div>
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
              ✉️ Correo: <span style={{ color: '#60a5fa' }}>{usuarioEncontrado.email}</span>
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', margin: '0.2rem 0' }}>
          {mensaje}
        </p>

        {/* Opciones de Identificación */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={handleIdentificar} 
            className="btn-primary" 
            disabled={loading} 
            style={{ width: '100%' }}
          >
            {loading ? 'Identificando...' : 'Identificar Rostro'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            <input 
              type="checkbox" 
              checked={escanearContinuo} 
              onChange={(e) => setEscanearContinuo(e.target.checked)} 
            />
            Escanear automáticamente en tiempo real
          </label>
        </div>
      </div>
    </div>
  );
};