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
      <div className="w-full py-16 flex flex-col justify-center items-center gap-3 text-[var(--text-muted)] text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)] animate-ping" />
          <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
        </div>
        <span>Loading table records...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-16 text-center text-[var(--text-muted)] text-sm font-mono flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-1">
          ∅
        </div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const containerClasses = borderless
    ? `w-full overflow-x-auto ${className}`
    : `w-full overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-xl shadow-xl ${className}`;

  return (
    <div className={containerClasses}>
      <table className="w-full text-sm text-[var(--text-main)] border-collapse">
        <thead className="bg-[var(--bg-surface)] text-[11px] uppercase font-mono font-bold text-[var(--accent-cyan)] tracking-wider border-b border-[var(--border-color)] select-none">
          <tr>
            {columns.map((col, idx) => {
              const { textAlign, justify } = resolveAlignment(col);
              return (
                <th
                  key={idx}
                  scope="col"
                  className={`px-5 py-3.5 font-mono align-middle ${textAlign} ${col.headerClassName || ''} ${col.className || ''}`}
                >
                  <div className={`flex items-center ${justify} gap-1.5 w-full`}>
                    {col.header}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]/60 font-normal">
          {data.map((row, rIdx) => {
            const computedKey = keyExtractor ? keyExtractor(row) : null;
            const validKey = computedKey || (row as any)?.id || (row as any)?._id || `table-row-${rIdx}`;
            return (
              <tr
                key={validKey}
                className="odd:bg-transparent even:bg-[var(--bg-surface)]/25 hover:bg-[var(--bg-surface)]/75 transition-colors duration-150"
              >
                {columns.map((col, cIdx) => {
                  const { textAlign, justify } = resolveAlignment(col);
                  return (
                    <td
                      key={cIdx}
                      className={`px-5 py-3.5 whitespace-nowrap align-middle ${textAlign} ${col.cellClassName || ''} ${col.className || ''}`}
                    >
                      <div className={`flex items-center ${justify} w-full`}>
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
