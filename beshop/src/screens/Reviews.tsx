import React, {useEffect} from 'react';

import {items} from '../items';
import {hooks} from '../hooks';
import {ReviewType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {useReviews} from '../hooks/useReviews';

export const Reviews: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const {reviewsLoading, reviews} = useReviews();

  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Reviews'
        showGoBack={true}
        headerStyle={{
          backgroundColor: '#FCEDEA',
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    if (reviewsLoading) return <components.Loader />;

    return (
      <main
        className='scrollable container'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        {reviews.map(
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
