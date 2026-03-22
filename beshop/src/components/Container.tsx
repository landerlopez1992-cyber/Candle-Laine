import React from 'react';

type Props = {
  children: React.ReactNode;
  onContainerClick?: () => void;
  containerStyle?: React.CSSProperties;
};

export const Container: React.FC<Props> = ({
  children,
  containerStyle,
  onContainerClick,
}) => {
  return (
    <div
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FAF9FF',
        border: '1px solid var(--border-color)',
        ...containerStyle,
      }}
      onClick={onContainerClick}
    >
      {children}
    </div>
  );
};
