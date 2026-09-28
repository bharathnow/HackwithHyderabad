import React, { useState } from 'react';
import { AnalysisResponse, analyzeAlert } from '../api/client';
import { GitCompare, Sparkles, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface CompareToggleProps {
  service: string;
  errorCode: string;
  logSnippet: string;
}

export const CompareToggle: React.FC<CompareToggleProps> = ({ service, errorCode, logSnippet }) => {
  const [genericData, setGenericData] = useState<AnalysisResponse | null>(null);
  const [memoryData, setMemoryData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunComparison = async () => {
    setLoading(true);
    try {
      const [genericRes, memoryRes] = await Promise.all([
        analyzeAlert(service, errorCode, logSnippet, false),
        analyzeAlert(service, errorCode, logSnippet, true),
      ]);
      setGenericData(genericRes);
      setMemoryData(memoryRes);
    } catch (err) {
      console.error(err);
      alert('Comparison analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Before / After Memory Comparison</h3>
            <p className="text-xs text-slate-400">See generic LLM answer vs IncidentMind Hindsight-infused answer side-by-side</p>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-indigo-950/50 flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>{loading ? 'Running Side-by-Side...' : 'Compare Memory OFF vs ON'}</span>
        </button>
      </div>

      {(genericData && memoryData) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Left: Memory OFF (Generic) */}
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Memory OFF (Generic LLM)
              </span>
              <span className="text-xs text-slate-400 font-mono">Confidence: {genericData.confidence}%</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Generic Root Cause:</h4>
              <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {genericData.likely_root_cause}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Generic Recommendation:</h4>
              {genericData.recommendations.map((rec, i) => (
                <div key={i} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1 mb-2">
                  <div className="font-bold text-slate-200">{rec.fix_title}</div>
                  <div className="text-slate-400">{rec.description}</div>
                  <div className="text-[11px] text-amber-400/80 italic">No past historical track record or organizational context.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Memory ON (Hindsight) */}
          <div className="bg-slate-950 rounded-xl p-5 border border-cyan-500/40 shadow-lg shadow-cyan-950/30 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Memory ON (IncidentMind + Hindsight)</span>
              </span>
              <span className="text-xs text-cyan-400 font-mono font-bold">Confidence: {memoryData.confidence}%</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Empirical Root Cause (Recalled Evidence):</h4>
              <p className="text-xs text-slate-200 font-mono bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/40">
                {memoryData.likely_root_cause}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">Top Ranked Historical Fix:</h4>
              {memoryData.recommendations.slice(0, 1).map((rec, i) => (
                <div key={i} className="bg-cyan-950/20 p-3 rounded-lg border border-cyan-800/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white">{rec.fix_title}</div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                      {rec.past_success_rate}% Success Rate
                    </span>
                  </div>
                  <div className="text-slate-300">{rec.description}</div>
                  <div className="text-[11px] text-cyan-300 italic">Resolved by {rec.last_engineer} in past outages.</div>
                </div>
              ))}
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400">Click "Compare Memory OFF vs ON" to execute side-by-side analysis on the current alert.</p>
        </div>
      )}

    </div>
  );
};
