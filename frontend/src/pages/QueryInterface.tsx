import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { SchemaGrid } from '../components/SchemaGrid';
import { QueryInput } from '../components/QueryInput';
import { ResultsTable } from '../components/ResultsTable';
import { api, type QueryHistoryEntry } from '../services/api';

interface QueryInterfaceProps {
  status: {
    db_connected: boolean;
    api_connected: boolean;
    db_name?: string;
    model?: string;
  };
  schema_tables: Record<string, Array<{ name: string; type: string; tag: string }>>;
  onQueryExecuted: () => void;
  selectedEntry?: QueryHistoryEntry | null;
}

export function QueryInterface({ status, schema_tables, onQueryExecuted, selectedEntry }: QueryInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryHistoryEntry | null>(selectedEntry || null);

  const handleExecute = async (question: string) => {
    setLoading(true);
    try {
      const result = await api.executeQuery(question);
      if (result.success && result.entry) {
        setCurrentResult(result.entry);
        onQueryExecuted();
      } else {
        setCurrentResult({
          id: '',
          question: question,
          sql: null,
          result: null,
          clarify: null,
          error: result.error || 'Query failed',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setCurrentResult({
        id: '',
        question: question,
        sql: null,
        result: null,
        clarify: null,
        error: err.message || 'Query failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSchema = async () => {
    try {
      await api.getSchema();
      onQueryExecuted();
    } catch (err) {
      console.error('Schema refresh failed:', err);
    }
  };

  if (!status.db_connected || !status.api_connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">
              Setup Required
            </h3>
            <p className="text-slate-400">
              Connect to a database and configure the API to use the query interface.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-slate-100">
              Query Interface
            </h1>
            <p className="text-slate-400">
              DB: <code className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">{status.db_name}</code>
              {' '} · Model:{' '}
              <code className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">{status.model}</code>
            </p>
          </div>
        </div>
      </div>

      <SchemaGrid schema_tables={schema_tables} onRefresh={handleRefreshSchema} />

      <GlassCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-semibold text-slate-100">
            Ask a Question
          </h3>
        </div>
        <QueryInput onExecute={handleExecute} loading={loading} />
      </GlassCard>

      {currentResult && (
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4 text-slate-100">
            Result
          </h3>
          <p className="text-sm mb-4 text-slate-400">
            ❝ {currentResult.question}
          </p>
          <ResultsTable
            result={currentResult.result}
            sql={currentResult.sql}
            error={currentResult.error}
            clarify={currentResult.clarify}
          />
        </GlassCard>
      )}

      {!currentResult && (
        <GlassCard>
          <div className="text-center py-12 text-slate-500">
            <div className="text-6xl mb-4">◉</div>
            <p>Type your first question above and hit Run Query</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
