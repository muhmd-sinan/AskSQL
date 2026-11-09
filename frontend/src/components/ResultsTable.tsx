import { useMemo, useState } from 'react';
import { DownloadSimple, WarningCircle, CheckCircle, Copy, Check, Question } from '@phosphor-icons/react';
import { exportToCSV } from '../utils/export';
import { highlightSql } from '../utils/sql';

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

const NUMERIC = /^-?\d+(\.\d+)?$/;
const MAX_ROWS = 500;

export function ResultsTable({ result, sql, error, clarify }: ResultsTableProps) {
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => (result?.rows ?? []).slice(0, MAX_ROWS), [result]);

  const copySql = async () => {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  if (error) {
    return (
      <div className="notice notice-danger" role="alert">
        <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">That query did not run</p>
          <p className="mt-1 break-words">{error}</p>
          {sql && (
            <pre className="code-block mt-3 overflow-x-auto px-4 py-3 text-[0.8125rem]">
              <code>{highlightSql(sql)}</code>
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (clarify) {
    return (
      <div className="notice notice-warm" role="status">
        <Question size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">A little more detail would help</p>
          <p className="mt-1">{clarify}</p>
        </div>
      </div>
    );
  }

  if (!result || !sql) return null;

  return (
    <div className="space-y-5">
      <div className="code-block relative">
        <div className="flex items-center justify-between px-5 pt-3">
          <p className="text-xs tok-mut">Generated SQL</p>
          <button
            type="button"
            onClick={copySql}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--code-ink)] transition hover:bg-white/10 active:scale-95"
            aria-label={copied ? 'SQL copied' : 'Copy SQL'}
          >
            {copied ? <Check size={16} weight="bold" className="pop" aria-hidden /> : <Copy size={16} aria-hidden />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="scrollbar-thin overflow-x-auto px-5 pb-4 pt-1">
          <code>{highlightSql(sql)}</code>
        </pre>
      </div>

      {result.with_rows && rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              {result.row_count} {result.row_count === 1 ? 'row' : 'rows'}
              {result.row_count > rows.length && ` (showing the first ${rows.length})`}
            </p>
            <button
              type="button"
              onClick={() => exportToCSV({ columns: result.columns, rows: result.rows }, 'query_result.csv')}
              className="btn btn-quiet !min-h-10 !px-4 text-sm"
            >
              <DownloadSimple size={18} aria-hidden />
              Export CSV
            </button>
          </div>

          <div className="scrollbar-thin max-h-[28rem] overflow-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-sunken">
                <tr>
                  {result.columns.map(col => (
                    <th key={col} scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface">
                {rows.map((row, ri) => (
                  <tr key={ri} className="row-in border-t border-line" style={{ ['--i' as string]: ri }}>
                    {row.map((cell, ci) => {
                      const text = cell === null ? null : String(cell);
                      const numeric = text !== null && NUMERIC.test(text);
                      return (
                        <td key={ci} className={`whitespace-nowrap px-4 py-2.5 ${numeric ? 'text-right font-mono tabular-nums' : ''}`}>
                          {text === null ? <span className="italic text-ink-3">null</span> : text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {result.with_rows && rows.length === 0 && (
        <p className="rounded-2xl bg-sunken px-5 py-4 text-ink-2">The query ran and returned no rows.</p>
      )}

      {!result.with_rows && (
        <div className="notice notice-ok" role="status">
          <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 pop" aria-hidden />
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
