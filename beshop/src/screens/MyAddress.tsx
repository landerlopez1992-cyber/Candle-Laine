import React, {useCallback, useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';
import {supabase} from '../supabaseClient';
import type {UserAddressRow} from '../types/address';
import {formatAddressLine} from '../utils/formatAddressLine';
import {APP_PALETTE} from '../theme/appPalette';

export const MyAddress: React.FC = () => {
  const navigate = hooks.useNavigate();

  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();

  const [rows, setRows] = useState<UserAddressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
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

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
        showGoBack={true}
        title='My Address'
      />
    );
  };

  const iconFor = (ix: number) => {
    if (ix === 0) {
      return <svg.HomeAddressSvg />;
    }
    if (ix === 1) {
      return <svg.BriefcaseSvg />;
    }
    return <svg.MapPinSvgAddress />;
  };

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            backgroundColor: 'var(--main-background)',
            minHeight: '40vh',
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

    return (
      <main
        className='scrollable'
        style={{
          padding: 20,
          backgroundColor: 'var(--main-background)',
        }}
      >
        {rows.length === 0 ? (
          <p
            className='t14'
            style={{
              textAlign: 'center',
              color: APP_PALETTE.textMuted,
              marginBottom: 24,
            }}
          >
            No saved addresses yet. Add one below.
          </p>
        ) : (
          rows.map((address, index) => {
            const isLast = index === rows.length - 1;
            return (
              <button
                key={address.id}
                type='button'
                className='row-center'
                style={{
                  marginBottom: isLast ? 0 : 10,
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--list-row-bg)',
                }}
                onClick={() => {
                  navigate(Routes.AddANewAddress, {
                    state: {addressId: address.id},
                  });
                }}
              >
                {iconFor(index)}
                <div
                  style={{
                    marginLeft: 14,
                    marginRight: 'auto',
                    textAlign: 'left',
                  }}
                >
                  <h5
                    style={{
                      marginBottom: 4,
                      color: 'var(--main-color)',
                    }}
                  >
                    {address.label || 'Address'}
                  </h5>
                  <p
                    className='t14'
                    style={{color: 'var(--text-color)'}}
                  >
                    {formatAddressLine(address)}
                  </p>
                </div>
                <svg.EditSvg />
              </button>
            );
          })
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: rows.length === 0 ? 20 : '18%',
          }}
        >
          <button
            type='button'
            className='clickable'
            onClick={() => navigate(Routes.AddANewAddress)}
            aria-label='Add a new address'
          >
            <svg.AddANewAddresSvg />
          </button>
        </div>
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
