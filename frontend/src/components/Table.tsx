import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  isLoading = false,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center items-center text-[var(--text-muted)] text-sm font-mono">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-ping mr-2" />
        Loading table records...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-12 text-center text-[var(--text-muted)] text-sm font-mono">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-xl shadow-xl">
      <table className="w-full text-left text-sm text-[var(--text-main)]">
        <thead className="bg-[var(--bg-surface)] text-[11px] uppercase font-mono font-bold text-[var(--accent-cyan)] tracking-wider border-b border-[var(--border-color)]">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-5 py-3.5 font-mono ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)] font-normal">
          {data.map((row, rIdx) => {
            const computedKey = keyExtractor ? keyExtractor(row) : null;
            const validKey = computedKey || (row as any)?.id || (row as any)?._id || `table-row-${rIdx}`;
            return (
              <tr key={validKey} className="hover:bg-[var(--bg-surface)] transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-5 py-4 whitespace-nowrap ${col.className || ''}`}>
                    {col.render ? col.render(row) : col.accessor ? String(row[col.accessor]) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
