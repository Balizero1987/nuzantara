import * as React from 'react';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface InputOTPContextValue {
  value: string;
  setValue: (value: string) => void;
  maxLength: number;
}

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

function useInputOTP() {
  const context = React.useContext(InputOTPContext);
  if (!context) {
    throw new Error('InputOTP components must be used within InputOTP');
  }
  return context;
}

export interface InputOTPProps {
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

const InputOTP = ({ maxLength = 6, value, onChange, children }: InputOTPProps) => {
  const contextValue = React.useMemo(
    () => ({ value, setValue: onChange, maxLength }),
    [value, onChange, maxLength]
  );

  return (
    <InputOTPContext.Provider value={contextValue}>
      {children}
    </InputOTPContext.Provider>
  );
};

export interface InputOTPGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputOTPGroup = React.forwardRef<HTMLDivElement, InputOTPGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex', className)}
        {...props}
      />
    );
  }
);
InputOTPGroup.displayName = 'InputOTPGroup';

export interface InputOTPSlotProps extends React.InputHTMLAttributes<HTMLInputElement> {
  index: number;
}

const InputOTPSlot = React.forwardRef<HTMLInputElement, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const { value, setValue, maxLength } = useInputOTP();
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, '').slice(0, 1);
      if (newValue) {
        const newPin = value.slice(0, index) + newValue + value.slice(index + 1);
        setValue(newPin.slice(0, maxLength));
        // Move to next input
        if (index < maxLength - 1) {
          const group = inputRef.current?.parentElement;
          const nextInput = group?.children[index + 1] as HTMLInputElement;
          nextInput?.focus();
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        const group = inputRef.current?.parentElement;
        const prevInput = group?.children[index - 1] as HTMLInputElement;
        prevInput?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, maxLength);
      if (pastedData) {
        setValue(pastedData);
        const lastIndex = Math.min(index + pastedData.length - 1, maxLength - 1);
        const group = inputRef.current?.parentElement;
        const lastInput = group?.children[lastIndex] as HTMLInputElement;
        lastInput?.focus();
      }
    };

    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value[index] || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={cn(
          'rounded-lg border transition-all',
          'focus-visible:outline-none focus-visible:ring-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        data-active={value[index] ? 'true' : 'false'}
        {...props}
      />
    );
  }
);
InputOTPSlot.displayName = 'InputOTPSlot';

export { InputOTP, InputOTPGroup, InputOTPSlot };

