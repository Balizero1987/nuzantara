import React, { forwardRef } from 'react';

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  isValid?: boolean | null;
  required?: boolean;
  autoComplete?: string;
  inputMode?: string;
  pattern?: string;
  maxLength?: number;
  className?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onKeyDown,
      onBlur,
      isValid,
      required = false,
      autoComplete,
      inputMode,
      pattern,
      maxLength,
      className = '',
    },
    ref
  ) => {
    return (
      <div className="form-group">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        <div className="input-wrapper">
          <input
            ref={ref}
            type={type}
            id={id}
            className={`form-input ${className}`}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            inputMode={inputMode}
            pattern={pattern}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
          />
          {isValid !== null && (
            <span
              className={`validation-icon ${isValid ? 'valid' : 'invalid'}`}
              aria-hidden="true"
            >
              {isValid ? '✓' : '✗'}
            </span>
          )}
        </div>
      </div>
    );
  }
);

InputField.displayName = 'InputField';

