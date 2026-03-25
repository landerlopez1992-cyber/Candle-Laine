import {Action} from 'redux';
import React, {useEffect} from 'react';
import {ThunkDispatch} from 'redux-thunk';
import {useDispatch} from 'react-redux';

import {hooks} from '../../hooks';
import {RootState} from '../../store';
import {CategoryType} from '../../types';
import {actions} from '../../store/actions';
import {components} from '../../components';
import { APP_PALETTE } from '../../theme/appPalette';

export const Categories: React.FC = () => {
  const navigate = hooks.useNavigate();
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();

  const {categoriesLoading, categories} = hooks.useCategories();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        search={true}
        showLogo={true}
        showBasket={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    if (categoriesLoading) return <components.Loader />;

    return (
      <main
        className='scrollable container'
        style={{
          paddingTop: 15,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        <div
          style={{
            gap: 15,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {categories.map((category: CategoryType, index) => {
            return (
              <button
                key={index}
                style={{
                  width: '100%',
                  position: 'relative',
                  height: 200,
                  display: 'flex',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  navigate('/shop', {
                    state: {
                      category: category.name,
                      categoryId: category.id,
                    },
                  });
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    padding: '5px 10px',
                    backgroundColor: 'var(--white-color)',
                  }}
                >
                  <h5
                    style={{
                      color: 'var(--main-color)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {category.name}
                  </h5>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  );
};
