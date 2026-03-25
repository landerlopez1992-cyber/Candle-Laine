import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';

import {hooks} from '../../hooks';
import {Routes} from '../../enums';
import {supabase} from '../../supabaseClient';
import {isAdminEmail} from '../../utils/adminAccess';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopCategory, ShopProduct, ShopSubcategory} from '../../types/catalog';
import {
  centsToDollars,
  dollarsToCents,
  getShopMediaPublicUrl,
  uploadShopImage,
} from '../../utils/shopMedia';
import {formatSupabaseError} from '../../utils/supabaseError';
import {svg} from '../../assets/svg';
import {AdminShell, type AdminSection} from './AdminShell';

const ADMIN_MIN_VIEWPORT_PX = 1024;

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
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
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.accent}`,
  background: APP_PALETTE.accent,
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  background: 'transparent',
  color: APP_PALETTE.textOnDark,
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  cursor: 'pointer',
};

const card: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.imageWell,
  padding: 16,
  marginBottom: 12,
};

function useViewportAtLeast(minWidthPx: number): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${minWidthPx}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidthPx}px)`);
    const onChange = () => setMatches(mq.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [minWidthPx]);

  return matches;
}

/**
 * Vista de una categoría: subcategorías y productos filtrados, con alta y edición rápida.
 */
