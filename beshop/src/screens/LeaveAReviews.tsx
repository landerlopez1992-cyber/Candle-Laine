import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {components} from '../components';
import {actions} from '../store/actions';

export const LeaveAReviews: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#FCEDEA');

  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Leave A Review'
        headerStyle={{backgroundColor: '#FCEDEA'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        style={{zIndex: 1}}
        className='scrollable container'
      >
        <div style={{paddingTop: 20, paddingBottom: 20}}>
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/04.png'
            alt='empty-cart'
            style={{
              width: '80%',
              height: 'auto',
              alignSelf: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 30,
            }}
          />
          <h2
            style={{
              textAlign: 'center',
              textTransform: 'capitalize',
              marginBottom: 20,
            }}
          >
            Please rate the quality of <br /> service for the order!
          </h2>
          <components.RatingStars
            containerStyle={{
              marginBottom: 20,
              alignSelf: 'center',
            }}
            setRating={setRating}
            rating={rating}
          />
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Your comments and suggestions help us <br /> improve the service
            quality better!
          </p>
          <textarea
            placeholder='Enter your comment'
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 0,
              width: '100%',
              height: 120,
              resize: 'none',
              marginBottom: 16,
            }}
            className='t16'
          />
          <components.Button
            text='submit'
            to='back'
          />
        </div>
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
