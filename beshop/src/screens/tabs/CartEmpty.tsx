import {Action} from 'redux';
import React, {useEffect} from 'react';
import {ThunkDispatch} from 'redux-thunk';
import {useDispatch} from 'react-redux';

import {hooks} from '../../hooks';
import {RootState} from '../../store';
import {components} from '../../components';
import {actions} from '../../store/actions';

export const CartEmpty: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();

  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBasket={true}
        headerStyle={{backgroundColor: 'transparent'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable center'
        style={{zIndex: 1}}
      >
        <div className='container'>
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/01.png'
            alt='empty-cart'
            style={{
              width: '80%',
              height: 'auto',
              alignSelf: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 30,
            }}
          />
          <h2
            style={{
              textAlign: 'center',
              marginBottom: 12,
              textTransform: 'capitalize',
            }}
          >
            Your cart is empty!
          </h2>
          <p
            className='t18'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Looks like you haven't made <br />
            your order yet.
          </p>
          <components.Button
            text='shop now'
            to='/shop'
          />
        </div>
      </main>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  );
};
