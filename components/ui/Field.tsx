import React from 'react';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export function Label({
  required = false,
  className = '',
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-xs uppercase tracking-wider font-semibold text-namora-ink mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-namora-gold ml-1">*</span>}
    </label>
  );
}

export interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  required,
  error,
  helperText,
  htmlFor,
  className = '',
  children,
}: FieldProps) {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <span className="text-xs text-red-400 mt-1.5 font-medium">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-namora-muted mt-1.5 font-light">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
