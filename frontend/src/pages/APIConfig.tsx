import { useState } from 'react';
import { Key, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

interface APIConfigProps {
  onConnect: () => void;
  status: {
    api_connected: boolean;
    model?: string;
  };
}

export function APIConfig({ onConnect, status }: APIConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-oss-120b');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.configureAPI(apiKey, model);
      if (result.success) {
        onConnect();
      } else {
        setError(result.error || 'Configuration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Configuration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await api.clearAPI();
      setApiKey('');
      onConnect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-slate-100">
          API Configuration
        </h1>
        <p className="text-slate-400">
          Configure your Groq API key for SQL generation
        </p>
      </div>

      {status.api_connected && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-400">
            API ready — model: <strong>{status.model}</strong>
          </p>
        </div>
      )}

      <GlassCard className="mb-8">
        <form onSubmit={handleConnect}>
          <h3 className="text-lg font-semibold mb-4 text-slate-100">
            Groq API Settings
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_••••••••••••••••••••••••••"
                disabled={loading || status.api_connected}
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-slate-500">
                Get a free key at console.groq.com — no credit card required
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="openai/gpt-oss-120b"
                disabled={loading || status.api_connected}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-slate-500">
                Recommended:{' '}
                <code className="px-1 bg-sky-500/20 rounded text-sky-400">openai/gpt-oss-120b</code>
                {' '}· <code className="px-1 bg-sky-500/20 rounded text-sky-400">llama3-70b-8192</code>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/30">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!status.api_connected ? (
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 bg-sky-500 hover:bg-sky-600 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Save & Connect
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clear'}
              </button>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-500 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2 text-slate-100">
              How it works
            </h4>
            <p className="text-sm text-slate-400">
              Your question + live schema → Groq LLM → raw SQL → executed on your MySQL DB → results shown here.
              <br /><br />
              The key lives only in your browser session and is sent exclusively to the Groq API.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
