import React from 'react';
import {useSelector} from 'react-redux';

import {svg} from '../assets/svg';
import {hooks} from '../hooks';
import {RootState} from '../store';
import {Screens} from '../enums';

import {setScreen} from '../store/slices/tabSlice';

const tabs = [
  {
    id: 1,
    screen: Screens.Home,
    icon: <svg.HomeSvg />,
  },
  {
    id: 2,
    screen: Screens.Search,
    icon: <svg.SearchSvg />,
  },
  {
    id: 3,
    screen: Screens.Cart,
    icon: <svg.OrderSvg />,
  },
  {
    id: 4,
    screen: Screens.Wishlist,
    icon: <svg.WishlistSvg />,
  },
  {
    id: 5,
    screen: Screens.Profile,
    icon: <svg.ProfileSvg />,
  },
];

export const Footer: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const curentScreen = useSelector((state: RootState) => state.tabSlice.screen);

  return (
    <footer
      style={{
        zIndex: 100,
        height: 'var(--footer-height)',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--footer-bar)',
      }}
    >
      <ul
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab, index) => {
          return (
            <li
              key={tab.id}
              className='clickable'
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => dispatch(setScreen(tab.screen))}
            >
              {tab.icon}
              <span
                className='t10'
                style={{
                  marginTop: 6,
                  textTransform: 'uppercase',
                  color:
                    curentScreen === tab.screen
                      ? 'var(--main-color)'
                      : 'var(--text-color)',
                }}
              >
                {tab.screen}
              </span>
            </li>
          );
        })}
      </ul>
    </footer>
  );
};
