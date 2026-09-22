import React, { useEffect, useState } from 'react';
import './index.css';
import { supabase } from './services/supabaseClient';
import { AuthDashboard } from './components/AuthDashboard';
import { FaceRegister } from './components/FaceRegister';
import { FaceRecognition } from './components/FaceRecognition';

type SubTab = 'registro' | 'reconocimiento';

export const App: React.FC = () => {
  const [session, setSession] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SubTab>('reconocimiento');
  const [checkingSession, setCheckingSession] = useState<boolean>(true);

  // Verificar la sesión activa en Supabase
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(true);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    init();

    // Escuchar cambios de estado en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(!!currentSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(false);
  };

  if (checkingSession) {
    return (
      <div className="container loading-screen">
        <div className="spinner"></div>
        <h2>Cargando Sistema...</h2>
      </div>
    );
  }

  // Si no hay sesión activa, muestra únicamente el Dashboard Informativo
  if (!session) {
    return (
      <div className="container">
        <AuthDashboard onLoginSuccess={() => setSession(true)} />
      </div>
    );
  }

  // Panel principal tras haber iniciado sesión
  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Panel de Reconocimiento Facial</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cerrar Sesión
          </button>
        </div>

        <nav className="tabs-nav">
          <button
            className={`tab-button ${activeTab === 'reconocimiento' ? 'active' : ''}`}
            onClick={() => setActiveTab('reconocimiento')}
          >
            Identificar Rostro
          </button>
          <button
            className={`tab-button ${activeTab === 'registro' ? 'active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            Registrar Nuevo Rostro
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'reconocimiento' && <FaceRecognition />}
        {activeTab === 'registro' && <FaceRegister />}
      </main>
    </div>
  );
};

export default App;