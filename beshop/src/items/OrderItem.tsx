import React, {useRef} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {components} from '../components';
import {removeFromCart} from '../store/slices/cartSlice';
import {APP_PALETTE} from '../theme/appPalette';
import {dispatchAddToCartWithFly} from '../utils/addToCartWithFly';

type Props = {
  isLast: boolean;
  product: ProductType;
};

export const OrderItem: React.FC<Props> = ({product, isLast}) => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();
  const productImgRef = useRef<HTMLImageElement>(null);

  const cart = useSelector((state: RootState) => state.cartSlice);
  const ifInCart = cart.list.find((item) => item.id === product.id);
  const qty = ifInCart ? ifInCart.quantity : 0;

  return (
    <div
      style={{
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        marginBottom: isLast ? 0 : 8,
        backgroundColor: APP_PALETTE.cartCardSurface,
        border: '1px solid var(--border-color)',
      }}
      onClick={() => navigate(`/product/${product.id}`, {state: {product}})}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--image-background)',
          marginRight: 10,
        }}
      >
        <img
          ref={productImgRef}
          src={product.image}
          alt={product.name}
          style={{
            width: 80,
            height: 80,
            objectFit: 'contain',
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
      </div>
      {/* Info */}
      <div>
        <h6
          className='number-of-lines-1'
          style={{
            color: 'var(--text-on-light)',
            marginBottom: 7,
          }}
        >
          {product.name}
        </h6>
        <components.Price product={product} variant='onLight' />
      </div>
      {/* Buttons */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'absolute',
            right: 0,
            height: '100%',
            padding: 10,
          }}
        >
          <button
            onClick={(event) => {
              event.stopPropagation();
              dispatchAddToCartWithFly(dispatch, product, productImgRef.current);
            }}
          >
            <svg.OrderPlusSvg />
          </button>
          <span
            className='t10'
            style={{color: 'var(--text-on-light)'}}
          >
            {qty}
          </span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              dispatch(removeFromCart(product));
            }}
          >
            <svg.OrderMinusSvg />
          </button>
        </div>
      </div>
    </div>
  );
};
