import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HistoryModal } from './components/HistoryModal';
import { DatabaseConnect } from './pages/DatabaseConnect';
import { APIConfig } from './pages/APIConfig';
import { QueryInterface } from './pages/QueryInterface';
import { api, type QueryHistoryEntry } from './services/api';

type Page = 'db' | 'api' | 'query';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('db');
  const [status, setStatus] = useState({
    db_connected: false,
    api_connected: false,
    db_name: undefined as string | undefined,
    model: undefined as string | undefined,
  });
  const [schemaTables, setSchemaTables] = useState<Record<string, Array<{ name: string; type: string; tag: string }>>>({});
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QueryHistoryEntry | null>(null);

  const fetchStatus = async () => {
    try {
      const result = await api.getStatus();
      if (result.success) {
        setStatus({
          db_connected: result.db_connected,
          api_connected: result.api_connected,
          db_name: result.db_name,
          model: result.model,
        });
      }
    } catch (err) {
      console.error('Status fetch failed:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const result = await api.getHistory();
      if (result.success) {
        setHistory(result.history);
      }
    } catch (err) {
      console.error('History fetch failed:', err);
    }
  };

  const fetchSchema = async () => {
    if (status.db_connected) {
      try {
        const result = await api.getSchema();
        if (result.success && result.schema_tables) {
          setSchemaTables(result.schema_tables);
        }
      } catch (err) {
        console.error('Schema fetch failed:', err);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (status.db_connected) {
      fetchSchema();
    }
  }, [status.db_connected]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    setSelectedEntry(null);
  };

  const handleShowHistory = () => {
    fetchHistory();
    setShowHistory(true);
  };

  const handleSelectHistory = (entry: QueryHistoryEntry) => {
    setSelectedEntry(entry);
    setShowHistory(false);
    setCurrentPage('query');
  };

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Clear history failed:', err);
    }
  };

  const handleQueryExecuted = () => {
    fetchStatus();
    fetchSchema();
    fetchHistory();
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        status={status}
        onShowHistory={handleShowHistory}
      >
        {currentPage === 'db' && (
          <DatabaseConnect
            onConnect={handleQueryExecuted}
            status={{ db_connected: status.db_connected, db_name: status.db_name }}
            schema_tables={schemaTables}
          />
        )}
        {currentPage === 'api' && (
          <APIConfig
            onConnect={handleQueryExecuted}
            status={{ api_connected: status.api_connected, model: status.model }}
          />
        )}
        {currentPage === 'query' && (
          <QueryInterface
            status={status}
            schema_tables={schemaTables}
            onQueryExecuted={handleQueryExecuted}
            selectedEntry={selectedEntry}
          />
        )}
      </Layout>

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
      />
    </>
  );
}

export default App;
