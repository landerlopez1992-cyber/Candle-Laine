import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {generatePath} from 'react-router-dom';

import {hooks} from '../../hooks';
import {Routes} from '../../enums';
import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {
  ShopCategory,
  ShopProduct,
  ShopSubcategory,
} from '../../types/catalog';
import {
  centsToDollars,
  dollarsToCents,
  getShopMediaPublicUrl,
  uploadShopImage,
} from '../../utils/shopMedia';
import {formatSupabaseError} from '../../utils/supabaseError';

type InnerTab = 'categories' | 'subcategories' | 'products';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
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

export const AdminProductsPanel: React.FC = () => {
  const navigate = hooks.useNavigate();
  const [innerTab, setInnerTab] = useState<InnerTab>('categories');
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ShopSubcategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [catName, setCatName] = useState('');
  const [catFile, setCatFile] = useState<File | null>(null);

  const [subCatParent, setSubCatParent] = useState('');
  const [subCatName, setSubCatName] = useState('');
  const [subCatFile, setSubCatFile] = useState<File | null>(null);

  /** Categoría obligatoria al crear un producto. */
  const [prodCategory, setProdCategory] = useState('');
  /** Vacío = producto solo en la categoría (sin subcategoría). */
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
  /** Formulario de alta/edición: oculto por defecto para ver solo el listado. */
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatFile, setEditCatFile] = useState<File | null>(null);

  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(
    null,
  );
  const [editSubcatRowName, setEditSubcatRowName] = useState('');
  const [editSubcatRowFile, setEditSubcatRowFile] = useState<File | null>(null);

  const loadCategories = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_categories')
      .select('*')
      .order('sort_order', {ascending: true});
    if (!e && data) {
      setCategories(data as ShopCategory[]);
    }
  }, []);

  const loadSubcategories = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_subcategories')
      .select('*')
      .order('sort_order', {ascending: true});
    if (!e && data) {
      setSubcategories(data as ShopSubcategory[]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const {data, error: e} = await supabase
      .from('shop_products')
      .select('*')
      .order('created_at', {ascending: false});
    if (!e && data) {
      setProducts(data as ShopProduct[]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadCategories(), loadSubcategories(), loadProducts()]);
    setLoading(false);
  }, [loadCategories, loadProducts, loadSubcategories]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (categories.length && !subCatParent) {
      setSubCatParent(categories[0].id);
    }
  }, [categories, subCatParent]);

  useEffect(() => {
    if (categories.length && !prodCategory) {
      setProdCategory(categories[0].id);
    }
  }, [categories, prodCategory]);

  useEffect(() => {
    setEditingSubcategoryId(null);
  }, [subCatParent]);

  useEffect(() => {
    if (innerTab !== 'products') {
      setShowProductForm(false);
      setEditingProductId(null);
    }
  }, [innerTab]);

  const resetProductFormFields = useCallback(() => {
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
    setEditingProductId(null);
    setProdSubcat('');
  }, []);

  const closeProductForm = useCallback(() => {
    resetProductFormFields();
    setShowProductForm(false);
  }, [resetProductFormFields]);

  const openCreateProduct = useCallback(() => {
    resetProductFormFields();
    setShowProductForm(true);
  }, [resetProductFormFields]);

  const beginEditProduct = useCallback((p: ShopProduct) => {
    setEditingProductId(p.id);
    setProdCategory(p.category_id);
    setProdSubcat(p.subcategory_id != null ? String(p.subcategory_id) : '');
    setProdName(p.name);
    setProdDetails(p.details ?? '');
    setProdPrice(centsToDollars(p.price_cents));
    setProdCompare(
      p.compare_at_price_cents != null
        ? centsToDollars(p.compare_at_price_cents)
        : '',
    );
    setProdWeight(p.weight_grams != null ? String(p.weight_grams) : '');
    setProdStock(String(p.stock_quantity ?? 0));
    setFlagDiscount(Boolean(p.flag_discount));
    setFlagOffer(Boolean(p.flag_offer));
    setFlagHot(Boolean(p.flag_hot));
    setFlagNew(Boolean(p.flag_new));
    setProdFiles([]);
    setShowProductForm(true);
  }, []);

  /** Fila actual en listado (para miniaturas al editar; se actualiza tras guardar). */
  const productBeingEdited = useMemo(
    () =>
      editingProductId
        ? products.find((pr) => pr.id === editingProductId) ?? null
        : null,
    [editingProductId, products],
  );

  const addCategory = async () => {
    if (!supabase || !catName.trim()) {
      return;
    }
    setError(null);
    const {data, error: e} = await supabase
      .from('shop_categories')
      .insert({name: catName.trim()})
      .select('id')
      .single();
    if (e || !data) {
      setError(e?.message ?? 'Error al crear categoría');
      return;
    }
    const id = (data as {id: string}).id;
    if (catFile) {
      const {path, error: upErr} = await uploadShopImage(
        `categories/${id}`,
        catFile,
      );
      if (upErr) {
        setError(upErr.message);
      } else {
        await supabase
          .from('shop_categories')
          .update({cover_storage_path: path})
          .eq('id', id);
      }
    }
    setCatName('');
    setCatFile(null);
    await loadCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!supabase || !window.confirm('¿Eliminar esta categoría y todo lo que contiene?')) {
      return;
    }
    const {error: e} = await supabase.from('shop_categories').delete().eq('id', id);
    if (e) {
      setError(e.message);
      return;
    }
    await refreshAll();
  };

  const beginEditCategory = (c: ShopCategory) => {
    setEditingCategoryId(c.id);
    setEditCatName(c.name);
    setEditCatFile(null);
    setError(null);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCatName('');
    setEditCatFile(null);
  };

  const saveEditCategory = async () => {
    if (!supabase || !editingCategoryId || !editCatName.trim()) {
      return;
    }
    setError(null);
    const {error: e} = await supabase
      .from('shop_categories')
      .update({name: editCatName.trim()})
      .eq('id', editingCategoryId);
    if (e) {
      setError(e.message);
      return;
    }
    if (editCatFile) {
      const {path, error: upErr} = await uploadShopImage(
        `categories/${editingCategoryId}`,
        editCatFile,
      );
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const {error: u} = await supabase
        .from('shop_categories')
        .update({cover_storage_path: path})
        .eq('id', editingCategoryId);
      if (u) {
        setError(u.message);
        return;
      }
    }
    cancelEditCategory();
    await loadCategories();
  };

  const beginEditSubcategory = (s: ShopSubcategory) => {
    setEditingSubcategoryId(s.id);
    setEditSubcatRowName(s.name);
    setEditSubcatRowFile(null);
    setError(null);
  };

  const cancelEditSubcategory = () => {
    setEditingSubcategoryId(null);
    setEditSubcatRowName('');
    setEditSubcatRowFile(null);
  };

  const saveEditSubcategory = async () => {
    if (!supabase || !editingSubcategoryId || !editSubcatRowName.trim()) {
      return;
    }
    setError(null);
    const {error: e} = await supabase
      .from('shop_subcategories')
      .update({name: editSubcatRowName.trim()})
      .eq('id', editingSubcategoryId);
    if (e) {
      setError(e.message);
      return;
    }
    if (editSubcatRowFile) {
      const {path, error: upErr} = await uploadShopImage(
        `subcategories/${editingSubcategoryId}`,
        editSubcatRowFile,
      );
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const {error: u} = await supabase
        .from('shop_subcategories')
        .update({cover_storage_path: path})
        .eq('id', editingSubcategoryId);
      if (u) {
        setError(u.message);
        return;
      }
    }
    cancelEditSubcategory();
    await loadSubcategories();
  };

  const addSubcategory = async () => {
    if (!supabase || !subCatName.trim() || !subCatParent) {
      return;
    }
    setError(null);
    const {data, error: e} = await supabase
      .from('shop_subcategories')
      .insert({
        category_id: subCatParent,
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
    if (!supabase || !window.confirm('¿Eliminar esta subcategoría y sus productos?')) {
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
    await refreshAll();
  };

  const addProduct = async () => {
    if (!supabase) {
      return;
    }
    if (!prodName.trim()) {
      setError('Indica el nombre del producto.');
      return;
    }
    if (!prodCategory) {
      setError('Elige una categoría.');
      return;
    }
    const subId = prodSubcat.trim() || null;
    if (subId) {
      const sub = subcategories.find((s) => s.id === subId);
      if (!sub || sub.category_id !== prodCategory) {
        setError('La subcategoría no corresponde a la categoría elegida.');
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

    const {data: insertedRows, error: e} = await supabase
      .from('shop_products')
      .insert({
        category_id: prodCategory,
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
      let msg = formatSupabaseError(e);
      if (
        /column|category_id|does not exist|schema cache/i.test(msg) ||
        ('code' in e && e.code === 'PGRST204')
      ) {
        msg +=
          ' · Ejecuta en Supabase la migración `20250324170000_shop_products_category_optional.sql` (o reset del esquema) para añadir `category_id` y subcategoría opcional.';
      }
      if (
        /row-level security|RLS|42501/i.test(msg) ||
        ('code' in e && e.code === '42501')
      ) {
        msg +=
          ' · Inicia sesión como administrador (email allowlist) o revisa políticas RLS en `shop_products`.';
      }
      setError(msg);
      return;
    }

    const first = insertedRows?.[0] as {id: string} | undefined;
    if (!first?.id) {
      setError(
        'El servidor no devolvió el producto creado (¿política RLS bloqueando el SELECT tras INSERT?). Revisa `shop_products` en Supabase.',
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
        `Producto guardado en la base de datos. ${paths.length ? 'Algunas imágenes no se pudieron asociar' : 'Las imágenes no se pudieron subir'}: ${uploadErr} · Revisa el bucket Storage «shop-media» y permisos de admin.`,
      );
    } else {
      setError(null);
    }

    closeProductForm();
    await loadProducts();
  };

  const updateProduct = async () => {
    if (!supabase || !editingProductId) {
      return;
    }
    if (!prodName.trim()) {
      setError('Indica el nombre del producto.');
      return;
    }
    if (!prodCategory) {
      setError('Elige una categoría.');
      return;
    }
    const subId = prodSubcat.trim() || null;
    if (subId) {
      const sub = subcategories.find((s) => s.id === subId);
      if (!sub || sub.category_id !== prodCategory) {
        setError('La subcategoría no corresponde a la categoría elegida.');
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

    const {error: e} = await supabase
      .from('shop_products')
      .update({
        category_id: prodCategory,
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
      .eq('id', editingProductId);

    if (e) {
      setError(formatSupabaseError(e));
      return;
    }

    const pid = editingProductId;
    const existingPaths =
      products.find((row) => row.id === pid)?.image_paths ?? [];
    const paths: string[] = [...existingPaths];
    let uploadErr: string | null = null;
    for (const f of prodFiles) {
      const {path, error: upErr} = await uploadShopImage(`products/${pid}`, f);
      if (upErr) {
        uploadErr = formatSupabaseError(upErr);
        break;
      }
      paths.push(path);
    }
    if (prodFiles.length && !uploadErr) {
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
        `Producto actualizado. ${prodFiles.length ? 'Algunas imágenes no se pudieron subir' : ''}: ${uploadErr}`,
      );
    } else {
      setError(null);
    }

    closeProductForm();
    await loadProducts();
  };

  const saveProduct = async () => {
    if (editingProductId) {
      await updateProduct();
    } else {
      await addProduct();
    }
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
    await loadProducts();
  };

  const tabBtn = (tab: InnerTab, label: string) => (
    <button
      key={tab}
      type='button'
      onClick={() => setInnerTab(tab)}
      style={{
        ...btnGhost,
        borderColor:
          innerTab === tab ? APP_PALETTE.accent : APP_PALETTE.border,
        color: innerTab === tab ? APP_PALETTE.accent : APP_PALETTE.textOnDark,
        fontWeight: innerTab === tab ? 600 : 400,
      }}
    >
      {label}
    </button>
  );

  const subcatsForSelect = subcategories.filter(
    (s) => !subCatParent || s.category_id === subCatParent,
  );

  return (
    <div style={{width: '100%'}}>
      <h1
        style={{
          margin: 0,
          marginBottom: 8,
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 28,
          fontWeight: 600,
          color: APP_PALETTE.textOnDark,
        }}
      >
        Productos
      </h1>
      <p
        style={{
          margin: '0 0 20px',
          lineHeight: 1.55,
          color: APP_PALETTE.textMuted,
          fontSize: 16,
        }}
      >
        Categorías y subcategorías con portada; productos con fotos, precio /
        precio anterior, peso, stock y etiquetas.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 28,
        }}
      >
        {tabBtn('categories', 'Categorías')}
        {tabBtn('subcategories', 'Subcategorías')}
        {tabBtn('products', 'Productos')}
        <button
          type='button'
          onClick={() => void refreshAll()}
          style={{...btnGhost, marginLeft: 'auto'}}
        >
          Actualizar todo
        </button>
      </div>

      {error && (
        <p style={{color: APP_PALETTE.accent, marginBottom: 16}}>{error}</p>
      )}
      {loading && (
        <p style={{color: APP_PALETTE.textMuted}}>Cargando…</p>
      )}

      {innerTab === 'categories' && (
        <div>
          <h2
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              color: APP_PALETTE.textOnDark,
              marginBottom: 16,
            }}
          >
            Nueva categoría
          </h2>
          <div style={{...card, maxWidth: 520}}>
            <label style={labelStyle}>Nombre</label>
            <input
              style={{...inputStyle, marginBottom: 12}}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ej. Velas"
            />
            <label style={labelStyle}>Imagen de portada</label>
            <input
              type='file'
              accept='image/*'
              onChange={(e) =>
                setCatFile(e.target.files?.[0] ?? null)
              }
              style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
            />
            <button type='button' style={btnPrimary} onClick={() => void addCategory()}>
              Guardar categoría
            </button>
          </div>

          {editingCategoryId && (
            <>
              <h2
                style={{
                  fontFamily: 'League Spartan, sans-serif',
                  fontSize: 20,
                  color: APP_PALETTE.textOnDark,
                  marginBottom: 16,
                }}
              >
                Editar categoría
              </h2>
              <div style={{...card, maxWidth: 520}}>
                <label style={labelStyle}>Nombre</label>
                <input
                  style={{...inputStyle, marginBottom: 12}}
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                />
                <label style={labelStyle}>Nueva imagen de portada (opcional)</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) =>
                    setEditCatFile(e.target.files?.[0] ?? null)
                  }
                  style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
                />
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                  <button
                    type='button'
                    style={btnPrimary}
                    onClick={() => void saveEditCategory()}
                  >
                    Guardar cambios
                  </button>
                  <button
                    type='button'
                    style={btnGhost}
                    onClick={() => cancelEditCategory()}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </>
          )}

          <h3
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 18,
              color: APP_PALETTE.textOnDark,
              margin: '24px 0 12px',
            }}
          >
            Listado
          </h3>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                ...card,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div
                role='button'
                tabIndex={0}
                onClick={() =>
                  navigate(
                    generatePath(Routes.AdminCategoryDetail, {
                      categoryId: c.id,
                    }),
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(
                      generatePath(Routes.AdminCategoryDetail, {
                        categoryId: c.id,
                      }),
                    );
                  }
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  minWidth: 0,
                  cursor: 'pointer',
                }}
                aria-label={`Abrir categoría ${c.name}`}
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
                  {c.cover_storage_path ? (
                    <img
                      alt=''
                      src={getShopMediaPublicUrl(c.cover_storage_path)}
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
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontWeight: 600, color: '#1C2D18'}}>{c.name}</div>
                  <div style={{fontSize: 12, color: APP_PALETTE.priceMuted}}>
                    {c.id}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: APP_PALETTE.accent,
                      marginTop: 4,
                    }}
                  >
                    Abrir subcategorías y productos
                  </div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    beginEditCategory(c);
                  }}
                >
                  Editar
                </button>
                <button
                  type='button'
                  style={btnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteCategory(c.id);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {innerTab === 'subcategories' && (
        <div>
          <h2
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              color: APP_PALETTE.textOnDark,
              marginBottom: 16,
            }}
          >
            Nueva subcategoría
          </h2>
          <div style={{...card, maxWidth: 520}}>
            <label style={labelStyle}>Categoría padre</label>
            <select
              style={{...inputStyle, marginBottom: 12}}
              value={subCatParent}
              onChange={(e) => setSubCatParent(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              onChange={(e) =>
                setSubCatFile(e.target.files?.[0] ?? null)
              }
              style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
            />
            <button
              type='button'
              style={btnPrimary}
              onClick={() => void addSubcategory()}
              disabled={!categories.length}
            >
              Guardar subcategoría
            </button>
          </div>

          <h3
            style={{
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 18,
              color: APP_PALETTE.textOnDark,
              margin: '24px 0 12px',
            }}
          >
            Listado (filtrado por categoría seleccionada arriba)
          </h3>
          {subcatsForSelect.map((s) => {
            const cat = categories.find((c) => c.id === s.category_id);
            if (editingSubcategoryId === s.id) {
              return (
                <div key={s.id} style={{...card, maxWidth: 520}}>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    style={{...inputStyle, marginBottom: 12}}
                    value={editSubcatRowName}
                    onChange={(e) => setEditSubcatRowName(e.target.value)}
                  />
                  <label style={labelStyle}>Nueva imagen de portada (opcional)</label>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) =>
                      setEditSubcatRowFile(e.target.files?.[0] ?? null)
                    }
                    style={{marginBottom: 16, color: APP_PALETTE.textMuted}}
                  />
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                    <button
                      type='button'
                      style={btnPrimary}
                      onClick={() => void saveEditSubcategory()}
                    >
                      Guardar cambios
                    </button>
                    <button
                      type='button'
                      style={btnGhost}
                      onClick={() => cancelEditSubcategory()}
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
                style={{...card, display: 'flex', gap: 16, alignItems: 'center'}}
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
                    {cat?.name ?? 'Categoría'} · {s.id.slice(0, 8)}…
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
                    onClick={() => beginEditSubcategory(s)}
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
          {!subcatsForSelect.length && (
            <p style={{color: APP_PALETTE.textMuted}}>
              No hay subcategorías en esta categoría.
            </p>
          )}
        </div>
      )}

      {innerTab === 'products' && (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 20,
                color: APP_PALETTE.textOnDark,
                margin: 0,
              }}
            >
              Listado de productos
            </h2>
            <button
              type='button'
              onClick={() => openCreateProduct()}
              style={btnPrimary}
              disabled={!categories.length}
            >
              Agregar producto
            </button>
          </div>

          {showProductForm && (
            <>
              <h2
                style={{
                  fontFamily: 'League Spartan, sans-serif',
                  fontSize: 20,
                  color: APP_PALETTE.textOnDark,
                  marginBottom: 16,
                }}
              >
                {editingProductId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <div style={{...card, maxWidth: 640}}>
            <label style={labelStyle}>Categoría</label>
            <select
              style={{...inputStyle, marginBottom: 8, maxWidth: '100%'}}
              value={prodCategory}
              onChange={(e) => {
                setProdCategory(e.target.value);
                setProdSubcat('');
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p
              style={{
                fontSize: 12,
                color: APP_PALETTE.textMuted,
                margin: '0 0 12px',
              }}
            >
              Obligatoria: todo producto pertenece al menos a una categoría.
            </p>

            <label style={labelStyle}>Subcategoría (opcional)</label>
            <select
              style={{...inputStyle, marginBottom: 8, maxWidth: '100%'}}
              value={prodSubcat}
              onChange={(e) => setProdSubcat(e.target.value)}
            >
              <option value=''>
                — Solo categoría (sin subcategoría) —
              </option>
              {subcategories
                .filter((s) => s.category_id === prodCategory)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            <p
              style={{
                fontSize: 12,
                color: APP_PALETTE.textMuted,
                margin: '0 0 12px',
              }}
            >
              Si no necesitas subdividir, déjalo en «Solo categoría».
            </p>

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

            <label style={labelStyle}>Fotos (varias)</label>
            {editingProductId &&
              (productBeingEdited?.image_paths?.length ?? 0) > 0 && (
                <div style={{marginBottom: 12}}>
                  <p
                    style={{
                      fontSize: 12,
                      color: APP_PALETTE.textMuted,
                      margin: '0 0 8px',
                    }}
                  >
                    Fotos actuales en la tienda:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {(productBeingEdited?.image_paths ?? []).map((path) => (
                      <img
                        key={path}
                        alt=''
                        src={getShopMediaPublicUrl(path)}
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: `1px solid ${APP_PALETTE.border}`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            {editingProductId && (
              <p
                style={{
                  fontSize: 12,
                  color: APP_PALETTE.textMuted,
                  margin: '0 0 8px',
                }}
              >
                Las nuevas fotos se añaden a las ya guardadas.
              </p>
            )}
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
                <label style={labelStyle}>Cantidad / stock</label>
                <input
                  style={{...inputStyle, maxWidth: '100%'}}
                  type='number'
                  min={0}
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Precio actual ($)</label>
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

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <button
                type='button'
                style={btnPrimary}
                onClick={() => void saveProduct()}
                disabled={!categories.length}
              >
                Guardar producto
              </button>
              <button
                type='button'
                style={btnGhost}
                onClick={() => closeProductForm()}
              >
                Cancelar
              </button>
            </div>
          </div>
            </>
          )}

          {products.map((p) => {
            const cat = categories.find((c) => c.id === p.category_id);
            const sub =
              p.subcategory_id != null
                ? subcategories.find((s) => s.id === p.subcategory_id)
                : null;
            const placeLabel = sub
              ? `${cat?.name ?? '—'} → ${sub.name}`
              : `${cat?.name ?? '—'} (solo categoría)`;
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
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {p.flag_discount && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: 52,
                          height: 52,
                          overflow: 'hidden',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: 8,
                        }}
                        aria-hidden
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: -20,
                            width: 72,
                            transform: 'rotate(45deg)',
                            transformOrigin: 'center',
                            background: `linear-gradient(115deg, ${APP_PALETTE.accent} 0%, #c9a06c 100%)`,
                            color: '#1C2D18',
                            fontFamily: 'League Spartan, sans-serif',
                            fontSize: 7,
                            fontWeight: 800,
                            letterSpacing: 0.6,
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            padding: '4px 0',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          Discount
                        </div>
                      </div>
                    )}
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
                        <span style={{textDecoration: 'line-through', marginLeft: 8}}>
                          ${centsToDollars(p.compare_at_price_cents)}
                        </span>
                      )}
                      {' · '}
                      {p.weight_grams != null ? `${p.weight_grams} g` : '—'} · Stock{' '}
                      {p.stock_quantity}
                    </div>
                    <div style={{fontSize: 12, marginTop: 6}}>
                      {[
                        p.flag_discount && 'Descuento',
                        p.flag_offer && 'Oferta',
                        p.flag_hot && 'Caliente',
                        p.flag_new && 'Novedad',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sin etiquetas'}
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
                      onClick={() => beginEditProduct(p)}
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
          {!products.length && (
            <p style={{color: APP_PALETTE.textMuted}}>Aún no hay productos.</p>
          )}
        </div>
      )}
    </div>
  );
};
