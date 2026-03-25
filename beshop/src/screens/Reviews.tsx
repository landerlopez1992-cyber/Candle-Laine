import React, {useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';

import {items} from '../items';
import {hooks} from '../hooks';
import {ReviewType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {useProductReviews} from '../hooks/useProductReviews';
import {APP_PALETTE} from '../theme/appPalette';
import {isUuid} from '../utils/isUuid';

export const Reviews: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const location = hooks.useLocation();
  const [searchParams] = useSearchParams();

  const fromState = (location.state as {productId?: string} | null)?.productId;
  const fromQuery = searchParams.get('productId') ?? undefined;
  const rawId = fromState ?? fromQuery;
  const productId = rawId && isUuid(rawId) ? rawId : undefined;

  const {reviewsLoading, reviews, reviewsError} =
    useProductReviews(productId);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Reviews'
        showGoBack={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    if (!productId) {
      return (
        <main
          className='scrollable container'
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            backgroundColor: 'var(--white-color)',
          }}
        >
          <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
            Open a product from the shop and use &quot;Write a review&quot; or
            &quot;View all&quot; on the product page to see reviews for that
            item.
          </p>
        </main>
      );
    }

    if (reviewsLoading) {
      return <components.Loader />;
    }

    return (
      <main
        className='scrollable container'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        {reviewsError && (
          <p
            className='t16'
            style={{color: APP_PALETTE.accent, marginBottom: 12}}
          >
            {reviewsError}
          </p>
        )}
        {reviews.length === 0 ? (
          <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
            No reviews yet. Be the first to leave one from the product page.
          </p>
        ) : (
          reviews.map(
            (review: ReviewType, index: number, array: ReviewType[]) => {
              const isLast = index === array.length - 1;
              return (
                <items.ReviewItem
                  key={review.id}
                  review={review}
                  isLast={isLast}
                />
              );
            },
          )
        )}
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
