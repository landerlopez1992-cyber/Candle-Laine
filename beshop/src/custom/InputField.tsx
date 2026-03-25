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
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoComplete?: string;
};

export const InputField: FC<Props> = ({
  placeholder,
  containerStyle,
  autoCapitalize = 'none',
  icon,
  clickable,
  type = 'text',
  value,
  onChange,
  disabled,
  inputMode,
  maxLength = 50,
  autoComplete,
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
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--input-background)',
        ...containerStyle,
      }}
    >
      <input
        className='input-field'
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        maxLength={maxLength}
        type={type}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete}
        {...(value !== undefined
          ? {value, onChange}
          : {})}
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
          caretColor: 'var(--accent-color)',
        }}
      />
      {icon && !clickable && <div>{icon}</div>}
      {icon && clickable && <button>{icon}</button>}
    </div>
  );
};
