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
        <label htmlFor={selectId} className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A78BFA]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-[4px] bg-[#0F172A] border text-[#E2E8F0] text-sm px-3.5 py-2 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[#A78BFA] focus:border-[#A78BFA] cursor-pointer ${
          error ? 'border-[#F87171]' : 'border-[#334155] hover:border-[#475569]'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1E293B] text-[#E2E8F0] py-1">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#F87171] font-mono font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
