import React, {FC} from 'react';

type Option = {value: string; label: string};

type Props = {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: readonly Option[];
  placeholder?: string;
  containerStyle?: React.CSSProperties;
  disabled?: boolean;
};

export const SelectField: FC<Props> = ({
  value,
  onChange,
  options,
  placeholder = 'Select',
  containerStyle,
  disabled,
}) => {
  return (
    <div
      style={{
        height: 60,
        paddingLeft: 16,
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        display: 'flex',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--input-background)',
        ...containerStyle,
      }}
    >
      <select
        className='input-field'
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={placeholder}
        style={{
          width: '100%',
          height: '100%',
          padding: '0 28px 0 4px',
          margin: 0,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: 18,
          color: 'var(--main-color)',
          fontFamily: 'League Spartan, sans-serif',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
        }}
      >
        <option value=''>{placeholder}</option>
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
          >
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: 14,
          pointerEvents: 'none',
          color: 'var(--main-color)',
          opacity: 0.65,
          fontSize: 10,
          lineHeight: 1,
        }}
      >
        ▼
      </span>
    </div>
  );
};
