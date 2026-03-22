import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';

export const AddANewAddress: React.FC = () => {
  const navigate = hooks.useNavigate();

  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);

  const dispatch = hooks.useDispatch();
  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Add A New Address'
        headerStyle={{backgroundColor: '#FCEDEA'}}
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
        <custom.InputField
          placeholder='Mom'
          containerStyle={{marginBottom: 10}}
        />
        <custom.InputField
          placeholder='3646 S 58th Ave, Cicero, IL 60804, U...'
          containerStyle={{marginBottom: 20}}
        />
        <div
          className='row-center'
          style={{gap: 10, marginBottom: 35}}
          onClick={() => setUseCurrentLocation(!useCurrentLocation)}
        >
          <div
            style={{
              width: 18,
              height: 18,
              backgroundColor: 'var(--white-color)',
              border: '1px solid #EEEEEE',
            }}
            className='center'
          >
            {useCurrentLocation && <svg.RememberCheckSvg />}
          </div>
          <span className='t14'>Use current location</span>
        </div>
        <components.Button
          text='save address'
          onClick={() => {
            navigate(-1);
          }}
        />
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
