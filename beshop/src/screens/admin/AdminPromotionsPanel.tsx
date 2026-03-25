import React, {useCallback, useEffect, useRef, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopBannerSlide} from '../../types/homeBanner';
import {getShopMediaPublicUrl, uploadShopImage} from '../../utils/shopMedia';
import {parseBannerSlides} from '../../utils/homeBannerSlides';
import {formatSupabaseError} from '../../utils/supabaseError';
import {AdminHomeCountdownForm} from './AdminHomeCountdownForm';

type PromoTab = 'banner1' | 'banner2' | 'countdown';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
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
  maxWidth: 720,
};

const emptySlide = (): ShopBannerSlide => ({
  image_path: '',
  title: '',
  subtitle: '',
  button_label: '',
  link_path: '/shop',
});

export const AdminPromotionsPanel: React.FC = () => {
  const [tab, setTab] = useState<PromoTab>('banner1');
  const fileRef = useRef<HTMLInputElement>(null);

  const [intervalSec1, setIntervalSec1] = useState(5);
  const [intervalSec2, setIntervalSec2] = useState(5);
  const [slides1, setSlides1] = useState<ShopBannerSlide[]>([]);
  const [slides2, setSlides2] = useState<ShopBannerSlide[]>([]);

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
    const {data, error: qError} = await supabase
      .from('shop_home_banners')
      .select('id, slide_interval_ms, slides')
      .in('id', ['banner_1', 'banner_2']);

    setLoading(false);
    if (qError) {
      setError(formatSupabaseError(qError));
      return;
    }
    const r1 = data?.find((r) => r.id === 'banner_1');
    const r2 = data?.find((r) => r.id === 'banner_2');
    if (r1) {
      setIntervalSec1(Math.round((r1.slide_interval_ms as number) / 1000));
      setSlides1(parseBannerSlides(r1.slides));
    }
    if (r2) {
      setIntervalSec2(Math.round((r2.slide_interval_ms as number) / 1000));
      setSlides2(parseBannerSlides(r2.slides));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentSlot = tab === 'banner1' ? 'banner_1' : 'banner_2';
  const intervalSec = tab === 'banner1' ? intervalSec1 : intervalSec2;
  const setIntervalSec = tab === 'banner1' ? setIntervalSec1 : setIntervalSec2;
  const slides = tab === 'banner1' ? slides1 : slides2;
  const setSlides = tab === 'banner1' ? setSlides1 : setSlides2;

  const updateSlide = (index: number, patch: Partial<ShopBannerSlide>) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? {...s, ...patch} : s)),
    );
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !supabase) {
      return;
    }
    setUploading(true);
    setError(null);
    const {path, error: upErr} = await uploadShopImage(
      `banners/${currentSlot}`,
      file,
    );
    setUploading(false);
    if (upErr || !path) {
      setError(upErr?.message ?? 'No se pudo subir la imagen.');
      return;
    }
    setSlides((prev) => [...prev, {...emptySlide(), image_path: path}]);
  };

  const save = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    const sec = Math.min(120, Math.max(1, intervalSec));
    const ms = sec * 1000;
    const cleanSlides = slides
      .filter((s) => s.image_path.trim())
      .map((s) => ({
        image_path: s.image_path.trim(),
        title: s.title.trim(),
        subtitle: s.subtitle.trim(),
        button_label: s.button_label.trim(),
        link_path: s.link_path.trim() || '/shop',
      }));

    setSavedOk(false);
    setError(null);
    setSaving(true);
    const {error: uError} = await supabase.from('shop_home_banners').upsert(
      {
        id: currentSlot,
        slide_interval_ms: ms,
        slides: cleanSlides,
      },
      {onConflict: 'id'},
    );
    setSaving(false);
    if (uError) {
      setError(formatSupabaseError(uError));
      return;
    }
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3500);
    void load();
  };

  return (
    <div style={{width: '100%', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto'}}>
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
        Promociones
      </h1>
      <p
        className='t18'
        style={{
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.55,
          color: APP_PALETTE.textMuted,
        }}
      >
        Banners del inicio, cuenta regresiva con producto y reloj en la página
        principal.
      </p>

      <div
        role='tablist'
        aria-label='Promociones del home'
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            {id: 'banner1' as const, label: 'Banner 1'},
            {id: 'banner2' as const, label: 'Banner 2'},
            {id: 'countdown' as const, label: 'Cuenta regresiva'},
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: `1px solid ${
                  active ? APP_PALETTE.accent : 'rgba(255,255,255,0.2)'
                }`,
                backgroundColor: active
                  ? 'rgba(241, 185, 127, 0.18)'
                  : 'rgba(255,255,255,0.06)',
                color: active ? APP_PALETTE.textOnDark : APP_PALETTE.textMuted,
                fontFamily: 'Lato, sans-serif',
                fontSize: 15,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && tab !== 'countdown' && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          Cargando…
        </p>
      )}

      {!loading && error && tab !== 'countdown' && (
        <p
          className='t16'
          style={{color: '#a33', marginBottom: 16, maxWidth: 720}}
        >
          {error}
        </p>
      )}

      {tab === 'countdown' && <AdminHomeCountdownForm />}

      {!loading && tab !== 'countdown' && (
        <div style={card}>
          <h2
            style={{
              margin: '0 0 8px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
            }}
          >
            {tab === 'banner1' ? 'Banner 1 (arriba)' : 'Banner 2 (debajo de Trending)'}
          </h2>
          <p
            className='t14'
            style={{
              margin: '0 0 8px',
              fontFamily: 'monospace',
              fontSize: 12,
              color: APP_PALETTE.priceMuted,
            }}
          >
            ID: {currentSlot}
          </p>

          <label style={labelStyle} htmlFor='admin-banner-interval'>
            Tiempo entre imágenes (segundos)
          </label>
          <input
            id='admin-banner-interval'
            type='number'
            min={1}
            max={120}
            step={1}
            value={intervalSec}
            onChange={(e) =>
              setIntervalSec(
                Math.min(120, Math.max(1, Number(e.target.value) || 1)),
                )
            }
            style={{...inputStyle, marginBottom: 18, maxWidth: 200}}
          />
          <p
            className='t12'
            style={{
              margin: '-12px 0 18px',
              color: APP_PALETTE.priceMuted,
              lineHeight: 1.45,
            }}
          >
            Solo aplica si hay más de una imagen. Entre 1 y 120 s.
          </p>

          <input
            ref={fileRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            style={{display: 'none'}}
            onChange={(e) => void onFileChange(e)}
          />

          <div style={{marginBottom: 16}}>
            <button
              type='button'
              style={{
                ...btnPrimary,
                opacity: uploading ? 0.65 : 1,
                pointerEvents: uploading ? 'none' : 'auto',
              }}
              onClick={onPickFile}
            >
              {uploading ? 'Subiendo…' : 'Añadir foto'}
            </button>
          </div>

          {slides.length === 0 && (
            <p
              className='t14'
              style={{
                color: APP_PALETTE.priceMuted,
                marginBottom: 16,
              }}
            >
              No hay imágenes. El banner no se mostrará en la tienda hasta que
              añadas al menos una foto.
            </p>
          )}

          {slides.map((slide, index) => (
            <div
              key={`${slide.image_path}-${index}`}
              style={{
                border: `1px solid ${APP_PALETTE.border}`,
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
                backgroundColor: APP_PALETTE.imageWell,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                {slide.image_path ? (
                  <img
                    alt=''
                    src={getShopMediaPublicUrl(slide.image_path)}
                    style={{
                      width: 160,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: `1px solid ${APP_PALETTE.border}`,
                    }}
                  />
                ) : (
                  <div
                    className='t12'
                    style={{
                      color: APP_PALETTE.priceMuted,
                      alignSelf: 'center',
                    }}
                  >
                    Sin imagen
                  </div>
                )}
                <button
                  type='button'
                  onClick={() => removeSlide(index)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${APP_PALETTE.border}`,
                    background: 'transparent',
                    color: APP_PALETTE.priceMuted,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Quitar
                </button>
              </div>

              <label style={labelStyle}>Título (opcional)</label>
              <input
                type='text'
                value={slide.title}
                onChange={(e) => updateSlide(index, {title: e.target.value})}
                style={{...inputStyle, marginBottom: 12}}
              />

              <label style={labelStyle}>Subtítulo (opcional)</label>
              <input
                type='text'
                value={slide.subtitle}
                onChange={(e) => updateSlide(index, {subtitle: e.target.value})}
                style={{...inputStyle, marginBottom: 12}}
              />

              <label style={labelStyle}>Texto del botón (opcional)</label>
              <input
                type='text'
                value={slide.button_label}
                onChange={(e) =>
                  updateSlide(index, {button_label: e.target.value})
                }
                placeholder='Ej. SHOP NOW'
                style={{...inputStyle, marginBottom: 12}}
              />

              <label style={labelStyle}>Enlace al pulsar el banner</label>
              <input
                type='text'
                value={slide.link_path}
                onChange={(e) =>
                  updateSlide(index, {link_path: e.target.value})
                }
                placeholder='/shop o https://…'
                style={{...inputStyle, marginBottom: 0}}
              />
            </div>
          ))}

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
              {saving ? 'Guardando…' : 'Guardar banner'}
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
        </div>
      )}
    </div>
  );
};
