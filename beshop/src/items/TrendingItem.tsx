import React from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {components} from '../components';
import {addToCart} from '../store/slices/cartSlice';
import {addToWishlist} from '../store/slices/wishlistSlice';
import {removeFromWishlist} from '../store/slices/wishlistSlice';

type Props = {
  index: number;
  isLast: boolean;
  product: ProductType;
};

export const TrendingItem: React.FC<Props> = ({product, index, isLast}) => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  const cartHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    dispatch(addToCart(product));
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

  return (
    // Item
    <div
      style={{
        width: 138,
        marginLeft: index === 0 ? 20 : 0,
        marginRight: isLast ? 20 : 0,
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/product/${product.id}`, {state: {product}})}
    >
      {/* Image */}
      <div
        style={{
          backgroundColor: product.imageColor,
          marginBottom: 12,
          position: 'relative',
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: 170,
            objectFit: 'contain',
          }}
        />

        <components.Rating
          product={product}
          containerStyle={{
            position: 'absolute',
            top: 7,
            left: 7,
          }}
        />
        <components.Sale
          product={product}
          containerStyle={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        />
        {/* Buttons */}
        <button
          style={{
            position: 'absolute',
            bottom: 40 - 8,
            right: 4,
            padding: 8,
          }}
          onClick={wishlistHandler}
        >
          <svg.HeartSvg product={product} />
        </button>
        <button
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            padding: 8,
          }}
          onClick={cartHandler}
        >
          <svg.BagSvg />
        </button>
      </div>
      {/* Description */}
      <h6
        className='number-of-lines-1'
        style={{color: 'var(--main-color)', marginBottom: 4}}
      >
        {product.name}
      </h6>
      <components.Price product={product} />
    </div>
  );
};
