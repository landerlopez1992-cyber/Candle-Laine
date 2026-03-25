import React, {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {svg} from '../assets/svg';
import {supabase} from '../supabaseClient';
import {RootState} from '../store';
import {setCheckoutShippingSelection} from '../store/slices/paymentSlice';
import type {UserAddressRow} from '../types/address';
import {formatAddressLine} from '../utils/formatAddressLine';
import {APP_PALETTE} from '../theme/appPalette';

export const CheckoutShippingDetails: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const selectedId = useSelector(
    (s: RootState) => s.paymentSlice.checkoutShippingAddressId,
  );

  const [rows, setRows] = useState<UserAddressRow[]>([]);
  const [loading, setLoading] = useState(true);

  hooks.useThemeColor(APP_PALETTE.appShell);

  const load = useCallback(async () => {
    if (!supabase) {
      setRows([]);
      setLoading(false);
      return;
    }
    const {data: auth} = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    const {data, error} = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', {ascending: false});
    setLoading(false);
    if (!error && data) {
      setRows(data as UserAddressRow[]);
    } else {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Si hay filas y la selección actual no coincide con ninguna, usar la primera. */
  useEffect(() => {
    if (loading || rows.length === 0) {
      return;
    }
    if (selectedId && rows.some((r) => r.id === selectedId)) {
      return;
    }
    const first = rows[0];
    dispatch(
      setCheckoutShippingSelection({
        addressId: first.id,
        formattedLine: formatAddressLine(first),
      }),
    );
  }, [loading, rows, selectedId, dispatch]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (rows.length === 0) {
      dispatch(setCheckoutShippingSelection(null));
    }
  }, [loading, rows.length, dispatch]);

  const iconFor = (ix: number) => {
    if (ix === 0) {
      return <svg.HomeAddressSvg />;
    }
    if (ix === 1) {
      return <svg.BriefcaseSvg />;
    }
    return <svg.MapPinSvgAddress />;
  };

  const selectRow = (row: UserAddressRow) => {
    dispatch(
      setCheckoutShippingSelection({
        addressId: row.id,
        formattedLine: formatAddressLine(row),
      }),
    );
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Shipping details'
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
        showGoBack={true}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            paddingBottom: 28,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            className='t16'
            style={{color: APP_PALETTE.textOnDark}}
          >
            Loading…
          </p>
        </main>
      );
    }

    if (!supabase) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <p
            className='t14'
            style={{color: APP_PALETTE.textMuted, textAlign: 'center'}}
          >
            Addresses are unavailable. Check your connection.
          </p>
        </main>
      );
    }

    return (
      <main
        className='scrollable'
        style={{
          padding: 20,
          paddingBottom: 28,
          backgroundColor: APP_PALETTE.appShell,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        {rows.length === 0 ? (
          <>
            <p
              className='t14'
              style={{
                color: APP_PALETTE.textMuted,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              No saved addresses yet. Add one to continue with checkout.
            </p>
            <button
              type='button'
              className='clickable'
              style={{
                display: 'block',
                margin: '0 auto',
                padding: '12px 20px',
                borderRadius: 8,
                border: `1px solid ${APP_PALETTE.border}`,
                backgroundColor: APP_PALETTE.cartCardSurface,
                color: 'var(--text-on-light)',
                fontFamily: 'Lato, sans-serif',
                fontSize: 15,
              }}
              onClick={() => navigate(Routes.AddANewAddress)}
            >
              Add a new address
            </button>
          </>
        ) : (
          rows.map((address, index, array) => {
            const isLast = index === array.length - 1;
            const line = formatAddressLine(address);
            const isSelected = selectedId === address.id;

            return (
              <button
                key={address.id}
                type='button'
                style={{
                  padding: '12px 16px',
                  width: '100%',
                  marginBottom: isLast ? 0 : 8,
                  border: '1px solid var(--border-color)',
                  backgroundColor: APP_PALETTE.cartCardSurface,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                className='row-center-space-between'
                onClick={() => selectRow(address)}
              >
                <div
                  className='row-center'
                  style={{minWidth: 0, flex: 1, gap: 12, alignItems: 'flex-start'}}
                >
                  {iconFor(index)}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Tenor Sans',
                        color: 'var(--text-on-light)',
                        lineHeight: 1.2,
                        fontSize: 16,
                      }}
                    >
                      {address.label || 'Address'}
                    </span>
                    <span
                      className='t14'
                      style={{
                        color: 'var(--text-on-light)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {line}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    borderRadius: 10,
                    border: `2px solid ${
                      isSelected ? APP_PALETTE.accent : '#999999'
                    }`,
                  }}
                  className='center'
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: APP_PALETTE.accent,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })
        )}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
