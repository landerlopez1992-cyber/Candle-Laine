import React, {useRef} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {ProductType} from '../types';
import {RootState} from '../store';
import {components} from '../components';
import {addToWishlist, removeFromWishlist} from '../store/slices/wishlistSlice';
import {dispatchAddToCartWithFly} from '../utils/addToCartWithFly';

type Props = {
  index: number;
  isLast: boolean;
  product: ProductType;
};

export const NewArrivalItem: React.FC<Props> = ({product, index, isLast}) => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const productImgRef = useRef<HTMLImageElement>(null);

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  const cartHandler = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    dispatchAddToCartWithFly(dispatch, product, productImgRef.current);
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
      style={{}}
      className='clickable'
      onClick={() => navigate(`/product/${product.id}`, {state: {product}})}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          height: 170,
          marginRight: 14,
          marginBottom: 12,
          position: 'relative',
          backgroundColor: 'var(--image-background)',
        }}
      >
        <img
          ref={productImgRef}
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            // mixBlendMode: 'darken',
          }}
        />
        <components.Rating
          product={product}
          containerStyle={{position: 'absolute', top: 7, left: 7}}
        />
        <components.Sale
          product={product}
          containerStyle={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        />
        <button
          style={{
            position: 'absolute',
            bottom: 42 - 8,
            right: 7,
            padding: 8,
          }}
          onClick={wishlistHandler}
        >
          <svg.HeartSvg product={product} />
        </button>
        <button
          style={{
            position: 'absolute',
            bottom: 6,
            right: 7,
            padding: 8,
          }}
          onClick={cartHandler}
        >
          <svg.BagSvg />
        </button>
      </div>
      {/* Description */}
      <h6
        style={{
          marginBottom: 4,
          marginTop: 2,
          color: 'var(--main-color)',
        }}
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
    </div>
  );
};
