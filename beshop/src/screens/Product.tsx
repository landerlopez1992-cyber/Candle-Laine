import React, {useRef, useState, useEffect} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import SwiperCore from 'swiper';
import {useSelector} from 'react-redux';
import {Swiper as SwiperType} from 'swiper';

import {items} from '../items';
import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {ColorType} from '../types';
import {RootState} from '../store';
import {ReviewType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {useReviews} from '../hooks/useReviews';
import {addToCart} from '../store/slices/cartSlice';
import {removeFromCart} from '../store/slices/cartSlice';
import {addToWishlist} from '../store/slices/wishlistSlice';
import {removeFromWishlist} from '../store/slices/wishlistSlice';

export const Product: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const cart = useSelector((state: RootState) => state.cartSlice);

  const {reviewsLoading, reviews} = useReviews();
  const location = hooks.useLocation();

  const swiperRef = useRef<SwiperCore | null>(null);

  const product = location.state.product;

  const isLoading = reviewsLoading || !product;

  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[1].name,
  );

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);
  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  const updatedProduct = {
    ...product,
    color: selectedColor,
  };

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveSlide(swiper.activeIndex);
  };

  const wishlistHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    if (ifInWishlist) {
      dispatch(removeFromWishlist(product));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        showBasket={true}
        headerStyle={{
          backgroundColor: '#fff',
        }}
      />
    );
  };

  const renderCarousel = (): JSX.Element => {
    return (
      <section style={{marginBottom: 20, marginTop: 4, position: 'relative'}}>
        <Swiper
          slidesPerView={'auto'}
          pagination={{clickable: true}}
          onSlideChange={handleSlideChange}
          onSwiper={(swiper: SwiperType) => (swiperRef.current = swiper)}
        >
          {product.images.map(
            (item: string, index: number, array: string[]) => {
              return (
                <SwiperSlide key={index}>
                  <img
                    src={item}
                    alt={'product'}
                    style={{
                      width: '100%',
                    }}
                  />
                </SwiperSlide>
              );
            },
          )}
        </Swiper>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            bottom: 27,
            zIndex: 1,
            width: '100%',
            gap: 6,
          }}
        >
          {product.images.map((item: string, index: number) => {
            return (
              <div
                key={index}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor:
                    activeSlide === index ? 'var(--main-color)' : '#CFCDD3',
                }}
              />
            );
          })}
        </div>
      </section>
    );
  };

  const renderNameWithButton = (): JSX.Element => {
    return (
      <section
        className='container row-center-space-between'
        style={{marginBottom: 2}}
      >
        <h3 className='number-of-lines-1'>{product.name}</h3>
        <button
          onClick={wishlistHandler}
          style={{borderRadius: '50%'}}
        >
          <svg.HeartBigSvg product={product} />
        </button>
      </section>
    );
  };

  const renderRatingWithStatus = (): JSX.Element => {
    return (
      <div
        style={{marginBottom: 3, gap: 10}}
        className='container row-center'
      >
        <span
          className='t12'
          style={{color: '#00824B', textTransform: 'uppercase'}}
        >
          In Stock
        </span>
        <components.Rating
          product={product}
          containerStyle={{marginBottom: 1}}
        />
      </div>
    );
  };

  const renderPriceWithCounter = (): JSX.Element => {
    const ifProductInCart = cart.list.find((item) => item.id === product.id);
    const qty = ifProductInCart ? ifProductInCart.quantity : 0;
    return (
      <div
        className='container row-center-space-between'
        style={{marginBottom: 20}}
      >
        <span
          style={{
            fontSize: 20,
            fontFamily: 'Lato',
          }}
        >
          ${product.price}
        </span>
        <div
          style={{
            padding: '10px 20px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 23,
            backgroundColor: '#FAF9FF',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => {
              dispatch(removeFromCart(product));
            }}
          >
            <svg.MinusSvg />
          </button>
          <span
            className='t16'
            style={{marginTop: 2}}
          >
            {qty}
          </span>
          <button
            onClick={() => {
              dispatch(addToCart(product));
            }}
          >
            <svg.PlusSvg />
          </button>
        </div>
      </div>
    );
  };

  const renderColors = (): JSX.Element => {
    return (
      <section
        className='row-center'
        style={{
          paddingBottom: 20,
          gap: 20,
          borderBottom: '1px solid #EEEEEE',
          marginBottom: 30,
          marginLeft: 20,
          marginRight: 20,
        }}
      >
        <h5>Colors</h5>
        <div
          style={{
            gap: 10,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {product.colors.map((color: ColorType, index: number) => {
            return (
              <div
                key={index}
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: color.code,
                  border: `2px solid ${
                    selectedColor === color.name
                      ? 'var(--accent-color)'
                      : color.code
                  }`,
                }}
                className='center clickable'
                onClick={() => {
                  setSelectedColor(color.name);
                }}
              />
            );
          })}
        </div>
      </section>
    );
  };

  const renderDescription = (): JSX.Element => {
    return (
      <section
        style={{
          marginLeft: 20,
          marginRight: 20,
          marginBottom: 40,
        }}
      >
        <h5 style={{marginBottom: 12}}>Description</h5>
        <p
          style={{marginBottom: 16}}
          className='t16'
        >
          {product.description.length > 250
            ? `${product.description.slice(0, 100)}...`
            : product.description}
        </p>
      </section>
    );
  };

  const renderButton = (): JSX.Element => {
    return (
      <div
        className='container'
        style={{
          marginBottom: 40,
        }}
      >
        <components.Button
          text='+ Add to cart'
          containerStyle={{marginBottom: 16}}
          onClick={() => {
            dispatch(addToCart(updatedProduct));
          }}
        />
      </div>
    );
  };

  const renderReviews = (): JSX.Element => {
    return (
      <section
        style={{marginBottom: 30}}
        className='container'
      >
        <components.BlockHeading
          title={`Reviews (${reviews?.length})`}
          containerStyle={{marginBottom: 18}}
          viewAllOnClick={() => navigate('/reviews')}
        />
        {reviews
          ?.slice(0, 2)
          .map((review: ReviewType, index: number, array: ReviewType[]) => {
            const isLast = index === array.length - 1;
            return (
              <items.ReviewItem
                key={review.id}
                review={review}
                isLast={isLast}
              />
            );
          })}
      </section>
    );
  };

  const renderContent = (): JSX.Element => {
    if (isLoading) return <components.Loader />;

    return (
      <main className='scrollable'>
        {renderCarousel()}
        {renderNameWithButton()}
        {renderRatingWithStatus()}
        {renderPriceWithCounter()}
        {renderColors()}
        {renderDescription()}
        {renderButton()}
        {renderReviews()}
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
