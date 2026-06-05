import { X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { QueryHistoryEntry } from '../services/api';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryEntry[];
  onSelect: (entry: QueryHistoryEntry) => void;
  onClear: () => void;
}

export function HistoryModal({ isOpen, onClose, history, onSelect, onClear }: HistoryModalProps) {
  if (!isOpen) return null;

  const reversedHistory = [...history].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden glass-card flex flex-col">
        <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">Query History</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg glass-button text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-3 scrollbar-thin min-h-0">
          {reversedHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No queries yet</p>
            </div>
          ) : (
            reversedHistory.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="w-full p-4 rounded-xl text-left transition-all duration-200 glass-button text-slate-300"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {entry.error ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : entry.clarify ? (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-100">
                      {entry.question}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                      {entry.result && ` · ${entry.result.row_count} rows`}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-6 border-t border-slate-700/50 flex-shrink-0">
            <button
              onClick={onClear}
              className="w-full px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-200"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
