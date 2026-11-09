import { useState } from 'react';
import { CircleNotch, CheckCircle, WarningCircle } from '@phosphor-icons/react';
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
      setError('Enter your Groq API key to continue.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.configureAPI(apiKey, model);
      if (result.success) onConnect();
      else setError(result.error || 'Could not verify that key. Check it and try again.');
    } catch (err: any) {
      setError(err.message || 'Could not reach the server. Try again in a moment.');
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
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      <div>
        <h1 className="title">Bring your own key.</h1>
        <p className="lead mt-4 max-w-[34ch]">
          AskSQL uses Groq to write SQL. Your key stays in this session and is only sent to Groq.
        </p>
        <p className="mt-6 text-sm text-ink-2">
          Need one? Create a free key at{' '}
          <a className="font-medium text-accent-ink underline underline-offset-4" href="https://console.groq.com" target="_blank" rel="noreferrer">
            console.groq.com
          </a>
          .
        </p>
      </div>

      <form onSubmit={handleConnect} className="surface p-6 sm:p-8">
        {status.api_connected && (
          <div className="notice notice-ok mb-6" role="status">
            <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 pop" aria-hidden />
            <p>Ready with <strong className="font-semibold">{status.model}</strong>.</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="apikey" className="label">Groq API key</label>
            <input
              id="apikey"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_..."
              disabled={loading || status.api_connected}
              className="field font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="model" className="label">Model</label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={loading || status.api_connected}
              className="field"
            />
            <p className="hint">Works well with openai/gpt-oss-120b or llama3-70b-8192.</p>
          </div>
        </div>

        {error && (
          <div className="notice notice-danger mt-5" role="alert">
            <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-7">
          {!status.api_connected ? (
            <button type="submit" disabled={loading || !apiKey.trim()} className="btn btn-primary">
              {loading && <CircleNotch size={18} weight="bold" className="spin" aria-hidden />}
              {loading ? 'Checking key' : 'Save key'}
            </button>
          ) : (
            <button type="button" onClick={handleClear} disabled={loading} className="btn btn-quiet">
              Remove key
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
