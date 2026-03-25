import React from 'react';

import {ReviewType} from '../types';
import {components} from '../components';
import {reviewAvatarUrl} from '../utils/mapProductReview';

type Props = {
  review: ReviewType;
  isLast: boolean;
};

export const ReviewItem: React.FC<Props> = ({review, isLast}) => {
  return (
    <div
      style={{
        padding: 20,
        border: '1px solid var(--border-color)',
        marginBottom: isLast ? 0 : 12,
        backgroundColor: 'var(--white-color)',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
      }}
    >
      <img
        src={review.photo || reviewAvatarUrl(review.name)}
        alt={review.name}
        style={{
          width: 30,
          height: 30,
          marginRight: 14,
          borderRadius: '50%',
        }}
      />
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{marginBottom: 7}}>
          <div
            className='row-center-space-between'
            style={{marginBottom: 1}}
          >
            <h5 style={{marginBottom: 2}}>{review.name}</h5>
            <components.Rating rating={review.rating} />
          </div>

          <span
            className='t10'
            style={{color: '#999999'}}
          >
            {review.date}
          </span>
        </div>
        <p className='t14'>{review.comment}</p>
      </div>
    </div>
  );
};
