import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { capturarImagenDesdeVideo, autenticarConFastAPI } from '../services/fastApiService';

interface Props {
  onLoginSuccess: () => void;
}

export const AuthDashboard: React.FC<Props> = ({ onLoginSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'manual' | 'facial'>('manual');
  
  // Estados de formulario
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [facialStatus, setFacialStatus] = useState<string>('Esperando cámara...');
  
  // Estado para la barra de probabilidad
  const [porcentajeSimilitud, setPorcentajeSimilitud] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setPorcentajeSimilitud(null);
  };

  useEffect(() => {
    if (showAuthModal && authMethod === 'facial') {
      iniciarCamara();
    } else {
      detenerCamara();
    }
    return () => detenerCamara();
  }, [showAuthModal, authMethod]);

  const iniciarCamara = async () => {
    try {
      setFacialStatus('Encendiendo cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFacialStatus('Enfoca tu rostro a la cámara...');
    } catch (err) {
      setFacialStatus('Error al acceder a la cámara web.');
    }
  };

  const detenerCamara = () => {
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleAuthManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo o inicia sesión.');
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthFacial = async () => {
    if (!videoRef.current || isScanningRef.current) return;

    isScanningRef.current = true;
    setLoading(true);
    setPorcentajeSimilitud(null);
    setFacialStatus('Procesando vector biométrico en FastAPI...');

    try {
      const blob = await capturarImagenDesdeVideo(videoRef.current);
      if (!blob) {
        setFacialStatus('Error al capturar la imagen.');
        setLoading(false);
        isScanningRef.current = false;
        return;
      }

      const respuesta = await autenticarConFastAPI(blob);

      // Extraer y calcular el porcentaje de similitud
      const valorSimilitud = respuesta.usuario?.similarity ?? respuesta.similitud ?? 0;
      const porcentajeCalculado = Math.min(Math.round(valorSimilitud * 100), 100);
      setPorcentajeSimilitud(porcentajeCalculado);

      if (respuesta.exito && respuesta.usuario) {
        setFacialStatus(`¡Acceso Concedido! Bienvenido ${respuesta.usuario.nombre}`);
        detenerCamara();
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      } else {
        setFacialStatus(respuesta.mensaje || 'Rostro no reconocido');
        setLoading(false);
        isScanningRef.current = false;
      }
    } catch (err: any) {
      setFacialStatus(`Error: ${err.message}`);
      setLoading(false);
      isScanningRef.current = false;
    }
  };

  return (
    <div style={{ width: '100%', color: '#fff' }}>
      {/* SECCIÓN HERO / INFORMATIVA */}
      <section style={{ textAlign: 'center', padding: '3rem 1rem 2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(90deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sistema de Reconocimiento Facial Inteligente
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
          Plataforma de seguridad biométrica de última generación integrada con visión por computadora. 
          Procesa incrustaciones de vectores de 128 dimensiones en milisegundos mediante aceleración por GPU.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3.5rem' }}>
          <button onClick={() => openAuth('login')} className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem', borderRadius: '10px' }}>
            Iniciar Sesión
          </button>
          <button
            onClick={() => openAuth('register')}
            style={{
              padding: '12px 28px',
              fontSize: '1rem',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Registrarse
          </button>
        </div>
      </section>

      {/* MODAL DE AUTENTICACIÓN */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setAuthMethod('manual')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: authMethod === 'manual' ? 'var(--primary)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
              >
                Contraseña
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('facial')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: authMethod === 'facial' ? 'var(--primary)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
              >
                Rostro Facial
              </button>
            </div>

            <div className="card-header" style={{ justifyContent: 'center' }}>
              <h2 className="card-title">
                {authMethod === 'facial' ? 'Desbloqueo Facial' : authMode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h2>
            </div>

            {authMethod === 'manual' ? (
              <form onSubmit={handleAuthManual} className="form-group">
                <div className="input-wrapper">
                  <label className="input-label">Correo Electrónico</label>
                  <input type="email" className="input-field" placeholder="admin@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Contraseña</label>
                  <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Procesando...' : authMode === 'register' ? 'Registrarse' : 'Ingresar'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                  <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* BARRA DE PROBABILIDAD DE COINCIDENCIA */}
                {porcentajeSimilitud !== null && (
                  <div style={{ width: '100%', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#94a3b8' }}>
                      <span>Probabilidad de Coincidencia:</span>
                      <strong style={{ color: porcentajeSimilitud >= 58 ? '#34d399' : '#f87171' }}>
                        {porcentajeSimilitud}%
                      </strong>
                    </div>

                    <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${porcentajeSimilitud}%`,
                          background: porcentajeSimilitud >= 58 
                            ? 'linear-gradient(90deg, #10b981, #34d399)' 
                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                          transition: 'width 0.6s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                  {facialStatus}
                </p>

                <button type="button" onClick={handleAuthFacial} className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Verificando...' : 'Escanear Ahora'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};