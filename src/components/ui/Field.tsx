import React, { useId } from 'react';
import styles from './Field.module.css';

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface InputFieldProps extends BaseFieldProps, React.InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
}

export interface SelectFieldProps extends BaseFieldProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

export interface TextareaFieldProps extends BaseFieldProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

export type FieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export function Field(props: FieldProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const { label, hint, error, required, className = '', as = 'input', children, ...rest } = props;

  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.requiredMark}> *</span>}
        </label>
      )}

      {children && as !== 'select' ? (
        children
      ) : as === 'select' ? (
        <select
          id={id}
          className={`${styles.control} ${styles.select} ${error ? styles.hasError : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(rest as any)}
        >
          {(props as SelectFieldProps).options
            ? (props as SelectFieldProps).options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={id}
          className={`${styles.control} ${styles.textarea} ${error ? styles.hasError : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(rest as any)}
        />
      ) : (
        <input
          id={id}
          className={`${styles.control} ${error ? styles.hasError : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(rest as any)}
        />
      )}

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
