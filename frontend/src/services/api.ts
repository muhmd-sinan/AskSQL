const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5001/api';

// Each browser gets its own server-side session, so visitors never share a connection.
function getSessionId(): string {
  let id = localStorage.getItem('asksql_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('asksql_session_id', id);
  }
  return id;
}

function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      'X-Session-Id': getSessionId(),
    },
  });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = {
  async startDemo() {
    const response = await apiFetch('/start-demo', { method: 'POST' });
    return handleResponse<{ success: boolean; message?: string; error?: string }>(response);
  },

  async connectDB(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    const response = await apiFetch('/connect-db', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(config),
    });
    return handleResponse<{
      success: boolean;
      schema_text?: string;
      schema_tables?: Record<string, Array<{ name: string; type: string; tag: string }>>;
      message?: string;
      error?: string;
    }>(response);
  },

  async disconnectDB() {
    const response = await apiFetch('/disconnect-db', { method: 'POST' });
    return handleResponse<{ success: boolean; message?: string }>(response);
  },

  async getSchema() {
    const response = await apiFetch('/get-schema');
    return handleResponse<{
      success: boolean;
      schema_text?: string;
      schema_tables?: Record<string, Array<{ name: string; type: string; tag: string }>>;
      error?: string;
    }>(response);
  },

  async configureAPI(apiKey: string, model: string) {
    const response = await apiFetch('/configure-api', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ api_key: apiKey, model }),
    });
    return handleResponse<{
      success: boolean;
      message?: string;
      model?: string;
      error?: string;
    }>(response);
  },

  async clearAPI() {
    const response = await apiFetch('/clear-api', { method: 'POST' });
    return handleResponse<{ success: boolean }>(response);
  },

  async executeQuery(question: string) {
    const response = await apiFetch('/query', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ question }),
    });
    return handleResponse<{
      success: boolean;
      entry?: QueryHistoryEntry;
      error?: string;
    }>(response);
  },

  async getHistory() {
    const response = await apiFetch('/history');
    return handleResponse<{
      success: boolean;
      history: QueryHistoryEntry[];
    }>(response);
  },

  async clearHistory() {
    const response = await apiFetch('/clear-history', { method: 'POST' });
    return handleResponse<{ success: boolean }>(response);
  },

  async getStatus() {
    const response = await apiFetch('/status');
    return handleResponse<{
      success: boolean;
      db_connected: boolean;
      api_connected: boolean;
      db_name?: string;
      model?: string;
      is_demo?: boolean;
      demo_available?: boolean;
      custom_db_allowed?: boolean;
      demo_remaining?: number | null;
    }>(response);
  },
};

export interface QueryHistoryEntry {
  id: string;
  question: string;
  sql: string | null;
  result: {
    query: string;
    with_rows: boolean;
    columns: string[];
    rows: any[][];
    row_count: number;
    message: string;
  } | null;
  clarify: string | null;
  error: string | null;
  timestamp: string;
}
