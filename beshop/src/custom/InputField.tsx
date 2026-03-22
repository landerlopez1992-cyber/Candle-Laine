import {FC} from 'react';
import React from 'react';

type Props = {
  type?: 'text' | 'password';
  clickable?: boolean;
  containerStyle?: React.CSSProperties;
  label?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
  icon?: JSX.Element;
};

export const InputField: FC<Props> = ({
  placeholder,
  containerStyle,
  autoCapitalize = 'none',
  icon,
  clickable,
  type = 'text',
}) => {
  return (
    <div
      style={{
        height: 60,
        paddingLeft: 20,
        paddingRight: 20,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        display: 'flex',
        border: '1px solid #FCEDEA',
        backgroundColor: 'var(--white-color)',
        ...containerStyle,
      }}
    >
      <input
        className='input-field'
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        maxLength={50}
        type={type}
        style={{
          width: '100%',
          height: '100%',
          padding: 0,
          margin: 0,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: 18,
          color: 'var(--main-color)',
          fontFamily: 'League Spartan',
        }}
      />
      {icon && !clickable && <div>{icon}</div>}
      {icon && clickable && <button>{icon}</button>}
    </div>
  );
};
