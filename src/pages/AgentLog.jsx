import { useState, useEffect, useRef } from 'react';
import { ScrollText, Trash2, Pause, Play } from 'lucide-react';
import { getLogs, clearLogs, subscribe } from '../services/notifierService';

const FILTERS = ['all', 'info', 'success', 'warn', 'error'];
const SOURCE_FILTERS = ['All', 'AgentCore', 'GridConnector', 'WeatherService', 'IoTConnector', 'Optimizer', 'Notifier'];

export default function AgentLog() {
  const [logs, setLogs] = useState(getLogs());
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const update = () => setLogs([...getLogs()]);
    return subscribe(update);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter(l => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (sourceFilter !== 'All' && l.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Agent Log</h2>
          <p>Real-time activity feed from EcoRoute agent services</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className={`btn ${autoScroll ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAutoScroll(!autoScroll)}
            id="btn-autoscroll"
          >
            {autoScroll ? <Pause size={14} /> : <Play size={14} />}
            {autoScroll ? 'Auto' : 'Paused'}
          </button>
          <button className="btn btn-danger" onClick={() => { clearLogs(); setLogs([]); }} id="btn-clear-logs">
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div className="log-filters">
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Level:</span>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`log-filter-btn ${levelFilter === f ? 'active' : ''}`}
                onClick={() => setLevelFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="log-filters">
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Source:</span>
            {SOURCE_FILTERS.map(f => (
              <button
                key={f}
                className={`log-filter-btn ${sourceFilter === f ? 'active' : ''}`}
                onClick={() => setSourceFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ScrollText size={14} style={{ marginRight: 6 }} />
            {filtered.length} entries
          </span>
          <span className="badge blue">{logs.length} total</span>
        </div>
        <div className="log-scroll" ref={scrollRef}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <ScrollText size={48} />
              <h3>No log entries</h3>
              <p>Agent activity will appear here as the optimizer runs.</p>
            </div>
          ) : (
            filtered.map(log => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                <span className="log-timestamp">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                <span className="log-source">[{log.source}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
