import { useEffect, useRef } from 'react';
import { X, CheckCircle, WarningCircle, Question, Clock } from '@phosphor-icons/react';
import type { QueryHistoryEntry } from '../services/api';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryEntry[];
  onSelect: (entry: QueryHistoryEntry) => void;
  onClear: () => void;
}

// The server sends UTC timestamps without a zone suffix.
const toDate = (ts: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : `${ts}Z`);

export function HistoryDrawer({ isOpen, onClose, history, onSelect, onClear }: HistoryDrawerProps) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement;
    const t = setTimeout(() => closeBtn.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, onClose]);

  const items = [...history].reverse();

  return (
    <>
      <div className="drawer-backdrop" data-open={isOpen} onClick={onClose} aria-hidden />
      <aside className="drawer" data-open={isOpen} role="dialog" aria-modal="true" aria-label="Query history" inert={!isOpen}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl font-semibold tracking-tight">History</h2>
          <button ref={closeBtn} type="button" onClick={onClose} className="icon-btn" aria-label="Close history">
            <X size={22} />
          </button>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {items.length === 0 ? (
            <div className="px-4 py-16 text-center text-ink-2">
              <Clock size={40} className="mx-auto mb-3 text-ink-3" aria-hidden />
              <p className="font-medium">Nothing here yet</p>
              <p className="mt-1 text-sm text-ink-3">Questions you ask will show up here.</p>
            </div>
          ) : (
            <ul>
              {items.map((entry, i) => (
                <li key={entry.id || i} className="row-in" style={{ ['--i' as string]: i }}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-sunken active:scale-[0.99]"
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      {entry.error ? (
                        <WarningCircle size={20} weight="fill" className="text-danger" />
                      ) : entry.clarify ? (
                        <Question size={20} weight="fill" className="text-accent-ink" />
                      ) : (
                        <CheckCircle size={20} weight="fill" className="text-ok" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium">{entry.question}</span>
                      <span className="mt-0.5 block text-sm text-ink-3">
                        {toDate(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        {entry.result && `, ${entry.result.row_count} ${entry.result.row_count === 1 ? 'row' : 'rows'}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line p-4">
            <button type="button" onClick={onClear} className="btn btn-quiet w-full text-danger">
              Clear history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
