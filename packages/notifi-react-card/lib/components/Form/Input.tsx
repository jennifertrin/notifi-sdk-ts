import clsx from 'clsx';
import React, { ChangeEvent, FC, ReactNode } from 'react';

export interface NotifiInputProps {
  onChange: (value: string) => void;
  className?: string;
  wrapperClassName?: string;
  icon?: ReactNode;
  value: string | undefined;
  placeholder?: string;
  error?: string;
}

export const Input: FC<NotifiInputProps> = ({
  icon,
  wrapperClassName,
  className,
  onChange,
  value,
  error,
  placeholder = '',
}) => {
  const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    onChange && onChange(value);
  };

  return (
    <div
      className={clsx([
        'Notifi--InputWrapper',
        wrapperClassName,
        { 'Notifi--Input__Error': error },
      ])}
    >
      {icon && icon}
      <input
        className={clsx(['Notifi--Input', className])}
        onChange={changeHandler}
        value={value}
        placeholder={placeholder}
      />
    </div>
  );
};
