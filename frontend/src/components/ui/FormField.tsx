import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
  hint?: string;
  /** When true, renders the input with monospace font (used for SKUs, codes, emails). */
  mono?: boolean;
  /** Show a small "FORGOT?" or similar link to the right of the label. */
  trailingLabel?: { text: string; href: string };
  /** Mark the field as required (renders an accent asterisk after the label). */
  required?: boolean;
  /** Optional `data-testid` attribute applied to the underlying <input>. */
  testId?: string;
}

export function FormField({
  label,
  type = 'text',
  registration,
  error,
  placeholder,
  hint,
  mono,
  trailingLabel,
  required,
  testId,
}: FormFieldProps) {
  return (
    <div className="field">
      <div className="form-field-label">
        <span>
          {label}
          {required && <span className="req">*</span>}
        </span>
        {trailingLabel && (
          <a className="micro" style={{ color: 'var(--color-accent-deep)' }} href={trailingLabel.href}>
            {trailingLabel.text}
          </a>
        )}
      </div>
      <input
        id={registration.name}
        type={type}
        className={`input${mono ? ' mono' : ''}${error ? ' input-error' : ''}`}
        placeholder={placeholder}
        data-testid={testId}
        {...registration}
      />
      {hint && !error && <p className="input-help">{hint}</p>}
      {error && <p className="input-error-msg">{error.message}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  options: { value: string; label: string }[];
  required?: boolean;
  /** Optional `data-testid` attribute applied to the underlying <select>. */
  testId?: string;
}

export function SelectField({ label, registration, error, options, required, testId }: SelectFieldProps) {
  return (
    <div className="field">
      <div className="form-field-label">
        <span>
          {label}
          {required && <span className="req">*</span>}
        </span>
      </div>
      <select
        id={registration.name}
        className={`select${error ? ' input-error' : ''}`}
        data-testid={testId}
        {...registration}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="input-error-msg">{error.message}</p>}
    </div>
  );
}
