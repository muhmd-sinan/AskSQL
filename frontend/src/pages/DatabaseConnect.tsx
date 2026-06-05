import { useState } from 'react';
import { Database, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { SchemaGrid } from '../components/SchemaGrid';
import { api } from '../services/api';

interface DatabaseConnectProps {
  onConnect: () => void;
  status: {
    db_connected: boolean;
    db_name?: string;
  };
  schema_tables: Record<string, Array<{ name: string; type: string; tag: string }>>;
}

export function DatabaseConnect({ onConnect, status, schema_tables }: DatabaseConnectProps) {
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234',
    database: 'company_db',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.connectDB({
        host: formData.host,
        port: parseInt(formData.port),
        user: formData.user,
        password: formData.password,
        database: formData.database,
      });

      if (result.success) {
        onConnect();
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.disconnectDB();
      onConnect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-slate-100">
          Database Connection
        </h1>
        <p className="text-slate-400">
          Connect to your MySQL database to get started
        </p>
      </div>

      {status.db_connected && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-400">
            Connected to <strong>{status.db_name}</strong>
          </p>
        </div>
      )}

      <GlassCard className="mb-8">
        <form onSubmit={handleConnect}>
          <h3 className="text-lg font-semibold mb-4 text-slate-100">
            Connection Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Host
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                disabled={loading || status.db_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Port
              </label>
              <input
                type="text"
                name="port"
                value={formData.port}
                onChange={handleChange}
                disabled={loading || status.db_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Username
              </label>
              <input
                type="text"
                name="user"
                value={formData.user}
                onChange={handleChange}
                disabled={loading || status.db_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || status.db_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Database Name
              </label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                disabled={loading || status.db_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/30">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!status.db_connected ? (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-sky-500 hover:bg-sky-600 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
              </button>
            )}
          </div>
        </form>
      </GlassCard>

      {status.db_connected && Object.keys(schema_tables).length > 0 && (
        <SchemaGrid schema_tables={schema_tables} />
      )}
    </div>
  );
}
