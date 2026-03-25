import React, {useEffect} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';

import {items} from '../../items';
import {hooks} from '../../hooks';
import {ProductType} from '../../types';
import {components} from '../../components';
import {actions} from '../../store/actions';
import {useBanners} from '../../hooks/useBanners';
import {useProducts} from '../../hooks/useProducts';
import {APP_PALETTE} from '../../theme/appPalette';

export const Home: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const {bannersLoading, banners} = useBanners();
  const {productsLoading, products} = useProducts();

  const isLoading = productsLoading || bannersLoading;

  const banner_1 = banners[0] as any;
  const banner_2 = banners[1] as any;

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showLogo={true}
        showBasket={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderBanner_1 = (): JSX.Element => {
    return (
      <section
        className='clickable'
        style={{marginBottom: 40}}
      >
        <img
          alt='banner'
          src={banner_1?.image as any}
          style={{width: '100%'}}
          onClick={() => {
            navigate('/shop');
          }}
        />
      </section>
    );
  };

  const renderTrendingProducts = (): JSX.Element => {
    return (
      <div style={{marginBottom: 40}}>
        <components.BlockHeading
          title='Trending Products'
          viewAllOnClick={() => {
            navigate('/shop', {state: {category: 'Trending'}});
          }}
          containerStyle={{marginLeft: 20, marginRight: 20, marginBottom: 18}}
        />
        <div style={{width: '100%'}}>
          <Swiper
            spaceBetween={14}
            slidesPerView={'auto'}
            pagination={{clickable: true}}
            navigation={true}
            mousewheel={true}
          >
            {products.map(
              (product: ProductType, index: number, array: ProductType[]) => {
                const isLast = index === array.length - 1;
                return (
                  <SwiperSlide
                    key={product.id}
                    style={{width: 'auto'}}
                  >
                    <items.TrendingItem
                      index={index}
                      isLast={isLast}
                      product={product}
                    />
                  </SwiperSlide>
                );
              },
            )}
          </Swiper>
        </div>
      </div>
    );
  };

  const renderBanner_2 = (): JSX.Element => {
    return (
      <section
        className='clickable'
        style={{marginBottom: 40}}
      >
        <img
          alt='banner'
          src={banner_2?.image as any}
          style={{width: '100%'}}
          onClick={() => {
            navigate('/shop');
          }}
        />
      </section>
    );
  };

  const renderNewArrivals = (): JSX.Element => {
    return (
      <div style={{paddingBottom: 20}}>
        <components.BlockHeading
          title='New Arrivals'
          viewAllOnClick={() => {
            navigate('/shop', {state: {category: 'New Arrivals'}});
          }}
          containerStyle={{marginLeft: 20, marginRight: 20, marginBottom: 18}}
        />

        <div
          style={{
            columnGap: 15,
            rowGap: 20,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
          className='container'
        >
          {products.map(
            (product: ProductType, index: number, array: ProductType[]) => {
              const isLast = index === array.length - 1;
              return (
                <items.NewArrivalItem
                  key={product.id}
                  index={index}
                  isLast={isLast}
                  product={product}
                />
              );
            },
          )}
        </div>
      </div>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <components.Loader
          spinnerColor={APP_PALETTE.spinner}
        />
      );
    }

    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
        }}
      >
        {renderBanner_1()}
        {renderTrendingProducts()}
        {renderBanner_2()}
        {renderNewArrivals()}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  );
};
