import React from 'react';

type Props = {
  title: string;
  viewAllVisible?: boolean;
  viewAllOnClick?: () => void;
  containerStyle?: React.CSSProperties;
};

export const BlockHeading: React.FC<Props> = ({
  title,
  viewAllOnClick,
  containerStyle,
  viewAllVisible = true,
}) => {
  return (
    <div
      style={{
        borderBottom: '2px solid var(--main-color)',
        paddingBottom: 9,
        ...containerStyle,
      }}
      className='row-center-space-between'
    >
      <h3>{title}</h3>
      {viewAllVisible && (
        <button
          style={{lineHeight: 0}}
          onClick={viewAllOnClick}
        >
          <span
            className='t16'
            style={{color: 'var(--accent-color)'}}
          >
            View all
          </span>
        </button>
      )}
    </div>
  );
};
