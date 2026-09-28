import React, { useEffect, useState } from 'react';
import { fetchMemories } from '../api/client';
import { Database, Search, Sparkles, History, Eye, RefreshCw, FileText } from 'lucide-react';

interface MemorySidebarProps {
  recalledMemories?: Array<{ text: string; type: string; score?: number }>;
  hindsightReflection?: string;
  refreshTrigger?: number;
}

export const MemorySidebar: React.FC<MemorySidebarProps> = ({
  recalledMemories = [],
  hindsightReflection = '',
  refreshTrigger = 0,
}) => {
  const [bankMemories, setBankMemories] = useState<Array<{ id: string; text: string; created_at: string }>>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recalled' | 'bank' | 'reflect'>('recalled');

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await fetchMemories();
      setBankMemories(data.memories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [refreshTrigger]);

  const filteredBank = bankMemories.filter((m) =>
    m.text.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full space-y-4">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Hindsight Memory Inspector</h3>
        </div>

        <button
          onClick={loadMemories}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all"
          title="Refresh Hindsight Bank"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('recalled')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'recalled' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Recalled ({recalledMemories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'bank' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3 h-3" />
          <span>Bank ({bankMemories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reflect')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'reflect' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Reflect</span>
        </button>
      </div>

      {/* Tab 1: Recalled Memories */}
      {activeTab === 'recalled' && (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
          {recalledMemories.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic">
              No memories recalled yet. Click "Analyze Alert" to recall Hindsight memories.
            </div>
          ) : (
            recalledMemories.map((mem, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/40 hover:border-cyan-700/60 transition-all space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-cyan-400">
                  <span className="font-bold">Evidence Memory #{idx + 1}</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
                    TEMPR Match
                  </span>
                </div>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {mem.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Hindsight Memory Bank Explorer */}
      {activeTab === 'bank' && (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Hindsight memories..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[440px] pr-1">
            {filteredBank.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No memories found in bank matching query.
              </div>
            ) : (
              filteredBank.map((mem) => (
                <div key={mem.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/70 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400">{mem.id}</span>
                    <span>{mem.created_at ? new Date(mem.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] line-clamp-3">
                    {mem.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Reflect Agentic Synthesis */}
      {activeTab === 'reflect' && (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-800/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hindsight Agentic Reflect Output</span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
              {hindsightReflection || 'Reflect synthesizes mental models across memories to highlight macro trends and past fix efficacy.'}
            </p>
          </div>
        </div>
      )}

    </aside>
  );
};
