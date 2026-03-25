/**
 * Paleta oficial Candle Laine (app web).
 * Las capturas de referencia indican *dónde* aplicar (cabecera, cuerpo, badges, tabs);
 * los valores hex son siempre los de la marca (mood board).
 *
 * Mantener alineado con `src/scss/_variables.scss`.
 */
export const APP_PALETTE = {
  /** Marco exterior / meta theme-color / fondo general de la app */
  appShell: '#1C2D18',
  /** Banda tipo cabecera y pies con “barra” de color */
  headerBand: '#4B3C35',
  /** Superficies secundarias / tarjetas */
  surface: '#926D50',
  /** Texto principal sobre fondos oscuros */
  textOnDark: '#D6C0A5',
  /** Texto secundario */
  textMuted: '#B8A894',
  /** Acento principal (CTA, “View all”, bolsa, precio rebajado) */
  accent: '#F1B97F',
  /** Acento jade (badge sale, loader) */
  accentJade: '#4C775C',
  /** Bordes y separadores */
  border: '#545953',
  /** Inputs y cajas sobre fondo oscuro */
  inputSurface: '#4B3C35',
  /** Área detrás de fotos de producto (coherente con JPG en blanco) */
  imageWell: '#FFFFFF',
  saleBadge: '#4C775C',
  star: '#F1B97F',
  spinner: '#4C775C',
  priceMuted: '#9A8B7A',
  /** Resalte del tab activo (icono inferior) */
  tabActivePill: '#545953',
  /** Filas de menú perfil, FAQ, direcciones (`--list-row-bg`) */
  listRow: '#545953',
  /** Panel admin: barra lateral (mismo tono que CTA “SHOP NOW” / botón oscuro) */
  adminSidebarBg: '#212121',
  /** Panel admin: área principal (verde marca, mismo que --main-background) */
  adminMainBg: '#1C2D18',
  /**
   * Tarjetas sobre fondo verde (Order / Checkout): crema cálido, no blanco puro,
   * para que precios y textos tengan mejor contraste.
   */
  cartCardSurface: '#EFE8DC',
  /** Título centrado en cabecera oscura (banda o verde) */
  headerTitleLight: '#FAF6F0',
} as const;
