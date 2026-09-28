import React, { useState } from 'react';
import { Terminal, Play, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';

interface AlertIntakeProps {
  onAnalyze: (service: str, error_code: str, log_snippet: str, memory_enabled: boolean) => void;
  loading: boolean;
}

const PRESETS = [
  {
    name: 'PGW: DB Pool Exhaustion',
    service: 'payment-gateway',
    error_code: 'PGW_CONN_POOL_EXHAUSTED',
    log: 'org.postgresql.util.PSQLException: FATAL: sorry, too many clients already\n\tat com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)\n\tat com.fintech.gateway.db.TransactionRepository.save(TransactionRepository.java:45)'
  },
  {
    name: 'UPI: NPCI ACK Timeout',
    service: 'upi-switch',
    error_code: 'UPI_NPCI_ACK_TIMEOUT',
    log: 'ERROR [upi-connector-2] c.f.u.NPCIClient: mTLS handshake failed: SSLHandshakeException: Received fatal alert: certificate_expired for npci.h2h.org'
  },
  {
    name: 'Ledger: DB Deadlock',
    service: 'ledger-service',
    error_code: 'LEDGER_DB_DEADLOCK_40001',
    log: 'ERROR: deadlock detected\nDETAIL: Process 18402 waits for ShareLock on transaction 881023; blocked by process 18409.\nProcess 18409 waits for ExclusiveLock on relation balance_journal.'
  },
  {
    name: 'Auth: Redis OOM Leak',
    service: 'auth-service',
    error_code: 'AUTH_REDIS_OOM_LEAK',
    log: 'OOM command not allowed when used memory > maxmemory\nredis.clients.jedis.exceptions.JedisDataException: ERR command not allowed under OOM memory condition'
  }
];

export const AlertIntake: React.FC<AlertIntakeProps> = ({ onAnalyze, loading }) => {
  const [service, setService] = useState('payment-gateway');
  const [errorCode, setErrorCode] = useState('PGW_CONN_POOL_EXHAUSTED');
  const [logSnippet, setLogSnippet] = useState(PRESETS[0].log);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setService(preset.service);
    setErrorCode(preset.error_code);
    setLogSnippet(preset.log);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(service, errorCode, logSnippet, memoryEnabled);
  };

  return (
    <div className="bg-[#0D1117] rounded-lg border border-[#30363D] overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-[#161B22] px-4 py-3 border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wide">Alert Intake Console</h2>
        </div>

        {/* Memory Mode Switch */}
        <button
          type="button"
          onClick={() => setMemoryEnabled(!memoryEnabled)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
            memoryEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {memoryEnabled ? (
            <>
              <ToggleRight className="w-4 h-4 text-emerald-400" />
              <span>Hindsight Memory: ON</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-slate-500" />
              <span>Hindsight Memory: OFF (Generic)</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Preset Selector Chips */}
        <div>
          <span className="block text-[11px] font-mono text-slate-400 mb-2">Simulate Outage Alert (Click Preset):</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#161B22] hover:bg-[#21262D] text-slate-300 hover:text-white border border-[#30363D] transition-all flex items-center gap-1.5"
              >
                <Play className="w-2.5 h-2.5 text-sky-400" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="payment-gateway">payment-gateway</option>
                <option value="upi-switch">upi-switch</option>
                <option value="ledger-service">ledger-service</option>
                <option value="auth-service">auth-service</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Error Signature / Code</label>
              <input
                type="text"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Raw Log Snippet & Stack Trace</label>
            <textarea
              rows={4}
              value={logSnippet}
              onChange={(e) => setLogSnippet(e.target.value)}
              className="w-full bg-[#010409] border border-[#30363D] rounded p-3 text-xs font-mono text-emerald-400 focus:border-sky-500 focus:outline-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Recalling Hindsight Memories...</span>
            ) : (
              <>
                <span>Run Agentic Triage (Recall & Rank Fixes)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
