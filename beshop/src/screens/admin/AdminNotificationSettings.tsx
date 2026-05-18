import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopNotificationSettingsRow} from '../../types/shop';
import {formatSupabaseError} from '../../utils/supabaseError';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  fontFamily: 'Lato, sans-serif',
  fontSize: 15,
  color: '#1C2D18',
  backgroundColor: APP_PALETTE.imageWell,
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.accent}`,
  background: APP_PALETTE.accent,
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  background: 'transparent',
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
  flexShrink: 0,
};

const card: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  padding: 24,
  boxSizing: 'border-box',
  maxWidth: 640,
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeEmailList(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const e = raw.trim().toLowerCase();
    if (!e || !isValidEmail(e) || seen.has(e)) {
      continue;
    }
    seen.add(e);
    out.push(e);
  }
  return out;
}

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

const ToggleRow: React.FC<ToggleRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 22,
      maxWidth: 560,
    }}
  >
    <div>
      <span
        style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: '#1C2D18',
        }}
      >
        {title}
      </span>
      <p
        className='t14'
        style={{
          margin: '4px 0 0',
          color: APP_PALETTE.priceMuted,
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>
    </div>
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        flexShrink: 0,
        width: 52,
        height: 30,
        borderRadius: 15,
        border: 'none',
        backgroundColor: checked
          ? APP_PALETTE.accentJade
          : 'rgba(0,0,0,0.2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        position: 'relative',
        transition: 'background-color 0.2s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 26 : 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  </div>
);

export const AdminNotificationSettings: React.FC = () => {
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyNewUsers, setNotifyNewUsers] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qErr} = await supabase
      .from('shop_notification_settings')
      .select(
        'id, recipient_emails, notify_new_orders, notify_new_users, updated_at',
      )
      .eq('id', 'default')
      .maybeSingle();

    setLoading(false);
    if (qErr) {
      setError(formatSupabaseError(qErr));
      return;
    }
    const row = data as ShopNotificationSettingsRow | null;
    if (row) {
      setRecipientEmails(normalizeEmailList(row.recipient_emails ?? []));
      setNotifyNewOrders(row.notify_new_orders);
      setNotifyNewUsers(row.notify_new_users);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addEmail = () => {
    setAddError(null);
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setAddError('Escribe un correo.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setAddError('Correo no válido.');
      return;
    }
    if (recipientEmails.includes(trimmed)) {
      setAddError('Ese correo ya está en la lista.');
      return;
    }
    setRecipientEmails((prev) => [...prev, trimmed]);
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    setRecipientEmails((prev) => prev.filter((e) => e !== email));
  };

  const save = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    setSavedOk(false);
    setError(null);
    setSaving(true);
    const emails = normalizeEmailList(recipientEmails);
    const {error: uErr} = await supabase.from('shop_notification_settings').upsert(
      {
        id: 'default',
        recipient_emails: emails,
        notify_new_orders: notifyNewOrders,
        notify_new_users: notifyNewUsers,
      },
      {onConflict: 'id'},
    );
    setSaving(false);
    if (uErr) {
      setError(formatSupabaseError(uErr));
      return;
    }
    setRecipientEmails(emails);
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3500);
  };

  return (
    <div style={card}>
      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 20,
          fontWeight: 600,
          color: '#1C2D18',
        }}
      >
        Notificaciones por email
      </h2>
      <p
        className='t14'
        style={{
          margin: 0,
          marginBottom: 22,
          lineHeight: 1.55,
          color: APP_PALETTE.priceMuted,
        }}
      >
        Añade uno o más correos del equipo. Recibirán alertas cuando haya un
        pedido nuevo o un usuario registrado (si los interruptores están activos).
      </p>

      {loading && (
        <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
          Cargando…
        </p>
      )}

      {!loading && error && (
        <p
          className='t16'
          style={{color: '#a33', marginBottom: 16, maxWidth: 560}}
        >
          {error}
        </p>
      )}

      {!loading && (
        <>
          <label style={labelStyle} htmlFor='admin-notify-email'>
            Correos de notificación
          </label>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 8,
              maxWidth: 560,
            }}
          >
            <input
              id='admin-notify-email'
              type='email'
              autoComplete='off'
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder='equipo@ejemplo.com'
              style={inputStyle}
              disabled={saving}
            />
            <button
              type='button'
              style={btnSecondary}
              onClick={addEmail}
              disabled={saving}
            >
              Agregar email
            </button>
          </div>
          {addError && (
            <p className='t14' style={{color: '#a33', margin: '0 0 12px'}}>
              {addError}
            </p>
          )}

          {recipientEmails.length === 0 ? (
            <p
              className='t14'
              style={{
                margin: '0 0 22px',
                color: APP_PALETTE.priceMuted,
                lineHeight: 1.45,
              }}
            >
              No hay correos. Agrega al menos uno para recibir alertas.
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 22px',
                padding: 0,
                maxWidth: 560,
              }}
            >
              {recipientEmails.map((email) => (
                <li
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: `1px solid ${APP_PALETTE.border}`,
                    backgroundColor: APP_PALETTE.imageWell,
                    fontFamily: 'Lato, sans-serif',
                    fontSize: 14,
                    color: '#1C2D18',
                  }}
                >
                  <span style={{wordBreak: 'break-all'}}>{email}</span>
                  <button
                    type='button'
                    onClick={() => removeEmail(email)}
                    style={{
                      flexShrink: 0,
                      border: 'none',
                      background: 'transparent',
                      color: '#a33',
                      fontFamily: 'Lato, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    aria-label={`Quitar ${email}`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ToggleRow
            title='Notificaciones de nuevos pedidos'
            description='Envía un email al equipo cuando un cliente crea un pedido en la tienda.'
            checked={notifyNewOrders}
            onChange={setNotifyNewOrders}
            disabled={saving}
          />

          <ToggleRow
            title='Notificaciones de nuevos usuarios'
            description='Envía un email al equipo cuando alguien se registra en la app.'
            checked={notifyNewUsers}
            onChange={setNotifyNewUsers}
            disabled={saving}
          />


          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button
              type='button'
              style={{
                ...btnPrimary,
                opacity: saving ? 0.7 : 1,
                pointerEvents: saving ? 'none' : 'auto',
              }}
              onClick={() => void save()}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {savedOk && (
              <span
                className='t14'
                style={{color: APP_PALETTE.accentJade, fontWeight: 600}}
              >
                Guardado
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
