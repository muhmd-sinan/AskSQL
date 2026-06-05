interface SchemaGridProps {
  schema_tables: Record<string, Array<{ name: string; type: string; tag: string }>>;
  onRefresh?: () => void;
}

export function SchemaGrid({ schema_tables, onRefresh }: SchemaGridProps) {
  const tables = Object.entries(schema_tables);

  if (tables.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">
          Schema Overview
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg text-sm glass-button text-slate-300"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(([tableName, columns]) => (
          <div
            key={tableName}
            className="rounded-xl overflow-hidden glass-card"
          >
            <div className="px-4 py-3 bg-sky-500/10 border-b border-slate-700/50">
              <h4 className="font-semibold text-sky-400 uppercase tracking-wide text-sm">
                {tableName}
              </h4>
            </div>
            <div className="p-4 space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {col.tag === '[PK]' ? (
                      <span className="text-amber-400">🔑</span>
                    ) : col.tag.startsWith('[FK') ? (
                      <span className="text-sky-400">🔗</span>
                    ) : (
                      <span className="text-slate-600">·</span>
                    )}
                    <span className="text-slate-200">
                      {col.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      {col.type.split('(')[0]}
                    </span>
                    {col.tag === '[PK]' && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                        PK
                      </span>
                    )}
                    {col.tag.startsWith('[FK') && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-sky-500/20 text-sky-400">
                        FK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
