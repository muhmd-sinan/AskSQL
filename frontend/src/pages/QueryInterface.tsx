import { useEffect, useRef, useState } from 'react';
import { QueryInput } from '../components/QueryInput';
import { ResultsTable } from '../components/ResultsTable';
import { Disclosure } from '../components/Disclosure';
import { SchemaGrid } from '../components/SchemaGrid';
import { api, type QueryHistoryEntry } from '../services/api';

interface QueryInterfaceProps {
  status: {
    db_connected: boolean;
    api_connected: boolean;
    db_name?: string;
    model?: string;
    is_demo?: boolean;
    demo_remaining?: number | null;
  };
  schema_tables: Record<string, Array<{ name: string; type: string; tag: string }>>;
  onQueryExecuted: () => void;
  onNavigate: (page: string) => void;
  selectedEntry?: QueryHistoryEntry | null;
}

const DEMO_SUGGESTIONS = [
  'Who earns the most in each department?',
  'Total revenue per product category',
  'Customers who signed up in 2024',
  'How many orders did each country place?',
];

function Loading() {
  const [long, setLong] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLong(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="surface p-6 sm:p-8" role="status" aria-live="polite">
      <p className="font-medium">Writing your query</p>
      <div className="indeterminate mt-4" aria-hidden />
      <div className="mt-6 space-y-3" aria-hidden>
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      {long && <p className="mt-5 text-sm text-ink-2">Still working. The model can take a few seconds on a busy day.</p>}
    </div>
  );
}

export function QueryInterface({ status, schema_tables, onQueryExecuted, onNavigate, selectedEntry }: QueryInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<QueryHistoryEntry | null>(selectedEntry || null);
  const [runKey, setRunKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEntry) {
      setCurrent(selectedEntry);
      setRunKey(k => k + 1);
    }
  }, [selectedEntry]);

  useEffect(() => {
    if (current && !loading) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [runKey, loading, current]);

  const fail = (question: string, error: string): QueryHistoryEntry => ({
    id: '', question, sql: null, result: null, clarify: null, error, timestamp: new Date().toISOString(),
  });

  const handleExecute = async (question: string) => {
    setLoading(true);
    try {
      const res = await api.executeQuery(question);
      setCurrent(res.success && res.entry ? res.entry : fail(question, res.error || 'The query failed. Try rephrasing it.'));
      if (res.success) onQueryExecuted();
      else onQueryExecuted();
    } catch (err: any) {
      setCurrent(fail(question, err.message || 'Could not reach the server. Try again in a moment.'));
    } finally {
      setLoading(false);
      setRunKey(k => k + 1);
    }
  };

  if (!status.db_connected || !status.api_connected) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <h1 className="title">Connect first.</h1>
        <p className="lead mt-4">
          {!status.db_connected
            ? 'Pick a database, or try the demo, then come back to ask your first question.'
            : 'Add your Groq API key, then come back to ask your first question.'}
        </p>
        <button
          type="button"
          className="btn btn-primary mt-8"
          onClick={() => onNavigate(!status.db_connected ? 'db' : 'api')}
        >
          {!status.db_connected ? 'Choose a database' : 'Add API key'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="title">
          Ask anything about <span className="text-accent-ink">{status.db_name}</span>.
        </h1>
        <p className="mt-3 text-ink-2">
          {status.model}
          {status.is_demo && typeof status.demo_remaining === 'number' &&
            `, ${status.demo_remaining} ${status.demo_remaining === 1 ? 'question' : 'questions'} left in this demo session`}
        </p>
      </header>

      <div className="mt-8">
        <QueryInput
          onExecute={handleExecute}
          loading={loading}
          suggestions={status.is_demo ? DEMO_SUGGESTIONS : []}
        />
      </div>

      <div ref={resultRef} className="mt-10 scroll-mt-24" aria-live="polite">
        {loading ? (
          <Loading />
        ) : current ? (
          <section key={runKey} className="page-enter">
            <p className="mb-4 text-lg font-medium tracking-tight">{current.question}</p>
            <ResultsTable
              result={current.result}
              sql={current.sql}
              error={current.error}
              clarify={current.clarify}
            />
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-6 py-14 text-center">
            <p className="text-lg font-medium">Your answer will appear here.</p>
            <p className="mx-auto mt-2 max-w-[40ch] text-ink-2">
              Try a suggestion above, or describe what you want to see in your own words.
            </p>
          </div>
        )}
      </div>

      {Object.keys(schema_tables).length > 0 && (
        <div className="mt-16 border-y border-line">
          <Disclosure title="Schema" meta={`${Object.keys(schema_tables).length} tables`}>
            <SchemaGrid schema_tables={schema_tables} />
          </Disclosure>
        </div>
      )}
    </div>
  );
}
