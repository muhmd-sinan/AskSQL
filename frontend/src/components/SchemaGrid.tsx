import { Disclosure } from './Disclosure';

type Columns = Array<{ name: string; type: string; tag: string }>;

interface SchemaGridProps {
  schema_tables: Record<string, Columns>;
}

export function SchemaGrid({ schema_tables }: SchemaGridProps) {
  const tables = Object.entries(schema_tables);
  if (tables.length === 0) return null;

  return (
    <div className="divide-y divide-line border-y border-line">
      {tables.map(([name, columns]) => (
        <Disclosure key={name} title={name} meta={`${columns.length} columns`}>
          <ul className="grid gap-x-8 gap-y-1 pb-5 sm:grid-cols-2">
            {columns.map(col => (
              <li key={col.name} className="flex items-baseline justify-between gap-3 py-1 text-sm">
                <span className="flex items-baseline gap-2">
                  <span>{col.name}</span>
                  {col.tag === '[PK]' && <span className="text-xs font-semibold text-accent-ink">Primary key</span>}
                  {col.tag.startsWith('[FK') && <span className="text-xs font-semibold text-accent-ink">Foreign key</span>}
                </span>
                <span className="font-mono text-xs text-ink-3">{col.type.split('(')[0]}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      ))}
    </div>
  );
}
