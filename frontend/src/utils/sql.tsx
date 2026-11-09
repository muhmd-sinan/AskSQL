import type { ReactNode } from 'react';

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER',
  'HAVING', 'LIMIT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'DESC', 'ASC', 'DISTINCT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'DROP', 'ALTER', 'LIKE', 'BETWEEN', 'ROUND', 'YEAR', 'MONTH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
]);

const TOKEN = /('[^']*'?)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]+\b)/g;

/** Tiny SQL highlighter. Safe for partial strings, so it works while text is being typed. */
export function highlightSql(sql: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of sql.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(sql.slice(last, at));
    if (m[1] || m[2]) {
      out.push(<span key={n++} className="tok-lit">{m[0]}</span>);
    } else if (KEYWORDS.has(m[3].toUpperCase())) {
      out.push(<span key={n++} className="tok-key">{m[0]}</span>);
    } else {
      out.push(m[0]);
    }
    last = at + m[0].length;
  }
  if (last < sql.length) out.push(sql.slice(last));
  return out;
}
