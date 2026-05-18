import React, {useCallback, useEffect, useState} from 'react';

import {APP_PALETTE} from '../../theme/appPalette';
import {removeProductBackground} from '../../utils/productImageBgRemoval';
import {refineBackgroundRemovalPng} from '../../utils/productImageBgRemovalRefine';
import {productImageLooksLikeFlatWhiteBackdrop} from '../../utils/productImageBgRemovalRefine';
import {
  normalizeProductImageForCatalog,
  previewCatalogNormalize,
} from '../../utils/productImageCatalogNormalize';
import {prepareImageForBackgroundRemoval} from '../../utils/productImagePrepare';

type Step = 'ask' | 'processing' | 'result' | 'error';

type Props = {
  open: boolean;
  sourceFile: File | null;
  previewUrl: string | null;
  onClose: () => void;
  onComplete: (file: File, previewUrl: string) => void;
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  backgroundColor: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(4px)',
};

const panel: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 520,
  maxHeight: 'min(92vh, 720px)',
  overflowY: 'auto',
  borderRadius: 14,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
  padding: '20px 22px 24px',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.accent}`,
  background: APP_PALETTE.accent,
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  background: 'transparent',
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
};

export const ProductImageAssistModal: React.FC<Props> = ({
  open,
  sourceFile,
  previewUrl,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>('ask');
  const [progress, setProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [catalogPreviewOriginal, setCatalogPreviewOriginal] = useState<
    string | null
  >(null);
  const [catalogPreviewProcessed, setCatalogPreviewProcessed] = useState<
    string | null
  >(null);
  const [flatWhiteBackdrop, setFlatWhiteBackdrop] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const revokeUrl = (url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep('ask');
    setProgress(0);
    setProcessedFile(null);
    revokeUrl(catalogPreviewOriginal);
    revokeUrl(catalogPreviewProcessed);
    setCatalogPreviewOriginal(null);
    setCatalogPreviewProcessed(null);
    setErrorMsg(null);
    setFinishing(false);
    setFlatWhiteBackdrop(false);
    if (sourceFile) {
      void productImageLooksLikeFlatWhiteBackdrop(sourceFile).then(
        setFlatWhiteBackdrop,
      );
    }
  }, [open, sourceFile]);

  useEffect(() => {
    if (!open) {
      revokeUrl(catalogPreviewOriginal);
      revokeUrl(catalogPreviewProcessed);
    }
  }, [open, catalogPreviewOriginal, catalogPreviewProcessed]);

  const finishWithFile = useCallback(
    async (raw: File) => {
      setFinishing(true);
      try {
        const normalized = await normalizeProductImageForCatalog(raw);
        const url = URL.createObjectURL(normalized);
        onComplete(normalized, url);
      } finally {
        setFinishing(false);
      }
    },
    [onComplete],
  );

  const useOriginal = useCallback(() => {
    if (!sourceFile) {
      return;
    }
    void finishWithFile(sourceFile);
  }, [finishWithFile, sourceFile]);

  const useProcessed = useCallback(() => {
    if (!processedFile) {
      return;
    }
    void finishWithFile(processedFile);
  }, [finishWithFile, processedFile]);

  const runRemoval = useCallback(async () => {
    if (!sourceFile) {
      return;
    }
    setStep('processing');
    setProgress(0);
    setErrorMsg(null);
    try {
      const prepared = await prepareImageForBackgroundRemoval(sourceFile);
      let blob = await removeProductBackground(prepared, setProgress);
      blob = await refineBackgroundRemovalPng(prepared, blob);
      const base = sourceFile.name.replace(/\.[^.]+$/, '') || 'producto';
      const file = new File([blob], `${base}_sin_fondo.png`, {type: 'image/png'});
      setProcessedFile(file);

      revokeUrl(catalogPreviewOriginal);
      revokeUrl(catalogPreviewProcessed);
      const [origPrev, procPrev] = await Promise.all([
        previewCatalogNormalize(sourceFile),
        previewCatalogNormalize(file),
      ]);
      setCatalogPreviewOriginal(origPrev);
      setCatalogPreviewProcessed(procPrev);
      setProgress(100);
      setStep('result');
    } catch (e) {
      console.warn('[ProductImageAssist]', e);
      setErrorMsg(
        'No se pudo procesar la imagen. Usa «Solo centrar» con la original o reintenta.',
      );
      setStep('error');
    }
  }, [sourceFile]);

  if (!open || !sourceFile || !previewUrl) {
    return null;
  }

  return (
    <div
      style={overlay}
      role='dialog'
      aria-modal='true'
      aria-labelledby='product-image-assist-title'
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'processing' && !finishing) {
          onClose();
        }
      }}
    >
      <div style={panel}>
        <button
          type='button'
          onClick={onClose}
          disabled={step === 'processing' || finishing}
          aria-label='Cerrar'
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            border: 'none',
            background: 'transparent',
            fontSize: 22,
            lineHeight: 1,
            cursor: step === 'processing' || finishing ? 'not-allowed' : 'pointer',
            color: APP_PALETTE.priceMuted,
          }}
        >
          ×
        </button>

        {step === 'ask' && (
          <>
            <h2
              id='product-image-assist-title'
              style={{
                margin: '0 0 8px',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: '#1C2D18',
                paddingRight: 28,
              }}
            >
              Asistencia de imagen
            </h2>
            {flatWhiteBackdrop && (
              <p
                className='t14'
                style={{
                  margin: '0 0 12px',
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  color: '#8a5a00',
                  lineHeight: 1.5,
                }}
              >
                Esta foto parece tener fondo blanco. Para velas y productos
                sobre blanco, usa <strong>Solo centrar</strong> — quitar el fondo
                con IA suele dañar la imagen.
              </p>
            )}
            <p
              className='t14'
              style={{
                margin: '0 0 16px',
                lineHeight: 1.55,
                color: APP_PALETTE.priceMuted,
              }}
            >
              Puedes centrar el producto en un lienzo blanco (recomendado) o
              intentar quitar el fondo con IA. Siempre verás el resultado antes de
              guardar.
            </p>
            <div
              style={{
                borderRadius: 10,
                border: `1px solid ${APP_PALETTE.border}`,
                backgroundColor: '#fff',
                padding: 12,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
              }}
            >
              <img
                src={previewUrl}
                alt='Vista previa'
                style={{
                  maxHeight: 200,
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 8,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button type='button' style={btnPrimary} onClick={useOriginal}>
                Solo centrar (recomendado)
              </button>
              <button
                type='button'
                style={btnGhost}
                onClick={() => void runRemoval()}
              >
                Quitar fondo con IA
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div style={{textAlign: 'center', padding: '24px 8px'}}>
            <p
              style={{
                margin: '0 0 12px',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#1C2D18',
              }}
            >
              Procesando imagen…
            </p>
            <p
              className='t14'
              style={{margin: '0 0 20px', color: APP_PALETTE.priceMuted}}
            >
              Eliminando fondo ({progress}%). La primera vez puede tardar un
              poco; todo ocurre en tu navegador.
            </p>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: APP_PALETTE.accentJade,
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        )}

        {step === 'result' && (
          <>
            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: '#1C2D18',
              }}
            >
              Elige la versión
            </h2>
            <p
              className='t14'
              style={{margin: '0 0 16px', color: APP_PALETTE.priceMuted}}
            >
              Vista previa de cómo quedará en la tienda (fondo blanco, centrado).
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'center',
                    color: APP_PALETTE.priceMuted,
                    margin: '0 0 8px',
                  }}
                >
                  Solo centrar
                </p>
                <div
                  style={{
                    minHeight: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    border: `1px solid ${APP_PALETTE.border}`,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <img
                    src={catalogPreviewOriginal ?? previewUrl}
                    alt='Solo centrar'
                    style={{maxHeight: 120, maxWidth: '100%', objectFit: 'contain'}}
                  />
                </div>
                <button
                  type='button'
                  style={{...btnPrimary, width: '100%', marginTop: 8}}
                  disabled={finishing}
                  onClick={useOriginal}
                >
                  {finishing ? 'Preparando…' : 'Usar esta'}
                </button>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'center',
                    color: APP_PALETTE.accentJade,
                    margin: '0 0 8px',
                  }}
                >
                  Tras quitar fondo
                </p>
                <div
                  style={{
                    minHeight: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    padding: 8,
                    backgroundColor: '#fff',
                    border: `1px solid ${APP_PALETTE.border}`,
                  }}
                >
                  {catalogPreviewProcessed && (
                    <img
                      src={catalogPreviewProcessed}
                      alt='Sin fondo'
                      style={{
                        maxHeight: 120,
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </div>
                <button
                  type='button'
                  style={{...btnGhost, width: '100%', marginTop: 8}}
                  disabled={finishing || !processedFile}
                  onClick={useProcessed}
                >
                  {finishing ? 'Preparando…' : 'Usar esta'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'error' && (
          <>
            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: '#1C2D18',
              }}
            >
              No se pudo procesar
            </h2>
            <p className='t14' style={{margin: '0 0 18px', color: '#a33'}}>
              {errorMsg}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type='button'
                style={btnGhost}
                disabled={finishing}
                onClick={useOriginal}
              >
                Solo centrar
              </button>
              <button
                type='button'
                style={btnPrimary}
                onClick={() => void runRemoval()}
              >
                Reintentar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
