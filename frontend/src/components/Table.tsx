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
      <div className="w-full py-12 flex justify-center items-center text-slate-400 text-sm font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2" />
        Loading table records...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-12 text-center text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-900/50 backdrop-blur-xl shadow-xl">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-[#080c14]/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-5 py-3.5 font-mono ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-normal">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-slate-800/50 transition-colors">
              {columns.map((col, cIdx) => (
                <td key={cIdx} className={`px-5 py-4 whitespace-nowrap ${col.className || ''}`}>
                  {col.render ? col.render(row) : col.accessor ? String(row[col.accessor]) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
