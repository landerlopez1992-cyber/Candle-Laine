import React, {useState, useEffect} from 'react';

import {items} from '../items';
import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {ProductType} from '../types';
import {components} from '../components';
import {actions} from '../store/actions';
import {useProducts} from '../hooks/useProducts';
import { APP_PALETTE } from '../theme/appPalette';

const sortingBy = [
  {id: 1, title: 'Sale'},
  {id: 2, title: 'Top'},
  {id: 3, title: 'Newest'},
  {id: 4, title: 'Price: low to high'},
  {id: 5, title: 'Price: high to low'},
];

export const Shop: React.FC = () => {
  const location = hooks.useLocation();

  const navState = location.state as
    | {category?: string; categoryId?: string; discountOnly?: boolean}
    | undefined;
  const category = navState?.category;
  const categoryId = navState?.categoryId;
  const discountOnly = navState?.discountOnly === true;
  const {productsLoading, products} = useProducts(categoryId);

  const dispatch = hooks.useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [sort, setSort] = useState<string>(sortingBy[0].title);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const filteredProducts = discountOnly
    ? products.filter((p) => p.flag_discount === true)
    : products;

  const sortedProducts = [...filteredProducts].sort(
    (a: ProductType, b: ProductType) => {
      switch (sort) {
        case 'Price: low to high':
          return a.price - b.price;
        case 'Price: high to low':
          return b.price - a.price;
        case 'Newest':
          return a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1;
        case 'Top':
          return a.isTop === b.isTop ? 0 : a.isTop ? -1 : 1;
        case 'Sale':
          return a.flag_discount === b.flag_discount
            ? 0
            : a.flag_discount
              ? -1
              : 1;
        default:
          return 0;
      }
    },
  );

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        showBasket={true}
        title={
          discountOnly
            ? 'Discounted Items'
            : category || 'Shop'
        }
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderSettings = (): JSX.Element => {
    const iconBtn: React.CSSProperties = {
      padding: 8,
      borderRadius: 8,
      color: 'var(--main-color)',
      backgroundColor: 'transparent',
      border: `1px solid ${APP_PALETTE.border}`,
    };
    return (
      <div
        className='container'
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 18,
          paddingBottom: 16,
          borderBottom: `1px solid ${APP_PALETTE.border}`,
        }}
      >
        <button
          type='button'
          style={iconBtn}
          onClick={() => setShowModal(true)}
          aria-label='Sorting'
        >
          <svg.SortingBySvg />
        </button>
      </div>
    );
  };

  const renderProducts = (): JSX.Element => {
    if (sortedProducts.length === 0) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <h6
            className='t18'
            style={{color: 'var(--main-color)'}}
          >
            No products found
          </h6>
        </div>
      );
    }

    return (
      <div
        style={{
          columnGap: 15,
          rowGap: 20,
          display: 'grid',
          paddingBottom: 20,
          gridTemplateColumns: 'repeat(2, 1fr)',
        }}
        className='container'
      >
        {sortedProducts.map(
          (product: ProductType, index: number, array: ProductType[]) => {
            const isLast = index === array.length - 1;
            return (
              <items.ShopItem
                key={product.id}
                isLast={isLast}
                product={product}
              />
            );
          },
        )}
      </div>
    );
  };

  const renderContent = (): JSX.Element => {
    if (productsLoading) return <components.Loader />;

    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
        }}
      >
        {renderSettings()}
        {renderProducts()}
      </main>
    );
  };

  const renderModal = (): JSX.Element | null => {
    if (!showModal) return null;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(28, 45, 24, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            width: 'calc(100% - 80px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 8,
            borderRadius: 12,
            backgroundColor: APP_PALETTE.cartCardSurface,
            border: `1px solid ${APP_PALETTE.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {sortingBy.map((item, index) => {
            return (
              <button
                type='button'
                key={item.id}
                style={{
                  width: '100%',
                  paddingBottom: 15,
                  paddingTop: index === 0 ? 20 : 15,
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-on-light)',
                }}
                className='row-center-space-between'
                onClick={() => {
                  setSort(item.title);
                  setShowModal(false);
                }}
              >
                <span className='t18'>{item.title}</span>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    border: `1px solid ${APP_PALETTE.border}`,
                  }}
                  className='center'
                >
                  {sort === item.title && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'var(--accent-color)',
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderModal()}
    </>
  );
};
