import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ProfileRow} from '../../types/shop';

const tableShell: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  color: '#1C2D18',
};

const thTd: React.CSSProperties = {
  borderBottom: `1px solid ${APP_PALETTE.border}`,
  padding: '12px 14px',
  textAlign: 'left',
};

export const AdminUsersPanel: React.FC = () => {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qError} = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', {ascending: false});

    setLoading(false);
    if (qError) {
      setError(qError.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as ProfileRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{width: '100%'}}>
      <h1
        style={{
          margin: 0,
          marginBottom: 12,
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 28,
          fontWeight: 600,
          color: APP_PALETTE.textOnDark,
        }}
      >
        Usuarios
      </h1>
      <p
        className='t18'
        style={{
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.55,
          color: APP_PALETTE.textMuted,
        }}
      >
        Usuarios registrados en la app (tabla{' '}
        <code style={{fontSize: 13}}>profiles</code>, sincronizada con Auth).
        Cada alta nueva aparece aquí automáticamente.
      </p>

      {loading && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          Cargando…
        </p>
      )}
      {error && (
        <p
          className='t16'
          style={{color: APP_PALETTE.accent, marginBottom: 16}}
        >
          {error}
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          No hay usuarios en <code>profiles</code>. Ejecuta la migración SQL en
          Supabase y vuelve a cargar.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.imageWell,
          }}
        >
          <table style={tableShell}>
            <thead>
              <tr style={{backgroundColor: 'rgba(76, 119, 92, 0.12)'}}>
                <th style={thTd}>Email</th>
                <th style={thTd}>Nombre</th>
                <th style={thTd}>Alta</th>
                <th style={thTd}>ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={thTd}>{r.email ?? '—'}</td>
                  <td style={thTd}>{r.full_name?.trim() || '—'}</td>
                  <td style={thTd}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString('es-ES')
                      : '—'}
                  </td>
                  <td
                    style={{
                      ...thTd,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      maxWidth: 200,
                      wordBreak: 'break-all',
                    }}
                  >
                    {r.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type='button'
        className='clickable'
        onClick={() => void load()}
        style={{
          marginTop: 20,
          padding: '10px 18px',
          borderRadius: 8,
          border: `1px solid ${APP_PALETTE.accent}`,
          background: 'transparent',
          color: APP_PALETTE.accent,
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Actualizar lista
      </button>
    </div>
  );
};
