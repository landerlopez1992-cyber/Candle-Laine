import React, {useRef} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {components} from '../components';
import {addToWishlist} from '../store/slices/wishlistSlice';
import {removeFromWishlist} from '../store/slices/wishlistSlice';
import {dispatchAddToCartWithFly} from '../utils/addToCartWithFly';

type Props = {
  isLast: boolean;
  product: ProductType;
};

export const ShopItem: React.FC<Props> = ({product, isLast}) => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const productImgRef = useRef<HTMLImageElement>(null);

  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  const wishlistHandler = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    if (ifInWishlist) {
      dispatch(removeFromWishlist(product));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const cartHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
    dispatchAddToCartWithFly(dispatch, product, productImgRef.current);
  };

  return (
    <div>
      {/* Image */}
      <div
        style={{
          marginBottom: 12,
          position: 'relative',
          backgroundColor: 'var(--image-background)',
        }}
        onClick={() => navigate(`/product/${product.id}`, {state: {product}})}
      >
        <img
          ref={productImgRef}
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
            top: 10,
            left: 10,
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className='clickable'
            onClick={wishlistHandler}
            style={{padding: '10px 10px 5px 10px', borderRadius: 5}}
          >
            <svg.HeartSvg product={product} />
          </div>

          <div
            className='clickable'
            onClick={cartHandler}
            style={{padding: '5px 10px 10px 10px', borderRadius: 5}}
          >
            <svg.BagSvg />
          </div>
        </div>
      </div>
      {/* Description */}
      <div>
        <h6
          className='number-of-lines-1'
          style={{marginBottom: 4, color: 'var(--main-color)'}}
        >
          {product.name}
        </h6>
        <components.Price product={product} />
      </div>
    </div>
  );
};
