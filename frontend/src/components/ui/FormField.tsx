import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
}

export function FormField({ label, type = 'text', registration, error, placeholder }: FormFieldProps) {
  return (
    <div>
      <label className="input-label" htmlFor={registration.name}>
        {label}
      </label>
      <input
        id={registration.name}
        type={type}
        className={`input${error ? ' input-error' : ''}`}
        placeholder={placeholder}
        {...registration}
      />
      {error && <p className="input-error-msg">{error.message}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  options: { value: string; label: string }[];
}

export function SelectField({ label, registration, error, options }: SelectFieldProps) {
  return (
    <div>
      <label className="input-label" htmlFor={registration.name}>
        {label}
      </label>
      <select
        id={registration.name}
        className={`select${error ? ' input-error' : ''}`}
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
