import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';
import { APP_PALETTE } from '../theme/appPalette';

const addressess = [
  {
    id: 1,
    name: 'Home',
    icon: <svg.HomeAddressSvg />,
    address: '8000 S Kirkland Ave, Chicago...',
  },
  {
    id: 2,
    name: 'Work',
    icon: <svg.BriefcaseSvg />,
    address: '8000 S Kirkland Ave, Chicago...',
  },
  {
    id: 3,
    name: 'Other',
    icon: <svg.MapPinSvgAddress />,
    address: '8000 S Kirkland Ave, Chicago...',
  },
];

export const MyAddress: React.FC = () => {
  const navigate = hooks.useNavigate();

  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
        showGoBack={true}
        title='My Address'
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          padding: 20,
          backgroundColor: 'var(--main-background)',
        }}
      >
        {addressess.map((address, index, array) => {
          const isLast = index === array.length - 1;

          return (
            <button
              key={address.id}
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
                navigate(Routes.AddANewAddress);
              }}
            >
              {address.icon}
              <div style={{marginLeft: 14, marginRight: 'auto', textAlign: 'left'}}>
                <h5 style={{marginBottom: 4, color: 'var(--main-color)'}}>
                  {address.name}
                </h5>
                <p
                  className='t14'
                  style={{color: 'var(--text-color)'}}
                >
                  {address.address}
                </p>
              </div>
              <svg.EditSvg />
            </button>
          );
        })}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '30%',
          }}
          onClick={() => {
            navigate(Routes.AddANewAddress);
          }}
        >
          <svg.AddANewAddresSvg />
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