export const AdminCategoryDetail: React.FC = () => {
  const {categoryId} = useParams<{categoryId: string}>();
  const navigate = hooks.useNavigate();
  const viewportLargeEnough = useViewportAtLeast(ADMIN_MIN_VIEWPORT_PX);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [subcategories, setSubcategories] = useState<ShopSubcategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subCatName, setSubCatName] = useState('');
  const [subCatFile, setSubCatFile] = useState<File | null>(null);

  const [prodSubcat, setProdSubcat] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDetails, setProdDetails] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCompare, setProdCompare] = useState('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodStock, setProdStock] = useState('0');
  const [flagDiscount, setFlagDiscount] = useState(false);
  const [flagOffer, setFlagOffer] = useState(false);
  const [flagHot, setFlagHot] = useState(false);
  const [flagNew, setFlagNew] = useState(false);
  const [prodFiles, setProdFiles] = useState<File[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [catEditName, setCatEditName] = useState('');
  const [catEditFile, setCatEditFile] = useState<File | null>(null);

  const [editingSubcatId, setEditingSubcatId] = useState<string | null>(null);
  const [subcatEditName, setSubcatEditName] = useState('');
  const [subcatEditFile, setSubcatEditFile] = useState<File | null>(null);

  const cid = categoryId ?? '';

  const loadCategory = useCallback(async () => {
    if (!supabase || !cid) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_categories')
      .select('*')
      .eq('id', cid)
      .maybeSingle();
    if (e) {
      setError(formatSupabaseError(e));
      setCategory(null);
      return;
    }
    setCategory((data as ShopCategory) ?? null);
  }, [cid]);

  const loadSubcategories = useCallback(async () => {
    if (!supabase || !cid) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_subcategories')
      .select('*')
      .eq('category_id', cid)
      .order('sort_order', {ascending: true});
    if (!e && data) {
      setSubcategories(data as ShopSubcategory[]);
    }
  }, [cid]);

  const loadProducts = useCallback(async () => {
    if (!supabase || !cid) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_products')
      .select('*')
      .eq('category_id', cid)
      .order('created_at', {ascending: false});
    if (!e && data) {
      setProducts(data as ShopProduct[]);
    }
  }, [cid]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadCategory(), loadSubcategories(), loadProducts()]);
    setLoading(false);
  }, [loadCategory, loadProducts, loadSubcategories]);

  useEffect(() => {
    if (!supabase) {
      navigate(Routes.SignIn, {replace: true});
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({data: {session}}) => {
      if (cancelled) {
        return;
      }
      const email = session?.user?.email;
      if (email && isAdminEmail(email)) {
        setAllowed(true);
      } else {
        navigate(Routes.TabNavigator, {replace: true});
      }
    });
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate(Routes.TabNavigator, {replace: true});
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!cid) {
      navigate(Routes.Admin, {replace: true, state: {adminSection: 'products'}});
      return;
    }
    if (allowed !== true) {
      return;
    }
    void refreshAll();
  }, [allowed, cid, navigate, refreshAll]);

  useEffect(() => {
    setProdSubcat('');
  }, [cid]);

  useEffect(() => {
    if (category) {
      setCatEditName(category.name);
    }
  }, [category]);

  useEffect(() => {
    setEditingSubcatId(null);
    setCategoryEditOpen(false);
  }, [cid]);

  useEffect(() => {
    if (allowed !== true || !viewportLargeEnough) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [allowed, viewportLargeEnough]);

  const goBackToPanel = () => {
    navigate(Routes.Admin, {state: {adminSection: 'products'}});
  };

  const onAdminSection = (s: AdminSection) => {
    navigate(Routes.Admin, {state: {adminSection: s}});
  };

  const saveCategoryMeta = async () => {
    if (!supabase || !category || !catEditName.trim()) {
      return;
    }
    setError(null);
    const {error: e} = await supabase
      .from('shop_categories')
      .update({name: catEditName.trim()})
      .eq('id', category.id);
    if (e) {
      setError(formatSupabaseError(e));
      return;
    }
    if (catEditFile) {
      const {path, error: upErr} = await uploadShopImage(
        `categories/${category.id}`,
        catEditFile,
      );
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const {error: u} = await supabase
        .from('shop_categories')
        .update({cover_storage_path: path})
        .eq('id', category.id);
      if (u) {
        setError(formatSupabaseError(u));
        return;
      }
    }
    setCatEditFile(null);
    setCategoryEditOpen(false);
    await loadCategory();
  };

  const beginEditSubcatRow = (s: ShopSubcategory) => {
    setEditingSubcatId(s.id);
    setSubcatEditName(s.name);
    setSubcatEditFile(null);
    setError(null);
  };

  const cancelEditSubcatRow = () => {
    setEditingSubcatId(null);
    setSubcatEditName('');
    setSubcatEditFile(null);
  };

  const saveEditSubcatRow = async () => {
    if (!supabase || !editingSubcatId || !subcatEditName.trim()) {
      return;
    }
    setError(null);
    const {error: e} = await supabase
      .from('shop_subcategories')
      .update({name: subcatEditName.trim()})
      .eq('id', editingSubcatId);
    if (e) {
      setError(formatSupabaseError(e));
      return;
    }
    if (subcatEditFile) {
      const {path, error: upErr} = await uploadShopImage(
        `subcategories/${editingSubcatId}`,
        subcatEditFile,
      );
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const {error: u} = await supabase
        .from('shop_subcategories')
        .update({cover_storage_path: path})
        .eq('id', editingSubcatId);
      if (u) {
        setError(formatSupabaseError(u));
        return;
      }
    }
    cancelEditSubcatRow();
    await loadSubcategories();
  };

  const headerListadoCategorias = (
    <button
      type='button'
      onClick={goBackToPanel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: 'none',
        background: 'none',
        padding: '10px 12px',
        fontFamily: 'Lato, sans-serif',
        fontSize: 14,
        color: APP_PALETTE.accent,
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      <svg.GoBackSvg />
      <span>Listado de categorías</span>
    </button>
  );

  const addSubcategory = async () => {
    if (!supabase || !subCatName.trim() || !cid) {
      return;
    }
    setError(null);
    const {data, error: e} = await supabase
      .from('shop_subcategories')
      .insert({
        category_id: cid,
        name: subCatName.trim(),
      })
      .select('id')
      .single();
    if (e || !data) {
      setError(e?.message ?? 'Error al crear subcategoría');
      return;
    }
    const id = (data as {id: string}).id;
    if (subCatFile) {
      const {path, error: upErr} = await uploadShopImage(
        `subcategories/${id}`,
        subCatFile,
      );
      if (upErr) {
        setError(upErr.message);
      } else {
        await supabase
          .from('shop_subcategories')
          .update({cover_storage_path: path})
          .eq('id', id);
      }
    }
    setSubCatName('');
    setSubCatFile(null);
    await loadSubcategories();
  };

  const deleteSubcategory = async (id: string) => {
    if (!supabase || !window.confirm('¿Eliminar esta subcategoría?')) {
      return;
    }
    const {error: e} = await supabase
      .from('shop_subcategories')
      .delete()
      .eq('id', id);
    if (e) {
      setError(e.message);
      return;
    }
    if (editingId) {
      const p = products.find((x) => x.id === editingId);
      if (p?.subcategory_id === id) {
        setEditingId(null);
        resetProductForm();
      }
    }
    await refreshAll();
  };

  const resetProductForm = () => {
    setProdSubcat('');
    setProdName('');
    setProdDetails('');
    setProdPrice('');
    setProdCompare('');
    setProdWeight('');
    setProdStock('0');
    setFlagDiscount(false);
    setFlagOffer(false);
    setFlagHot(false);
    setFlagNew(false);
    setProdFiles([]);
    setEditingId(null);
  };

  const startEdit = (p: ShopProduct) => {
    setEditingId(p.id);
    setProdSubcat(p.subcategory_id ?? '');
    setProdName(p.name);
    setProdDetails(p.details ?? '');
    setProdPrice(centsToDollars(p.price_cents));
    setProdCompare(
      p.compare_at_price_cents != null
        ? centsToDollars(p.compare_at_price_cents)
        : '',
    );
    setProdWeight(p.weight_grams != null ? String(p.weight_grams) : '');
    setProdStock(String(p.stock_quantity));
    setFlagDiscount(p.flag_discount);
    setFlagOffer(p.flag_offer);
    setFlagHot(p.flag_hot);
    setFlagNew(p.flag_new);
    setProdFiles([]);
    setError(null);
  };

  const saveProduct = async () => {
    if (!supabase || !cid) {
      return;
    }
    if (!prodName.trim()) {
      setError('Indica el nombre del producto.');
      return;
    }
    const subId = prodSubcat.trim() || null;
    if (subId) {
      const sub = subcategories.find((s) => s.id === subId);
      if (!sub || sub.category_id !== cid) {
        setError('La subcategoría no pertenece a esta categoría.');
        return;
      }
    }
    setError(null);
    const priceCents = dollarsToCents(prodPrice);
    const compareCents = prodCompare.trim()
      ? dollarsToCents(prodCompare)
      : null;
    const weightParsed = prodWeight.trim()
      ? parseInt(prodWeight, 10)
      : NaN;
    const weightGrams = Number.isFinite(weightParsed) ? weightParsed : null;
    const stock = parseInt(prodStock, 10) || 0;

    if (editingId) {
      const {error: e} = await supabase
        .from('shop_products')
        .update({
          subcategory_id: subId,
          name: prodName.trim(),
          details: prodDetails.trim() || null,
          price_cents: priceCents,
          compare_at_price_cents: compareCents,
          weight_grams: weightGrams,
          stock_quantity: stock,
          flag_discount: flagDiscount,
          flag_offer: flagOffer,
          flag_hot: flagHot,
          flag_new: flagNew,
        })
        .eq('id', editingId);

      if (e) {
        setError(formatSupabaseError(e));
        return;
      }

      let existingPaths: string[] =
        products.find((x) => x.id === editingId)?.image_paths ?? [];
      if (prodFiles.length) {
        const paths: string[] = [];
        let uploadErr: string | null = null;
        for (const f of prodFiles) {
          const {path, error: upErr} = await uploadShopImage(
            `products/${editingId}`,
            f,
          );
          if (upErr) {
            uploadErr = formatSupabaseError(upErr);
            break;
          }
          paths.push(path);
        }
        if (uploadErr) {
          setError(
            `Producto actualizado. Imágenes: ${uploadErr}`,
          );
        } else if (paths.length) {
          existingPaths = [...existingPaths, ...paths];
          const {error: upDb} = await supabase
            .from('shop_products')
            .update({image_paths: existingPaths})
            .eq('id', editingId);
          if (upDb) {
            setError(formatSupabaseError(upDb));
          }
        }
      }
      resetProductForm();
      await loadProducts();
      return;
    }

    const {data: insertedRows, error: e} = await supabase
      .from('shop_products')
      .insert({
        category_id: cid,
        subcategory_id: subId,
        name: prodName.trim(),
        details: prodDetails.trim() || null,
        price_cents: priceCents,
        compare_at_price_cents: compareCents,
        weight_grams: weightGrams,
        stock_quantity: stock,
        flag_discount: flagDiscount,
        flag_offer: flagOffer,
        flag_hot: flagHot,
        flag_new: flagNew,
        image_paths: [],
      })
      .select('id');

    if (e) {
      setError(formatSupabaseError(e));
      return;
    }

    const first = insertedRows?.[0] as {id: string} | undefined;
    if (!first?.id) {
      setError(
        'No se devolvió el producto creado (revisa RLS en shop_products).',
      );
      return;
    }
    const pid = first.id;
    const paths: string[] = [];
    let uploadErr: string | null = null;
    for (const f of prodFiles) {
      const {path, error: upErr} = await uploadShopImage(`products/${pid}`, f);
      if (upErr) {
        uploadErr = formatSupabaseError(upErr);
        break;
      }
      paths.push(path);
    }
    if (paths.length) {
      const {error: upDb} = await supabase
        .from('shop_products')
        .update({image_paths: paths})
        .eq('id', pid);
      if (upDb) {
        uploadErr = formatSupabaseError(upDb);
      }
    }
    if (uploadErr) {
      setError(
        `Producto guardado. ${uploadErr}`,
      );
    }
    resetProductForm();
    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!supabase || !window.confirm('¿Eliminar este producto?')) {
      return;
    }
    const {error: e} = await supabase.from('shop_products').delete().eq('id', id);
    if (e) {
      setError(e.message);
      return;
    }
    if (editingId === id) {
      resetProductForm();
    }
    await loadProducts();
  };

  const productFormTitle = editingId ? 'Editar producto' : 'Nuevo producto';

  const subcatsForSelect = useMemo(() => subcategories, [subcategories]);

  if (allowed !== true) {
    return (
      <main
        style={{
          minHeight: '40vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_PALETTE.adminMainBg,
        }}
      >
        <span style={{color: APP_PALETTE.textMuted}}>Cargando…</span>
      </main>
    );
  }

  if (!viewportLargeEnough) {
    return (
      <>
        <header
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            backgroundColor: 'var(--white-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            type='button'
            className='clickable'
            onClick={goBackToPanel}
            style={{
              border: 'none',
              background: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
            }}
          >
            <svg.GoBackSvg />
          </button>
        </header>
        <main
          style={{
            padding: 24,
            textAlign: 'center',
            backgroundColor: APP_PALETTE.headerBand,
            minHeight: '60vh',
          }}
        >
          <p className='t18' style={{maxWidth: 420, margin: '0 auto'}}>
            El panel admin necesita una pantalla más ancha (mín. {ADMIN_MIN_VIEWPORT_PX}px).
          </p>
        </main>
      </>
    );
  }

  if (!category && !loading && cid) {
    return (
      <AdminShell
        activeSection='products'
        onNavigateSection={onAdminSection}
        headerLeftExtra={headerListadoCategorias}
      >
        <div style={{width: '100%', maxWidth: '100%'}}>
          <p style={{color: APP_PALETTE.textMuted}}>
            No se encontró la categoría o no tienes acceso.
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeSection='products'
      onNavigateSection={onAdminSection}
      headerLeftExtra={headerListadoCategorias}
    >
      <div style={{width: '100%', maxWidth: '100%'}}>
        <h1
          style={{
            margin: '0 0 8px',
            fontFamily: 'League Spartan, sans-serif',
            fontSize: 26,
            fontWeight: 600,
            color: APP_PALETTE.textOnDark,
          }}
        >
          {category?.name ?? 'Categoría'}
        </h1>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 13,
            color: APP_PALETTE.priceMuted,
            wordBreak: 'break-all',
          }}
        >
          {cid}
        </p>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 14,
            color: APP_PALETTE.textMuted,
            lineHeight: 1.55,
          }}
        >
          Subcategorías y productos solo de esta categoría. Pulsa «Editar» en el
          listado para cambiar nombre o imagen de la categoría o de una
          subcategoría; en productos, «Editar» para el producto.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <button
            type='button'
            onClick={() => void refreshAll()}
            style={btnGhost}
          >
            Actualizar
          </button>
          <button
            type='button'
            onClick={() => {
              setCategoryEditOpen((o) => !o);
              if (category) {
                setCatEditName(category.name);
              }
              setCatEditFile(null);
            }}
            style={{
              ...btnGhost,
              borderColor: APP_PALETTE.accent,
              color: APP_PALETTE.accent,
            }}
          >
            {categoryEditOpen ? 'Cerrar edición de categoría' : 'Editar categoría'}
          </button>
        </div>

        {categoryEditOpen && category && (
          <div style={{...card, maxWidth: 520, marginBottom: 24}}>
            <label style={labelStyle}>Nombre de la categoría</label>
            <input
              style={{...inputStyle, marginBottom: 12}}
              value={catEditName}
              onChange={(e) => setCatEditName(e.target.value)}
            />
            <label style={labelStyle}>Nueva imagen de portada (opcional)</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => setCatEditFile(e.target.files?.[0] ?? null)}
              style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
            />
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
              <button
                type='button'
                style={btnPrimary}
                onClick={() => void saveCategoryMeta()}
              >
                Guardar categoría
              </button>
              <button
                type='button'
                style={btnGhost}
                onClick={() => {
                  setCategoryEditOpen(false);
                  if (category) {
                    setCatEditName(category.name);
                  }
                  setCatEditFile(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{color: APP_PALETTE.accent, marginBottom: 16}}>{error}</p>
        )}
        {loading && (
          <p style={{color: APP_PALETTE.textMuted}}>Cargando…</p>
        )}

        <section style={{marginBottom: 36}}>
          <h2
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              color: APP_PALETTE.textOnDark,
              marginBottom: 16,
            }}
          >
            Subcategorías
          </h2>
          <div style={{...card, maxWidth: 520}}>
            <label style={labelStyle}>Nombre</label>
            <input
              style={{...inputStyle, marginBottom: 12}}
              value={subCatName}
              onChange={(e) => setSubCatName(e.target.value)}
              placeholder='Ej. Velas aromáticas'
            />
            <label style={labelStyle}>Imagen de portada</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) => setSubCatFile(e.target.files?.[0] ?? null)}
              style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
            />
            <button
              type='button'
              style={btnPrimary}
              onClick={() => void addSubcategory()}
            >
              Añadir subcategoría
            </button>
          </div>

          <h3
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 18,
              margin: '20px 0 12px',
              color: APP_PALETTE.textOnDark,
            }}
          >
            Listado
          </h3>
          {subcategories.map((s) => {
            if (editingSubcatId === s.id) {
              return (
                <div key={s.id} style={{...card, maxWidth: 520}}>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    style={{...inputStyle, marginBottom: 12}}
                    value={subcatEditName}
                    onChange={(e) => setSubcatEditName(e.target.value)}
                  />
                  <label style={labelStyle}>Nueva imagen de portada (opcional)</label>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) =>
                      setSubcatEditFile(e.target.files?.[0] ?? null)
                    }
                    style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
                  />
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                    <button
                      type='button'
                      style={btnPrimary}
                      onClick={() => void saveEditSubcatRow()}
                    >
                      Guardar cambios
                    </button>
                    <button
                      type='button'
                      style={btnGhost}
                      onClick={() => cancelEditSubcatRow()}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={s.id}
                style={{
                  ...card,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: APP_PALETTE.headerBand,
                  }}
                >
                  {s.cover_storage_path ? (
                    <img
                      alt=''
                      src={getShopMediaPublicUrl(s.cover_storage_path)}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: APP_PALETTE.textMuted,
                      }}
                    >
                      —
                    </div>
                  )}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600, color: '#1C2D18'}}>{s.name}</div>
                  <div style={{fontSize: 12, color: APP_PALETTE.priceMuted}}>
                    {s.id.slice(0, 8)}…
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type='button'
                    style={{
                      ...btnGhost,
                      borderColor: APP_PALETTE.accent,
                      color: APP_PALETTE.accent,
                    }}
                    onClick={() => beginEditSubcatRow(s)}
                  >
                    Editar
                  </button>
                  <button
                    type='button'
                    style={btnGhost}
                    onClick={() => void deleteSubcategory(s.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
          {!subcategories.length && (
            <p style={{color: APP_PALETTE.textMuted}}>
              Sin subcategorías. Puedes crear productos solo con la categoría.
            </p>
          )}
        </section>

        <section>
          <h2
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              color: APP_PALETTE.textOnDark,
              marginBottom: 16,
            }}
          >
            {productFormTitle}
          </h2>
          <div style={{...card, maxWidth: 640}}>
            <label style={labelStyle}>Subcategoría (opcional)</label>
            <select
              style={{...inputStyle, marginBottom: 12, maxWidth: '100%'}}
              value={prodSubcat}
              onChange={(e) => setProdSubcat(e.target.value)}
            >
              <option value=''>— Solo esta categoría —</option>
              {subcatsForSelect.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Nombre</label>
            <input
              style={{...inputStyle, marginBottom: 12, maxWidth: '100%'}}
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
            />

            <label style={labelStyle}>Detalles</label>
            <textarea
              style={{
                ...inputStyle,
                maxWidth: '100%',
                minHeight: 100,
                resize: 'vertical',
                marginBottom: 12,
              }}
              value={prodDetails}
              onChange={(e) => setProdDetails(e.target.value)}
            />

            <label style={labelStyle}>
              Fotos {editingId ? '(añadir más)' : ''}
            </label>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={(e) =>
                setProdFiles(Array.from(e.target.files ?? []))
              }
              style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
            />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: APP_PALETTE.textOnDark,
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                }}
              >
                <input
                  type='checkbox'
                  checked={flagDiscount}
                  onChange={(e) => setFlagDiscount(e.target.checked)}
                />
                Descuento
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: APP_PALETTE.textOnDark,
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                }}
              >
                <input
                  type='checkbox'
                  checked={flagOffer}
                  onChange={(e) => setFlagOffer(e.target.checked)}
                />
                Oferta
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: APP_PALETTE.textOnDark,
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                }}
              >
                <input
                  type='checkbox'
                  checked={flagHot}
                  onChange={(e) => setFlagHot(e.target.checked)}
                />
                Caliente
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: APP_PALETTE.textOnDark,
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                }}
              >
                <input
                  type='checkbox'
                  checked={flagNew}
                  onChange={(e) => setFlagNew(e.target.checked)}
                />
                Novedad
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Peso (g)</label>
                <input
                  style={{...inputStyle, maxWidth: '100%'}}
                  value={prodWeight}
                  onChange={(e) => setProdWeight(e.target.value)}
                  placeholder='250'
                />
              </div>
              <div>
                <label style={labelStyle}>Stock</label>
                <input
                  style={{...inputStyle, maxWidth: '100%'}}
                  type='number'
                  min={0}
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Precio ($)</label>
                <input
                  style={{...inputStyle, maxWidth: '100%'}}
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder='10.00'
                />
              </div>
              <div>
                <label style={labelStyle}>Precio antes ($)</label>
                <input
                  style={{...inputStyle, maxWidth: '100%'}}
                  value={prodCompare}
                  onChange={(e) => setProdCompare(e.target.value)}
                  placeholder='18.99'
                />
              </div>
            </div>

            <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
              <button
                type='button'
                style={btnPrimary}
                onClick={() => void saveProduct()}
              >
                {editingId ? 'Guardar cambios' : 'Guardar producto'}
              </button>
              {editingId && (
                <button
                  type='button'
                  style={btnGhost}
                  onClick={() => resetProductForm()}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>

          <h3
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 18,
              color: APP_PALETTE.textOnDark,
              margin: '28px 0 12px',
            }}
          >
            Productos en «{category?.name ?? '…'}»
          </h3>
          {products.map((p) => {
            const sub =
              p.subcategory_id != null
                ? subcategories.find((s) => s.id === p.subcategory_id)
                : null;
            const placeLabel = sub
              ? `→ ${sub.name}`
              : 'Solo categoría';
            return (
              <div key={p.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                    {(p.image_paths ?? []).map((path) => (
                      <img
                        key={path}
                        alt=''
                        src={getShopMediaPublicUrl(path)}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{flex: 1, minWidth: 200}}>
                    <div style={{fontWeight: 700, color: '#1C2D18'}}>
                      {p.name}
                    </div>
                    <div style={{fontSize: 13, color: APP_PALETTE.priceMuted}}>
                      {placeLabel}
                    </div>
                    <div style={{fontSize: 13, marginTop: 6}}>
                      <strong style={{color: APP_PALETTE.accent}}>
                        ${centsToDollars(p.price_cents)}
                      </strong>
                      {p.compare_at_price_cents != null && (
                        <span
                          style={{
                            textDecoration: 'line-through',
                            marginLeft: 8,
                          }}
                        >
                          ${centsToDollars(p.compare_at_price_cents)}
                        </span>
                      )}
                      {' · '}
                      {p.weight_grams != null ? `${p.weight_grams} g` : '—'} ·
                      Stock {p.stock_quantity}
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                    <button
                      type='button'
                      style={{
                        ...btnGhost,
                        borderColor: APP_PALETTE.accent,
                        color: APP_PALETTE.accent,
                      }}
                      onClick={() => startEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      type='button'
                      style={btnGhost}
                      onClick={() => void deleteProduct(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!products.length && !loading && (
            <p style={{color: APP_PALETTE.textMuted}}>
              No hay productos en esta categoría todavía.
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
};
