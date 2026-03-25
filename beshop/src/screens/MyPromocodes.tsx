import React, {useEffect, useState} from 'react';

import {items} from '../items';
import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {PromocodeType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import { APP_PALETTE } from '../theme/appPalette';

const tabs = ['Current', 'Used'];

export const MyPromocodes: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [activeTab, setActiveTab] = useState(0);

  const {promocodesLoading, promocodes} = hooks.usePromocodes();

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

  const renderFooter = (): JSX.Element => {
    return (
      <section
        style={{
          padding: 20,
          display: 'flex',
          justifyContent: 'center',
        }}
        className='clickable'
      >
        <svg.NewPromocodeSvg />
      </section>
    );
  };

  const renderContent = (): JSX.Element => {
    if (promocodesLoading) return <components.Loader />;

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
          {promocodes?.map((promocode: PromocodeType, index, array) => {
            const isLast = index === array.length - 1;

            return (
              <items.PromocodeItem
                isLast={isLast}
                key={promocode.id}
                promocode={promocode}
              />
            );
          })}
        </section>
        {renderFooter()}
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
