import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {components} from '../components';
import {actions} from '../store/actions';
import { APP_PALETTE } from '../theme/appPalette';

export const Description: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const location = hooks.useLocation();
  const product = location.state.product;

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Description'
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable container'
        style={{paddingTop: 27, paddingBottom: 20}}
      >
        <h3 style={{marginBottom: 12}}>{product.name}</h3>
        <p className='t18'>{product.description}</p>
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
