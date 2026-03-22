import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';

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

  hooks.useThemeColor('#FCEDEA');
  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        headerStyle={{backgroundColor: '#FCEDEA'}}
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
          backgroundColor: 'var(--white-color)',
        }}
      >
        {addressess.map((address, index, array) => {
          const isLast = index === array.length - 1;

          return (
            <button
              key={address.id}
              className='row-center'
              style={{marginBottom: isLast ? 0 : 8, width: '100%'}}
              onClick={() => {
                navigate(Routes.AddANewAddress);
              }}
            >
              {address.icon}
              <div style={{marginLeft: 14, marginRight: 'auto'}}>
                <h5 style={{marginBottom: 4}}>{address.name}</h5>
                <p className='t14'>{address.address}</p>
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
