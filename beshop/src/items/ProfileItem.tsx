import React from 'react';
import {Link} from 'react-router-dom';

import {Routes} from '../enums';
import {svg} from '../assets/svg';

type Props = {
  to?: string | null;
  title: string;
  icon?: JSX.Element;
  isLast?: boolean;
  isButton?: boolean;
  onClick?: () => void;
  titleStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
};

export const ProfileItem: React.FC<Props> = ({
  titleStyle,
  title,
  icon,
  to,
  isLast,
  onClick,
  containerStyle,
  isButton = false,
}) => {
  if (!isButton) {
    return (
      <Link
        style={{
          borderTopWidth: 1,
          border: 'none',
          width: '100%',
          backgroundColor: 'var(--white-color)',
          // padding: '15px 16px',
          marginBottom: isLast ? 0 : 8,
          ...containerStyle,
        }}
        to={to || '#'}
        className='row-center'
      >
        {icon}
        <h5 style={{marginLeft: 14, ...titleStyle}}>{title}</h5>
        {to !== Routes.SignIn && to && (
          <div style={{marginLeft: 'auto'}}>
            <svg.RightArrowSvg />
          </div>
        )}
      </Link>
    );
  }

  if (isButton) {
    return (
      <button
        style={{
          borderTopWidth: 1,
          border: 'none',
          width: '100%',
          backgroundColor: 'var(--white-color)',
          // padding: '15px 16px',
          marginBottom: isLast ? 0 : 8,
          ...containerStyle,
        }}
        className='row-center'
        onClick={onClick}
      >
        {icon}
        <h5 style={{marginLeft: 14, ...titleStyle}}>{title}</h5>
        {to !== Routes.SignIn && to && (
          <div style={{marginLeft: 'auto'}}>
            <svg.RightArrowSvg />
          </div>
        )}
      </button>
    );
  }

  return null;
};
