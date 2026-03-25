import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopHomeStoryRow} from '../../types/shop';
import {formatSupabaseError} from '../../utils/supabaseError';
import {getShopMediaPublicUrl, SHOP_MEDIA_BUCKET, uploadShopImage} from '../../utils/shopMedia';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
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

const card: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  padding: 24,
  boxSizing: 'border-box',
  maxWidth: 640,
};

export const AdminMuralSettings: React.FC = () => {
  const [title, setTitle] = useState('Nuestra historia');
  const [bodyText, setBodyText] = useState('');
  const [imagePaths, setImagePaths] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qErr} = await supabase
      .from('shop_home_story')
      .select('id, title, body_text, image_paths, updated_at')
      .eq('id', 'default')
      .maybeSingle();

    setLoading(false);
    if (qErr) {
      setError(formatSupabaseError(qErr));
      return;
    }
    const row = data as ShopHomeStoryRow | null;
    if (row) {
      setTitle(row.title ?? 'Nuestra historia');
      setBodyText(row.body_text ?? '');
      setImagePaths(Array.isArray(row.image_paths) ? row.image_paths : []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    setSavedOk(false);
    setError(null);
    setSaving(true);
    const {error: uErr} = await supabase.from('shop_home_story').upsert(
      {
        id: 'default',
        title: title.trim() || 'Nuestra historia',
        body_text: bodyText,
        image_paths: imagePaths,
      },
      {onConflict: 'id'},
    );
    setSaving(false);
    if (uErr) {
      setError(formatSupabaseError(uErr));
      return;
    }
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3500);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !supabase) {
      return;
    }
    setUploading(true);
    setError(null);
    const {path, error: upErr} = await uploadShopImage('home-story', file);
    setUploading(false);
    if (upErr || !path) {
      setError(upErr ? formatSupabaseError(upErr) : 'No se pudo subir la imagen.');
      return;
    }
    setImagePaths((prev) => [...prev, path]);
  };

  const removeImage = async (path: string) => {
    setImagePaths((prev) => prev.filter((p) => p !== path));
    if (supabase) {
      await supabase.storage.from(SHOP_MEDIA_BUCKET).remove([path]);
    }
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
        Mural — Nuestra historia
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
        Este bloque aparece en la página de inicio debajo de «New Arrivals».
        Sube fotos para la galería y edita el texto que cuenta la historia de la
        marca.
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
          <label style={labelStyle} htmlFor='admin-mural-title'>
            Título de la sección
          </label>
          <input
            id='admin-mural-title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Nuestra historia'
            style={{...inputStyle, marginBottom: 18, maxWidth: '100%'}}
          />

          <label style={labelStyle} htmlFor='admin-mural-body'>
            Texto de la historia
          </label>
          <textarea
            id='admin-mural-body'
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder='Escribe la historia de Candle Laine. Puedes usar varios párrafos separados por líneas en blanco.'
            rows={8}
            style={{
              ...inputStyle,
              marginBottom: 22,
              maxWidth: '100%',
              minHeight: 160,
              resize: 'vertical',
            }}
          />

          <p
            style={{
              ...labelStyle,
              marginBottom: 10,
              fontWeight: 600,
              color: '#1C2D18',
            }}
          >
            Galería de imágenes
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 12,
              marginBottom: 16,
              maxWidth: 560,
            }}
          >
            {imagePaths.map((path) => (
              <div
                key={path}
                style={{
                  position: 'relative',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `1px solid ${APP_PALETTE.border}`,
                  aspectRatio: '1',
                  backgroundColor: '#eee',
                }}
              >
                <img
                  src={getShopMediaPublicUrl(path)}
                  alt=''
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <button
                  type='button'
                  onClick={() => void removeImage(path)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    border: 'none',
                    background: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                  aria-label='Quitar imagen'
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{marginBottom: 22}}>
            <label
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                borderRadius: 8,
                border: `1px dashed ${APP_PALETTE.border}`,
                backgroundColor: 'rgba(76, 119, 92, 0.08)',
                color: '#1C2D18',
                fontFamily: 'Lato, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: uploading ? 'wait' : 'pointer',
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                style={{display: 'none'}}
                disabled={uploading}
                onChange={(e) => void onPickFile(e)}
              />
              {uploading ? 'Subiendo…' : '+ Añadir imagen'}
            </label>
          </div>

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
              {saving ? 'Guardando…' : 'Guardar mural'}
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
