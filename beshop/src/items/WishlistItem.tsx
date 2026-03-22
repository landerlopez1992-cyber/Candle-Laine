import React from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {components} from '../components';
import {actions} from '../store/actions';

type Props = {
  isLast: boolean;
  product: ProductType;
};

export const WishlistItem: React.FC<Props> = ({product, isLast}) => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  const cartHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    dispatch(actions.addToCart(product));
  };

  const wishlistHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    if (ifInWishlist) {
      dispatch(actions.removeFromWishlist(product));
    } else {
      dispatch(actions.addToWishlist(product));
    }
  };

  return (
    <div
      style={{
        padding: 10,
        display: 'flex',
        position: 'relative',
        border: '1px solid #E5E5E5',
        marginBottom: isLast ? 0 : 8,
        backgroundColor: 'var(--white-color)',
      }}
      className='clickable'
      onClick={() => navigate(`/product/${product.id}`, {state: {product}})}
    >
      {/* Image */}
      <div
        style={{
          width: 80,
          height: 80,
          marginRight: 14,
          backgroundColor: 'var(--image-background)',
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
      {/* Description */}
      <div
        style={{
          marginRight: 'auto',
          flexDirection: 'column',
          height: 80,
          display: 'flex',
        }}
      >
        <h6
          style={{marginBottom: 5, marginTop: 2}}
          className='number-of-lines-1'
        >
          {product.name}
        </h6>
        <components.Price
          product={product}
          containerStyle={{
            marginBottom: 'auto',
          }}
        />
        <components.Rating
          product={product}
          containerStyle={{
            marginTop: 'auto',
          }}
        />
      </div>
      {/* Buttons */}
      <div>
        <button
          style={{
            width: 40,
            height: 40,
            position: 'absolute',
            right: 6,
            top: 6,
            padding: 10,
            borderRadius: 5,
          }}
          onClick={wishlistHandler}
        >
          <svg.BestSellerHeartSvg product={product} />
        </button>
        <button
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            padding: 10,
            borderRadius: 5,
          }}
          onClick={cartHandler}
        >
          <svg.AddToCartSvg />
        </button>
      </div>
    </div>
  );
};
