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
  index: number;
  isLast: boolean;
  product: ProductType;
  /** Carrusel infinito: sin márgenes de borde (el contenedor alinea el padding). */
  omitEdgeMargins?: boolean;
  /** Iconos corazón / bolsa ligeramente más pequeños (p. ej. carrusel Discounted). */
  compactIcons?: boolean;
};

const iconCompactStyle: React.CSSProperties = {
  display: 'inline-flex',
  transform: 'scale(0.88)',
  transformOrigin: 'center',
};

export const TrendingItem: React.FC<Props> = ({
  product,
  index,
  isLast,
  omitEdgeMargins = false,
  compactIcons = false,
}) => {
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
      style={{
        width: 138,
        marginLeft: omitEdgeMargins ? 0 : index === 0 ? 20 : 0,
        marginRight: omitEdgeMargins ? 0 : isLast ? 20 : 0,
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
          type='button'
          style={{
            position: 'absolute',
            bottom: 40 - 8,
            right: 4,
            padding: compactIcons ? 5 : 8,
          }}
          onClick={wishlistHandler}
        >
          <span style={compactIcons ? iconCompactStyle : undefined}>
            <svg.HeartSvg product={product} />
          </span>
        </button>
        <button
          type='button'
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            padding: compactIcons ? 5 : 8,
          }}
          onClick={cartHandler}
        >
          <span style={compactIcons ? iconCompactStyle : undefined}>
            <svg.BagSvg />
          </span>
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
