import React, {useEffect, useState} from 'react';

import {items} from '../items';
import {hooks} from '../hooks';
import {PromocodeType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';

const tabs = ['Current', 'Used'];

export const MyPromocodes: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [activeTab, setActiveTab] = useState(0);

  const {
    promocodesLoading,
    currentPromocodes,
    usedPromocodes,
  } = hooks.usePromocodes();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='My Promocodes'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderTabs = (): JSX.Element => {
    return (
      <div
        className='row-center'
        style={{gap: 1, marginBottom: 20}}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeTab;
          return (
            <div
              key={tab}
              style={{
                width: '100%',
                color: isActive ? 'var(--main-color)' : 'var(--text-color)',
                paddingBottom: 10,
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: isActive
                  ? 'var(--accent-color)'
                  : 'var(--border-color)',
              }}
              onClick={() => setActiveTab(index)}
              className='clickable'
            >
              <h4
                style={{
                  color: isActive ? 'var(--main-color)' : 'var(--text-color)',
                }}
              >
                {tab}
              </h4>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = (): JSX.Element => {
    if (promocodesLoading) {
      return <components.Loader />;
    }

    const list =
      activeTab === 0 ? currentPromocodes : usedPromocodes;

    return (
      <main
        className='scrollable'
        style={{
          padding: '32px 20px 20px 20px',
          backgroundColor: 'var(--main-background)',
        }}
      >
        {renderTabs()}
        <section
          style={{
            display: 'grid',
            gap: 15,
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {list.length > 0 ? (
            list.map((promocode: PromocodeType, index, array) => {
              const isLast = index === array.length - 1;
              return (
                <items.PromocodeItem
                  isLast={isLast}
                  key={`${activeTab}-${String(promocode.id)}`}
                  promocode={promocode}
                />
              );
            })
          ) : (
            <p
              className='t14'
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--text-color)',
                opacity: 0.85,
                padding: '24px 12px',
              }}
            >
              {activeTab === 0
                ? 'No promocodes available. Sign in or check back when new offers are published.'
                : 'No used promocodes yet. Codes you apply at checkout will appear here.'}
            </p>
          )}
        </section>
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
