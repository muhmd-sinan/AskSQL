import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface QueryInputProps {
  onExecute: (question: string) => void;
  loading?: boolean;
}

export function QueryInput({ onExecute, loading }: QueryInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (question.trim() && !loading) {
      onExecute(question.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Show all employees in Engineering sorted by salary descending"
        disabled={loading}
        className="w-full h-32 px-4 py-3 rounded-xl resize-none font-sans text-base bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed scrollbar-thin"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-sky-500 hover:bg-sky-600 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Query
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setQuestion('')}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl glass-button text-slate-300"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
