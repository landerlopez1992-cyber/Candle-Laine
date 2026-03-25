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
          paddingTop: 18,
          paddingBottom: 24,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: APP_PALETTE.appShell,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            gap: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {categories.map((category: CategoryType, index) => {
            return (
              <button
                key={index}
                type='button'
                style={{
                  width: '100%',
                  position: 'relative',
                  minHeight: 152,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${APP_PALETTE.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '12px 10px 0',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--white-color)',
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
                    height: 108,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    marginTop: 'auto',
                    padding: '8px 8px 10px',
                    backgroundColor: 'var(--white-color)',
                  }}
                >
                  <h5
                    style={{
                      color: 'var(--text-on-light)',
                      textTransform: 'capitalize',
                      margin: 0,
                      fontSize: 15,
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
