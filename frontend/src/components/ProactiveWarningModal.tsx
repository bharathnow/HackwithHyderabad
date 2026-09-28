import React, { useState } from 'react';
import { evaluateProactiveWarning, ProactiveWarningResponse } from '../api/client';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, Zap } from 'lucide-react';

interface ProactiveWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPLOY_PRESETS = [
  'Increasing Postgres max_connections to 500 in payment-gateway service and disabling PgBouncer',
  'Updating NPCI mTLS client certificate rotation policy in upi-switch without rolling pods',
  'Executing batch merchant balance updates in ledger-service without ordering merchant IDs'
];

export const ProactiveWarningModal: React.FC<ProactiveWarningModalProps> = ({ isOpen, onClose }) => {
  const [deployDesc, setDeployDesc] = useState(DEPLOY_PRESETS[0]);
  const [warningResult, setWarningResult] = useState<ProactiveWarningResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await evaluateProactiveWarning(deployDesc);
      setWarningResult(res);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate proactive deployment risk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Proactive Deployment Safety Guard</h3>
              <p className="text-xs text-slate-400">Recall past incident memories for similar changes before deploying</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input & Presets */}
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Select or Describe Proposed Deployment Change:</span>
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {DEPLOY_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDeployDesc(p)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
                >
                  Preset #{idx + 1}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={deployDesc}
              onChange={(e) => setDeployDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Recalling Past Deploy Outages...' : 'Analyze Deployment Risk against Hindsight Memory'}
          </button>
        </form>

        {/* Result Card */}
        {warningResult && (
          <div className="bg-slate-950 rounded-xl p-5 border border-amber-800/60 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-bold text-white">Risk Evaluation Output</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Risk Score:</span>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-700">
                  {warningResult.risk_level} ({warningResult.risk_score}%)
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Historical Risk Summary:</h4>
              <p className="text-xs text-slate-200 font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {warningResult.summary}
              </p>
            </div>

            {warningResult.similar_past_incidents && warningResult.similar_past_incidents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Matching Past Outages:</h4>
                <div className="flex flex-wrap gap-2">
                  {warningResult.similar_past_incidents.map((incId, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {incId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Preventative Action Plan:</h4>
              <div className="space-y-1.5">
                {warningResult.preventative_recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
