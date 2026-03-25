import React, {useEffect} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';
import { APP_PALETTE } from '../theme/appPalette';

const cards = [
  {
    id: 1,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/01.png',
  },
  {
    id: 2,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/02.png',
  },
  {
    id: 3,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/03.png',
  },
];

export const PaymentMethod: React.FC = () => {
  const dispatch = hooks.useDispatch();
  hooks.useThemeColor(APP_PALETTE.appShell);

  const navigate = hooks.useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Payment Method'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderCards = (): JSX.Element => {
    return (
      <div style={{marginBottom: 30}}>
        <div
          style={{
            marginLeft: 20,
            marginRight: 20,
            paddingBottom: 8,
            marginBottom: 18,
            borderBottom: '2px solid var(--main-color)',
          }}
        >
          <h5>Cards</h5>
        </div>

        <div style={{width: '100%'}}>
          <Swiper
            spaceBetween={14}
            slidesPerView={'auto'}
            pagination={{clickable: true}}
            navigation={true}
            mousewheel={true}
          >
            {cards.map((product: any, index: number, array: any[]) => {
              const isLast = index === array.length - 1;
              return (
                <SwiperSlide
                  key={product.id}
                  style={{width: 'auto'}}
                >
                  <img
                    alt='card'
                    src={product.image}
                    style={{
                      width: 279,
                      borderRadius: 10,
                      marginRight: isLast ? 20 : 0,
                      marginLeft: index === 0 ? 20 : 0,
                    }}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    );
  };

  const renderPaymentMethods = (): JSX.Element => {
    return (
      <div className='container'>
        <button
          className='row-center-space-between'
          style={{
            width: '100%',
            padding: 20,
            marginBottom: 8,
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            className='row-center'
            style={{gap: 8}}
          >
            <h5>Apple Pay</h5>
            <svg.PaymentCheckSvg />
          </div>
          <svg.EditSvg />
        </button>
        <button
          className='row-center-space-between'
          style={{
            width: '100%',
            padding: 20,
            marginBottom: 8,
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            className='row-center'
            style={{gap: 8}}
          >
            <h5>Pay Pal</h5>
            <svg.PaymentCheckSvg />
          </div>
          <svg.EditSvg />
        </button>
        <button
          className='row-center-space-between'
          style={{
            width: '100%',
            padding: 20,
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            className='row-center'
            style={{gap: 8}}
          >
            <h5>Payoneer</h5>
            <svg.PaymentCheckSvg />
          </div>
          <svg.PaymentPlusSvg />
        </button>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20%',
          }}
          onClick={() => {
            navigate(Routes.AddANewCard);
          }}
        >
          <svg.AddANewCardSvg />
        </div>
      </div>
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        {renderCards()}
        {renderPaymentMethods()}
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
