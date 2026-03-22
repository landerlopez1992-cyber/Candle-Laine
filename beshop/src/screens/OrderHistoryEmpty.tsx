import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';

export const OrderHistoryEmpty: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Order History'
        showGoBack={true}
        headerStyle={{backgroundColor: 'transparent'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable container'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <h2
          style={{
            textTransform: 'capitalize',
            textAlign: 'center',
            marginBottom: 30,
          }}
        >
          Your order history is <br /> currently empty!
        </h2>
        <p
          className='t18'
          style={{textAlign: 'center', marginBottom: 30}}
        >
          Start filling it up with your past purchases to <br /> keep track of
          your shoe shopping journey.
        </p>
        <components.Button
          to='/shop'
          text='shop now'
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
