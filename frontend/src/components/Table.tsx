import React from 'react';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  align?: ColumnAlign;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  borderless?: boolean;
}

function resolveAlignment<T>(col: Column<T>): {
  textAlign: string;
  justify: string;
} {
  if (col.align === 'right' || col.className?.includes('text-right') || col.cellClassName?.includes('text-right')) {
    return { textAlign: 'text-right', justify: 'justify-end' };
  }
  if (col.align === 'center' || col.className?.includes('text-center') || col.cellClassName?.includes('text-center')) {
    return { textAlign: 'text-center', justify: 'justify-center' };
  }
  return { textAlign: 'text-left', justify: 'justify-start' };
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  isLoading = false,
  className = '',
  borderless = false,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col justify-center items-center gap-3 text-[#94A3B8] text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-[2px] bg-[#A78BFA] animate-ping" />
          <span className="w-2 h-2 rounded-[2px] bg-[#A78BFA]" />
        </div>
        <span>Loading table records...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-16 text-center text-[#94A3B8] text-sm font-mono flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#94A3B8] mb-1">
          ∅
        </div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const containerClasses = borderless
    ? `w-full overflow-x-auto ${className}`
    : `w-full overflow-x-auto rounded-[16px] border border-[#334155] bg-[#1E293B] ${className}`;

  return (
    <div className={containerClasses}>
      <table className="w-full text-sm text-[#E2E8F0] border-collapse font-sans">
        <thead className="bg-[#0F172A] text-[11px] uppercase font-mono font-bold text-[#A78BFA] tracking-wider border-b border-[#334155] select-none">
          <tr>
            {columns.map((col, idx) => {
              const { textAlign, justify } = resolveAlignment(col);
              return (
                <th
                  key={idx}
                  scope="col"
                  className={`px-5 py-3 font-mono align-middle ${textAlign} ${col.headerClassName || ''} ${col.className || ''}`}
                >
                  <div className={`inline-flex items-center ${justify} gap-1.5`}>
                    {col.header}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]/60 font-normal">
          {data.map((row, rIdx) => {
            const computedKey = keyExtractor ? keyExtractor(row) : null;
            const validKey = computedKey || (row as any)?.id || (row as any)?._id || `table-row-${rIdx}`;
            return (
              <tr
                key={validKey}
                className="bg-[#1E293B] hover:bg-[#0F172A]/70 transition-colors duration-150"
              >
                {columns.map((col, cIdx) => {
                  const { textAlign, justify } = resolveAlignment(col);
                  return (
                    <td
                      key={cIdx}
                      className={`px-5 py-3.5 whitespace-nowrap align-middle ${textAlign} ${col.cellClassName || ''} ${col.className || ''}`}
                    >
                      <div className={`inline-flex items-center ${justify}`}>
                        {col.render ? col.render(row) : col.accessor ? String(row[col.accessor]) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
