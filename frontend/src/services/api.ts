const API_BASE = 'http://localhost:5001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  async connectDB(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    const response = await fetch(`${API_BASE}/connect-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/disconnect-db`, { method: 'POST' });
    return handleResponse<{ success: boolean; message?: string }>(response);
  },

  async getSchema() {
    const response = await fetch(`${API_BASE}/get-schema`);
    return handleResponse<{
      success: boolean;
      schema_text?: string;
      schema_tables?: Record<string, Array<{ name: string; type: string; tag: string }>>;
      error?: string;
    }>(response);
  },

  async configureAPI(apiKey: string, model: string) {
    const response = await fetch(`${API_BASE}/configure-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/clear-api`, { method: 'POST' });
    return handleResponse<{ success: boolean }>(response);
  },

  async executeQuery(question: string) {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    return handleResponse<{
      success: boolean;
      entry?: QueryHistoryEntry;
      error?: string;
    }>(response);
  },

  async getHistory() {
    const response = await fetch(`${API_BASE}/history`);
    return handleResponse<{
      success: boolean;
      history: QueryHistoryEntry[];
    }>(response);
  },

  async clearHistory() {
    const response = await fetch(`${API_BASE}/clear-history`, { method: 'POST' });
    return handleResponse<{ success: boolean }>(response);
  },

  async getStatus() {
    const response = await fetch(`${API_BASE}/status`);
    return handleResponse<{
      success: boolean;
      db_connected: boolean;
      api_connected: boolean;
      db_name?: string;
      model?: string;
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
