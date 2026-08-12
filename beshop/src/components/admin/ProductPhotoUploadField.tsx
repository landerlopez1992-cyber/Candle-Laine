import React, {useEffect, useRef, useState} from 'react';

import {APP_PALETTE} from '../../theme/appPalette';
import {ProductImageAssistModal} from './ProductImageAssistModal';

export type PendingProductPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type Props = {
  photos: PendingProductPhoto[];
  onChange: (photos: PendingProductPhoto[]) => void;
  disabled?: boolean;
  labelStyle?: React.CSSProperties;
};

const btnAssist: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: `1px solid ${APP_PALETTE.accentJade}`,
  background: 'rgba(76, 119, 92, 0.12)',
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnRemove: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: '#a33',
  fontFamily: 'Lato, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

function newPhotoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const ProductPhotoUploadField: React.FC<Props> = ({
  photos,
  onChange,
  disabled,
  labelStyle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [assistPhotoId, setAssistPhotoId] = useState<string | null>(null);

  const assistPhoto = photos.find((p) => p.id === assistPhotoId) ?? null;

  useEffect(() => {
    return () => {
      for (const p of photosRef.current) {
        URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  const onFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) {
      return;
    }
    const added: PendingProductPhoto[] = picked.map((file) => ({
      id: newPhotoId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...photos, ...added]);
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(photos.filter((p) => p.id !== id));
  };

  const replacePhoto = (id: string, file: File, previewUrl: string) => {
    onChange(
      photos.map((p) => {
        if (p.id !== id) {
          return p;
        }
        URL.revokeObjectURL(p.previewUrl);
        return {id, file, previewUrl};
      }),
    );
    setAssistPhotoId(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        multiple
        disabled={disabled}
        style={{display: 'none'}}
        onChange={onFilesPicked}
      />

      <button
        type='button'
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
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
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          marginBottom: 12,
        }}
      >
        Elegir archivos
      </button>

      {photos.length === 0 ? (
        <p
          className='t14'
          style={{
            margin: '0 0 16px',
            color: APP_PALETTE.textMuted,
            lineHeight: 1.45,
          }}
        >
          Sin archivos seleccionados. Tras elegir una foto puedes usar
          «Asistencia» para limpiar el fondo y centrar el producto (opcional).
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: '0 0 16px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {photos.map((photo) => (
            <li
              key={photo.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: 10,
                borderRadius: 10,
                border: `1px solid ${APP_PALETTE.border}`,
                backgroundColor: APP_PALETTE.imageWell,
              }}
            >
              <img
                src={photo.previewUrl}
                alt=''
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  flexShrink: 0,
                }}
              />
              <div style={{flex: 1, minWidth: 0}}>
                <p
                  className='t13'
                  style={{
                    margin: '0 0 8px',
                    color: '#1C2D18',
                    wordBreak: 'break-all',
                  }}
                >
                  {photo.file.name}
                </p>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                  <button
                    type='button'
                    style={btnAssist}
                    disabled={disabled}
                    onClick={() => setAssistPhotoId(photo.id)}
                  >
                    Asistencia de imagen
                  </button>
                  <button
                    type='button'
                    style={btnRemove}
                    disabled={disabled}
                    onClick={() => removePhoto(photo.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {labelStyle && (
        <p className='t12' style={{...labelStyle, marginTop: -8, marginBottom: 16}}>
          Recomendado: fondo blanco o transparente, producto centrado.
        </p>
      )}

      <ProductImageAssistModal
        open={assistPhoto != null}
        sourceFile={assistPhoto?.file ?? null}
        previewUrl={assistPhoto?.previewUrl ?? null}
        onClose={() => setAssistPhotoId(null)}
        onComplete={(file, previewUrl) => {
          if (assistPhotoId) {
            replacePhoto(assistPhotoId, file, previewUrl);
          }
        }}
      />
    </>
  );
};
