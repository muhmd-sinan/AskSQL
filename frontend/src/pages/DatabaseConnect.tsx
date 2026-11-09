import { useEffect, useState } from 'react';
import { ArrowRight, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { SchemaGrid } from '../components/SchemaGrid';
import { HeroDemo } from '../components/HeroDemo';
import { Reveal } from '../components/Reveal';
import { Disclosure } from '../components/Disclosure';
import { api } from '../services/api';

interface DatabaseConnectProps {
  onConnect: () => void;
  onDemoStarted: () => Promise<void>;
  onAsk: () => void;
  status: {
    db_connected: boolean;
    db_name?: string;
    is_demo?: boolean;
    demo_available?: boolean;
    custom_db_allowed?: boolean;
    demo_remaining?: number | null;
  };
  schema_tables: Record<string, Array<{ name: string; type: string; tag: string }>>;
}

const STEPS = [
  { title: 'Reads your schema', body: 'Table and column names, types, and keys are sent along with your question.' },
  { title: 'Writes one statement', body: 'The model returns a single MySQL query, or asks you to clarify when the question is vague.' },
  { title: 'Runs it and shows the rows', body: 'You see the SQL, the result table, and can export it as CSV.' },
];

export function DatabaseConnect({ onConnect, onDemoStarted, onAsk, status, schema_tables }: DatabaseConnectProps) {
  const [formData, setFormData] = useState({ host: 'localhost', port: '3306', user: 'root', password: '', database: 'company_db' });
  const [loading, setLoading] = useState<'demo' | 'custom' | 'off' | null>(null);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The free server sleeps when idle. Say so if connecting takes a while.
  useEffect(() => {
    if (loading !== 'demo') { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  const customAllowed = status.custom_db_allowed ?? true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStartDemo = async () => {
    setLoading('demo');
    setError(null);
    try {
      await api.startDemo();
      await onDemoStarted();
    } catch (err: any) {
      setError(err.message || 'Could not start the demo. Try again in a moment.');
    } finally {
      setLoading(null);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('custom');
    setError(null);
    try {
      const result = await api.connectDB({
        host: formData.host,
        port: parseInt(formData.port),
        user: formData.user,
        password: formData.password,
        database: formData.database,
      });
      if (result.success) onConnect();
      else setError(result.error || 'Connection failed. Check the details and try again.');
    } catch (err: any) {
      setError(err.message || 'Connection failed. Check the details and try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async () => {
    setLoading('off');
    try {
      await api.disconnectDB();
      onConnect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const field = (name: keyof typeof formData, label: string, type = 'text') => (
    <div>
      <label htmlFor={`db-${name}`} className="label">{label}</label>
      <input
        id={`db-${name}`}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        disabled={loading !== null || status.db_connected}
        autoComplete={type === 'password' ? 'current-password' : 'off'}
        className="field"
      />
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="lg:pb-6">
          <h1 className="display rise" style={{ ['--i' as string]: 0 }}>
            Ask your database. In plain English.
          </h1>
          <p className="lead rise mt-6 max-w-[38ch]" style={{ ['--i' as string]: 1 }}>
            Type a question. AskSQL writes the MySQL, runs it, and shows you the rows.
          </p>

          <div className="rise mt-9 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ ['--i' as string]: 2 }}>
            {status.db_connected ? (
              <>
                <button type="button" className="btn btn-primary" onClick={onAsk}>
                  Ask a question <ArrowRight size={18} weight="bold" aria-hidden />
                </button>
                <button type="button" className="btn-link" onClick={handleDisconnect} disabled={loading !== null}>
                  {loading === 'off' ? 'Disconnecting' : 'Disconnect'}
                </button>
              </>
            ) : status.demo_available ? (
              <>
                <button type="button" className="btn btn-primary" onClick={handleStartDemo} disabled={loading !== null}>
                  {loading === 'demo' ? (
                    <><CircleNotch size={18} weight="bold" className="spin" aria-hidden /> Connecting</>
                  ) : (
                    <>Try the demo <ArrowRight size={18} weight="bold" aria-hidden /></>
                  )}
                </button>
                {customAllowed && (
                  <a className="btn-link" href="#own-database">Use your own database</a>
                )}
              </>
            ) : customAllowed ? (
              <a className="btn btn-primary" href="#own-database">Connect a database</a>
            ) : (
              <p className="text-ink-2">The demo is unavailable right now. Please check back soon.</p>
            )}
          </div>

          <div aria-live="polite" className="mt-5 min-h-[3.5rem] max-w-[46ch]">
            {slow && loading === 'demo' && (
              <p className="text-sm text-ink-2">
                Waking the server. The first start after a quiet spell can take up to a minute.
              </p>
            )}
            {error && !customAllowed && (
              <div className="notice notice-danger" role="alert">
                <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rise" style={{ ['--i' as string]: 3 }}>
          <HeroDemo />
        </div>
      </section>

      {/* How it works */}
      <section className="mt-28 grid gap-10 border-t border-line pt-16 lg:grid-cols-[1fr_1.4fr] lg:gap-20 sm:mt-40">
        <Reveal>
          <h2 className="title lg:sticky lg:top-24">What happens when you ask.</h2>
        </Reveal>
        <ol className="space-y-12">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} index={i}>
              <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="lead mt-2 max-w-[44ch]">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Schema, once connected */}
      {status.db_connected && Object.keys(schema_tables).length > 0 && (
        <section className="mt-28 sm:mt-40">
          <Reveal>
            <h2 className="title">
              What is inside {status.db_name ?? 'the database'}.
            </h2>
          </Reveal>
          <Reveal className="mt-8" index={1}>
            <SchemaGrid schema_tables={schema_tables} />
          </Reveal>
        </section>
      )}

      {/* Own database */}
      {customAllowed && (
        <section id="own-database" className="mt-28 sm:mt-40">
          <Reveal>
            <div className="border-y border-line">
              <Disclosure title="Connect your own MySQL database" defaultOpen={!status.demo_available}>
                <form onSubmit={handleConnect} className="pb-8">
                  <p className="mb-6 max-w-[52ch] text-ink-2">
                    Your credentials are used to open one connection for this session. They are not saved.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {field('host', 'Host')}
                    {field('port', 'Port')}
                    {field('user', 'Username')}
                    {field('password', 'Password', 'password')}
                    <div className="sm:col-span-2">{field('database', 'Database name')}</div>
                  </div>

                  {error && (
                    <div className="notice notice-danger mt-5" role="alert">
                      <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                      <p>{error}</p>
                    </div>
                  )}

                  {!status.db_connected && (
                    <button type="submit" disabled={loading !== null} className="btn btn-primary mt-7">
                      {loading === 'custom' && <CircleNotch size={18} weight="bold" className="spin" aria-hidden />}
                      {loading === 'custom' ? 'Connecting' : 'Connect'}
                    </button>
                  )}
                </form>
              </Disclosure>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
