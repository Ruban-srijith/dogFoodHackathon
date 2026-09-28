import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-xl bg-[var(--bg-card)] border text-[var(--text-main)] text-sm px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] cursor-pointer ${
          error ? 'border-[var(--accent-red)]' : 'border-[var(--border-color)] hover:border-[var(--border-hover)]'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-surface)] text-[var(--text-main)] py-1">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--accent-red)] font-mono font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
