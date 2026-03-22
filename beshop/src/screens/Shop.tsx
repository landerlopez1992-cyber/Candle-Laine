import {useSelector} from 'react-redux';
import React, {useState, useEffect} from 'react';

import {items} from '../items';
import {hooks} from '../hooks';
import {utils} from '../utils';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {components} from '../components';
import {actions} from '../store/actions';
import {useProducts} from '../hooks/useProducts';

const sortingBy = [
  {id: 1, title: 'Sale'},
  {id: 2, title: 'Top'},
  {id: 3, title: 'Newest'},
  {id: 4, title: 'Price: low to high'},
  {id: 5, title: 'Price: high to low'},
];

export const Shop: React.FC = () => {
  const location = hooks.useLocation();

  const category = location.state?.category;
  const {productsLoading, products} = useProducts();

  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [sort, setSort] = useState<string>(sortingBy[0].title);

  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const {selectedColors, selectedCategories, selectedTags} = useSelector(
    (state: RootState) => state.filterSlice,
  );

  const filteredProducts = products.filter((product: ProductType) => {
    return (
      utils.colorMatch(product, selectedColors) &&
      utils.tagMatch(product, selectedTags) &&
      utils.statusMatch(product, selectedCategories)
    );
  });

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
          return a.oldPrice === b.oldPrice ? 0 : a.oldPrice ? -1 : 1;
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
        title={category || 'Shop'}
        headerStyle={{
          backgroundColor: '#FCEDEA',
        }}
      />
    );
  };

  const renderSettings = (): JSX.Element => {
    return (
      <div
        className='container row-center-space-between'
        style={{
          paddingTop: 18,
          paddingBottom: 16,
        }}
      >
        <button onClick={() => navigate('/filter')}>
          <svg.FiltersSvg />
        </button>
        <button onClick={() => setShowModal(true)}>
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
          <h6 className='t18'>No products found</h6>
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
          backgroundColor: 'var(--white-color)',
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
          backgroundColor: 'rgba(30, 37, 56, 0.6)',
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

            backgroundColor: 'var(--white-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {sortingBy.map((item, index) => {
            return (
              <button
                key={item.id}
                style={{
                  width: '100%',
                  paddingBottom: 15,
                  paddingTop: index === 0 ? 20 : 15,
                  paddingRight: 20,
                  borderBottom: '1px solid var(--border-color)',
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
                    border: '1px solid var(--border-color)',
                  }}
                  className='center'
                >
                  {sort === item.title && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'var(--main-color)',
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
