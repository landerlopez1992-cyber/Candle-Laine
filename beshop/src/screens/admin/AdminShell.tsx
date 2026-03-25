import React from 'react';

import {hooks} from '../../hooks';
import {Routes} from '../../enums';
import {svg} from '../../assets/svg';
import {APP_PALETTE} from '../../theme/appPalette';

export const ADMIN_SIDEBAR_W = 280;

export type AdminSection =
  | 'users'
  | 'orders'
  | 'products'
  | 'promotions'
  | 'settings';

export const ADMIN_SECTIONS: {
  id: AdminSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'users',
    label: 'Usuarios',
    description:
      'Gestión de cuentas, roles y permisos. Conecta aquí listados y acciones de Supabase.',
    icon: <svg.MailSvg />,
  },
  {
    id: 'orders',
    label: 'Órdenes',
    description:
      'Pedidos, estados de envío y devoluciones. Integra tu API o tablas de pedidos.',
    icon: <svg.AdminSidebarTruckSvg />,
  },
  {
    id: 'products',
    label: 'Productos',
    description:
      'Categorías, subcategorías y productos con imágenes, precios y etiquetas.',
    icon: <svg.AdminNavProductsSvg />,
  },
  {
    id: 'promotions',
    label: 'Promociones',
    description:
      'Banners del inicio (carrusel), cupones y campañas. Imágenes en Storage.',
    icon: <svg.GiftSvg />,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    description:
      'Configuración general del panel, integraciones y preferencias.',
    icon: <svg.AdminSidebarListSvg />,
  },
];

export type AdminShellProps = {
  activeSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  children: React.ReactNode;
  /** Opcional: antes de «Volver a la tienda» (ej. volver al listado de categorías). */
  headerLeftExtra?: React.ReactNode;
};

/**
 * Layout fijo del panel admin: cabecera, barra lateral y área principal.
 */
export const AdminShell: React.FC<AdminShellProps> = ({
  activeSection,
  onNavigateSection,
  children,
  headerLeftExtra,
}) => {
  const navigate = hooks.useNavigate();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: APP_PALETTE.adminMainBg,
        boxSizing: 'border-box',
      }}
    >
      <header
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 24,
          backgroundColor: 'var(--white-color)',
          borderBottom: '1px solid var(--border-color)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {headerLeftExtra}
          <button
            type='button'
            className='clickable'
            onClick={() => navigate(Routes.TabNavigator)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              background: 'none',
              padding: '12px 16px',
              fontFamily: 'Lato, sans-serif',
              fontSize: 15,
              color: '#1C2D18',
              cursor: 'pointer',
            }}
          >
            <svg.GoBackSvg />
            <span>Volver a la tienda</span>
          </button>
        </div>
        <span
          className='t14'
          style={{
            opacity: 0.85,
            fontFamily: 'League Spartan, sans-serif',
            color: '#1C2D18',
          }}
        >
          Panel de administración
        </span>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          width: '100%',
          backgroundColor: APP_PALETTE.adminMainBg,
        }}
      >
        <aside
          style={{
            width: ADMIN_SIDEBAR_W,
            minWidth: ADMIN_SIDEBAR_W,
            flexShrink: 0,
            backgroundColor: APP_PALETTE.adminSidebarBg,
            color: 'var(--white-color)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 28,
            paddingBottom: 24,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              paddingLeft: 24,
              paddingRight: 20,
              paddingBottom: 28,
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 6,
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Administración
            </h2>
            <span
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: 13,
                opacity: 0.65,
              }}
            >
              Candle Laine
            </span>
          </div>
          <nav
            style={{
              flex: 1,
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              overflowY: 'auto',
            }}
            aria-label='Administration'
          >
            {ADMIN_SECTIONS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => onNavigateSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'Lato, sans-serif',
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.95)',
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.1)'
                      : 'transparent',
                    boxShadow: isActive
                      ? 'inset 3px 0 0 #FF4768'
                      : 'inset 3px 0 0 transparent',
                    transition:
                      'background-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{fontWeight: isActive ? 600 : 500}}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            padding: '32px 40px 48px',
            boxSizing: 'border-box',
            backgroundColor: APP_PALETTE.adminMainBg,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
