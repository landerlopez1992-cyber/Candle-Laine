import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../../hooks';
import {items} from '../../items';
import {RootState} from '../../store';
import {ProductType} from '../../types';
import {actions} from '../../store/actions';
import {components} from '../../components';
import { APP_PALETTE } from '../../theme/appPalette';

export const Wishlist: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Wishlist'
        showBasket={true}
        showLogo={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='container scrollable'
        style={{paddingTop: 16, backgroundColor: 'var(--white-color)'}}
      >
        {wishlist.list.map(
          (product: ProductType, index: number, array: ProductType[]) => {
            const isLast = index === array.length - 1;
            return (
              <items.WishlistItem
                key={index}
                isLast={isLast}
                product={product}
              />
            );
          },
        )}
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
