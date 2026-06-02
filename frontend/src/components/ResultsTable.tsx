import { useMemo } from 'react';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface ResultsTableProps {
  result: {
    query: string;
    with_rows: boolean;
    columns: string[];
    rows: any[][];
    row_count: number;
    message: string;
  } | null;
  sql?: string | null;
  error?: string | null;
  clarify?: string | null;
}

export function ResultsTable({ result, sql, error, clarify }: ResultsTableProps) {
  const handleExport = () => {
    if (result && result.with_rows && result.rows.length > 0) {
      exportToCSV(
        { columns: result.columns, rows: result.rows },
        'query_result.csv'
      );
    }
  };

  const truncatedRows = useMemo(() => {
    if (!result || !result.rows) return [];
    const MAX_ROWS = 500;
    return result.rows.slice(0, MAX_ROWS);
  }, [result]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-500 mb-2">Error</p>
            <p className="text-sm text-red-400">{error}</p>
            {sql && (
              <pre className="mt-3 p-3 rounded bg-slate-900/50 overflow-x-auto">
                <code className="text-xs font-mono text-slate-300">
                  {sql}
                </code>
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (clarify) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-500 mb-2">Clarification Needed</p>
            <p className="text-sm text-amber-400">{clarify}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (sql) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <pre className="overflow-x-auto scrollbar-thin">
            <code className="text-sm font-mono text-sky-400">{sql}</code>
          </pre>
        </div>

        <div className="text-sm text-slate-400">
          {result.message}
        </div>

        {result.with_rows && result.rows.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                {result.row_count} row(s) returned
                {result.row_count > truncatedRows.length && (
                  <span className="text-amber-400 ml-2">
                    (showing first {truncatedRows.length})
                  </span>
                )}
              </p>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm glass-button text-slate-300"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700/50">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-sky-500/10">
                    <tr>
                      {result.columns.map((col, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left font-semibold text-sky-400"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/30">
                    {truncatedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-slate-700/30"
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-2 font-mono text-xs text-slate-300"
                          >
                            {cell === null ? (
                              <span className="text-slate-600 italic">NULL</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!result.with_rows && (
          <div className="p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-emerald-400">{result.message}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
