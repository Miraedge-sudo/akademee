import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { useState, useMemo } from 'react';

/**
 * Responsive table with optional search, sorting, and empty state.
 *
 * @param {{
 *   columns: Array<{ key: string, label: string, sortable?: boolean, render?: (row: any) => React.ReactNode, className?: string }>,
 *   data: Array<any>,
 *   onRowClick?: (row: any) => void,
 *   searchable?: boolean,
 *   searchPlaceholder?: string,
 *   emptyMessage?: string,
 *   loading?: boolean,
 *   className?: string,
 *   rowKey?: string,
 * }} props
 */
export default function Table({
  columns = [],
  data = [],
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  loading = false,
  className = '',
  rowKey = 'id',
  headerExtra = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden animate-pulse">
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-100 dark:bg-surface-700 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden ${className}`}>
      {(searchable || headerExtra) && (
        <div className="flex items-center gap-2.5 p-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
          {searchable && (
            <>
              <FiSearch className="w-4 h-4 text-surface-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 border-none outline-none text-sm bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-surface-400 hover:text-surface-600 transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </>
          )}
          {!searchable && <div className="flex-1" />}
          {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    text-left py-2.5 px-4
                    text-[10px] font-bold uppercase tracking-wider
                    text-surface-400
                    border-b border-surface-100 dark:border-surface-700
                    ${col.sortable ? 'cursor-pointer select-none hover:text-surface-600 transition-colors' : ''}
                    ${col.className || ''}
                  `}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-surface-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    border-b border-surface-50 dark:border-surface-800
                    ${onRowClick ? 'cursor-pointer' : ''}
                    hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2.5 px-4 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border-t border-surface-100 dark:border-surface-700">
          <span className="text-xs text-surface-400">
            {sorted.length} result{sorted.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
