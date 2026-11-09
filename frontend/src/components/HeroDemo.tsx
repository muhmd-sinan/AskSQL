import { useEffect, useRef, useState } from 'react';
import { highlightSql } from '../utils/sql';

// Results below are computed from the seeded demo data (seed/demo_company.sql).
const EXAMPLES = [
  {
    chip: 'Top earners',
    question: 'Who are the three highest paid people in Engineering?',
    sql: "SELECT first_name, last_name, salary\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nWHERE d.name = 'Engineering'\nORDER BY salary DESC\nLIMIT 3;",
    columns: ['first_name', 'last_name', 'salary'],
    rows: [['Rohan', 'Mehta', '175000.00'], ['Aarav', 'Sharma', '145000.00'], ['Diya', 'Patel', '110000.00']],
  },
  {
    chip: 'Average pay',
    question: 'What is the average salary per department?',
    sql: 'SELECT d.name, ROUND(AVG(e.salary)) AS avg_salary\nFROM departments d\nJOIN employees e ON e.department_id = d.id\nGROUP BY d.name\nORDER BY avg_salary DESC;',
    columns: ['name', 'avg_salary'],
    rows: [['Engineering', '143333'], ['Finance', '127500'], ['Marketing', '96500'], ['Sales', '94000'], ['HR', '88500']],
  },
  {
    chip: 'Best customers',
    question: 'Which customers ordered the most units?',
    sql: 'SELECT c.name, SUM(o.quantity) AS units\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nGROUP BY c.name\nORDER BY units DESC\nLIMIT 3;',
    columns: ['name', 'units'],
    rows: [['Initech', '41'], ['Wayne Enterprises', '27'], ['Northwind Traders', '7']],
  },
];

const HOLD_MS = 5200;

export function HeroDemo() {
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState(0);
  const [s, setS] = useState(0);
  const [done, setDone] = useState(false);
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const ex = EXAMPLES[idx];

  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    setQ(0); setS(0); setDone(false);

    if (reduce.current) {
      setQ(ex.question.length); setS(ex.sql.length); setDone(true);
      return;
    }

    const type = (set: (n: number) => void, len: number, step: number, then: () => void) => {
      let i = 0;
      const tick = () => {
        i += 1;
        set(i);
        if (i < len) later(tick, step);
        else then();
      };
      later(tick, step);
    };

    later(() => {
      type(setQ, ex.question.length, 26, () =>
        later(() =>
          type(setS, ex.sql.length, 11, () =>
            later(() => {
              setDone(true);
              later(() => setIdx(i => (i + 1) % EXAMPLES.length), HOLD_MS);
            }, 350),
          ), 450),
      );
    }, 500);

    return () => timers.forEach(clearTimeout);
  }, [idx, ex]);

  const typingQ = q < ex.question.length;
  const typingS = !typingQ && s < ex.sql.length;

  return (
    <div className="drift" aria-label={`Example. Question: ${ex.question} SQL: ${ex.sql.replace(/\n/g, ' ')}`} role="group">
      <div className="surface overflow-hidden" style={{ boxShadow: 'var(--shadow-lift)' }}>
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <p className="text-xs font-medium text-ink-3">You ask</p>
          <p className={`mt-1 min-h-[3.1rem] text-lg font-medium leading-snug tracking-tight sm:text-xl ${typingQ ? 'caret' : ''}`} aria-hidden>
            {ex.question.slice(0, q)}
          </p>
        </div>

        <div className="code-block m-3 px-5 py-4 sm:m-4" aria-hidden>
          <p className="mb-2 text-xs tok-mut">MySQL, written for you</p>
          <pre className={`min-h-[8.5rem] whitespace-pre-wrap break-words text-[0.8125rem] sm:text-sm ${typingS ? 'caret' : ''}`}>
            {highlightSql(ex.sql.slice(0, s))}
          </pre>
        </div>

        <div className="px-5 pb-5 pt-1 sm:px-6" style={{ minHeight: '11.5rem' }} aria-hidden>
          {done && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-3">
                  {ex.columns.map((c, i) => (
                    <th key={c} className={`pb-2 font-medium ${i === ex.columns.length - 1 ? 'text-right' : ''}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ex.rows.map((r, ri) => (
                  <tr key={ri} className="row-in border-t border-line" style={{ ['--i' as string]: ri }}>
                    {r.map((c, ci) => (
                      <td key={ci} className={`py-1.5 ${ci === r.length - 1 ? 'text-right font-mono tabular-nums' : ''}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Example questions">
        {EXAMPLES.map((e, i) => (
          <button key={e.chip} type="button" className="chip" aria-pressed={i === idx} onClick={() => setIdx(i)}>
            {e.chip}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-3">Sample run against the demo database.</p>
    </div>
  );
}
