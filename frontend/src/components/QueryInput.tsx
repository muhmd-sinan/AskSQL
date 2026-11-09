import { useRef, useState } from 'react';
import { ArrowUp, CircleNotch } from '@phosphor-icons/react';

interface QueryInputProps {
  onExecute: (question: string) => void;
  loading?: boolean;
  suggestions?: string[];
}

export function QueryInput({ onExecute, loading, suggestions = [] }: QueryInputProps) {
  const [question, setQuestion] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = question.trim().length > 0 && !loading;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (canSend) onExecute(question.trim());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const pick = (text: string) => {
    setQuestion(text);
    ref.current?.focus();
  };

  return (
    <form onSubmit={submit}>
      <label htmlFor="question" className="sr-only">Your question</label>
      <div className="surface relative p-2 transition-shadow focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--accent)_22%,transparent)]">
        <textarea
          id="question"
          ref={ref}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Show all employees in Engineering, highest salary first"
          disabled={loading}
          rows={3}
          className="block w-full resize-none rounded-[20px] bg-transparent px-4 py-3 pr-16 text-lg leading-snug outline-none placeholder:text-ink-3 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={loading ? 'Running your question' : 'Run question'}
          className="btn btn-primary absolute bottom-4 right-4 !min-h-11 !w-11 !p-0"
        >
          {loading ? <CircleNotch size={20} weight="bold" className="spin" /> : <ArrowUp size={20} weight="bold" />}
        </button>
      </div>
      <p className="hint px-2">Press Enter to run. Shift and Enter adds a new line.</p>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Example questions">
          {suggestions.map(s => (
            <button key={s} type="button" className="chip" disabled={loading} onClick={() => pick(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
