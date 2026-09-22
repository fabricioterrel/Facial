import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { LogReconocimiento, StatsDashboard, Usuario } from '../types';

export const Dashboard: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [logs, setLogs] = useState<LogReconocimiento[]>([]);
  const [stats, setStats] = useState<StatsDashboard>({
    totalUsuarios: 0,
    totalEscaneos: 0,
    escaneosExitosos: 0,
    tasaEfectividad: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filtro, setFiltro] = useState<string>('');

  const cargarDatosDashboard = async () => {
    setLoading(true);
    try {
      // 1. Obtener total de usuarios
      const { data: usersData, error: usersErr } = await supabase
        .from('usuarios')
        .select('id, nombre, email, created_at')
        .order('created_at', { ascending: false });

      if (usersErr) throw usersErr;

      // 2. Obtener historial de escaneos
      const { data: logsData, error: logsErr } = await supabase
        .from('logs_reconocimiento')
        .select('id, usuario_id, exitoso, similitud, created_at, usuarios(nombre, email)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsErr) throw logsErr;

      const totalU = usersData?.length || 0;
      const totalL = logsData?.length || 0;
      const exitosos = logsData?.filter((l) => l.exitoso).length || 0;
      const efectividad = totalL > 0 ? (exitosos / totalL) * 100 : 0;

      setUsuarios(usersData || []);
      setLogs(logsData as any || []);
      setStats({
        totalUsuarios: totalU,
        totalEscaneos: totalL,
        escaneosExitosos: exitosos,
        tasaEfectividad: Number(efectividad.toFixed(1)),
      });
    } catch (err: any) {
      console.error('Error cargando métricas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw error;
      cargarDatosDashboard();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando métricas del sistema...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tarjetas de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <span className="input-label">Total Usuarios</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>{stats.totalUsuarios}</h2>
        </div>
        <div className="card">
          <span className="input-label">Escaneos Recientes</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>{stats.totalEscaneos}</h2>
        </div>
        <div className="card">
          <span className="input-label">Reconocimientos Exitosos</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: '#10b981' }}>{stats.escaneosExitosos}</h2>
        </div>
        <div className="card">
          <span className="input-label">Tasa de Efectividad</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', color: '#6366f1' }}>{stats.tasaEfectividad}%</h2>
        </div>
      </div>

      <div className="grid-layout">
        {/* Tabla de Usuarios Registrados */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Usuarios Registrados ({usuariosFiltrados.length})</h2>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre o email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{ width: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bg-card-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px' }}>Usuario</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                    <td style={{ padding: '10px', fontWeight: 500 }}>{u.nombre}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => eliminarUsuario(u.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feed de Actividad / Logs */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Últimos Accesos</h2>
            <button
              onClick={cargarDatosDashboard}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Actualizar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: log.exitoso ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${log.exitoso ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: log.exitoso ? '#34d399' : '#f87171' }}>
                    {log.exitoso ? 'Acceso Concedido' : 'Rostro Desconocido'}
                  </strong>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
                {log.exitoso && log.usuarios && (
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                    {log.usuarios.nombre} ({(log.similitud * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin historial de escaneos reciente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};