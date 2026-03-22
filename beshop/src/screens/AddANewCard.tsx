import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {actions} from '../store/actions';
import {components} from '../components';

import background from '../assets/bg/07.png';

export const AddANewCard: React.FC = () => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Add A New Card'
        headerStyle={{backgroundColor: 'var(--white-color)'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--white-color)',
        }}
      >
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: '16%',
            height: '100%',
          }}
        >
          <img
            src='https://george-fx.github.io/beshop_api/assets/cards/01.png'
            alt='card'
            style={{
              width: '90%',
              height: 'auto',
              margin: '0 auto',
              marginBottom: 30,
            }}
          />
          <custom.InputField
            containerStyle={{marginBottom: 10}}
            placeholder='Kristin Watson'
          />
          <custom.InputField
            containerStyle={{marginBottom: 10}}
            placeholder='xxxx xxxx xxxx xxxx'
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 20,
              gap: 11,
            }}
          >
            <custom.InputField
              containerStyle={{marginBottom: 20}}
              placeholder='MM/YY'
            />
            <custom.InputField
              containerStyle={{marginBottom: 20}}
              placeholder='CVV'
            />
          </div>
          <components.Button
            text='save card'
            onClick={() => {
              navigate(-1);
            }}
          />
        </div>
      </main>
    );
  };

  const renderIndent = (): JSX.Element => {
    return (
      <div
        style={{
          height: 34,
          backgroundColor: 'var(--white-color)',
        }}
      />
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderIndent()}
    </>
  );
};
