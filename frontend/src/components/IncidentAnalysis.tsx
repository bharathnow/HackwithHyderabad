import React, { useState } from 'react';
import { AnalysisResponse, submitFeedback } from '../api/client';
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle, UserCheck } from 'lucide-react';

interface IncidentAnalysisProps {
  analysis: AnalysisResponse;
  service: string;
  onFeedbackSubmitted: () => void;
}

export const IncidentAnalysis: React.FC<IncidentAnalysisProps> = ({
  analysis,
  service,
  onFeedbackSubmitted,
}) => {
  const [feedbackState, setFeedbackState] = useState<{ [key: number]: 'worked' | 'failed' | null }>({});
  const [loadingFeedback, setLoadingFeedback] = useState<number | null>(null);

  const handleFeedback = async (rank: number, fixTitle: string, outcome: 'worked' | 'failed') => {
    setLoadingFeedback(rank);
    try {
      await submitFeedback(
        `INC-ALERT-${Date.now().toString().slice(-4)}`,
        service,
        fixTitle,
        outcome,
        'On-Call Engineer (You)'
      );
      setFeedbackState((prev) => ({ ...prev, [rank]: outcome }));
      onFeedbackSubmitted();
    } catch (err) {
      console.error(err);
      alert('Failed to submit feedback outcome to Hindsight memory');
    } finally {
      setLoadingFeedback(null);
    }
  };

  return (
    <div className="bg-[#0D1117] rounded-lg border border-[#30363D] overflow-hidden space-y-4 p-4">
      
      {/* Root Cause Header Box */}
      <div className="bg-[#161B22] p-4 rounded-md border border-[#30363D]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">Empirical Root Cause Analysis</h3>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
            <span>Confidence:</span>
            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
              {analysis.confidence}%
            </span>
          </div>
        </div>

        <p className="text-xs font-mono text-slate-300 bg-[#010409] p-3 rounded border border-[#30363D] leading-relaxed">
          {analysis.likely_root_cause}
        </p>
      </div>

      {/* Ranked Runbook Fixes */}
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center justify-between">
          <span>Ranked Remedies (Order of Historical Efficacy)</span>
          <span className="text-[11px] text-slate-500 font-normal">Derived from Hindsight Memory Bank</span>
        </h3>

        <div className="space-y-3">
          {analysis.recommendations.map((rec) => {
            const currentFeedback = feedbackState[rec.rank];
            const isWorking = loadingFeedback === rec.rank;

            return (
              <div
                key={rec.rank}
                className="bg-[#161B22] rounded-md p-4 border border-[#30363D] space-y-3 hover:border-slate-600 transition-all"
              >
                {/* Title and Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-sky-500/10 text-sky-400 font-mono text-xs font-bold flex items-center justify-center border border-sky-500/30">
                      #{rec.rank}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-100">{rec.fix_title}</h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border self-start sm:self-auto ${
                      rec.status_badge.includes('CAUTION') || rec.status_badge.includes('CONFLICTING')
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : rec.status_badge.includes('GENERIC')
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {rec.status_badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{rec.description}</p>

                {/* Efficacy Progress Bar */}
                {analysis.memory_enabled && (
                  <div className="bg-[#010409] p-2.5 rounded border border-[#30363D] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Historical Efficacy Rate:</span>
                      <span className="font-bold text-sky-400">{rec.past_success_rate}% Success</span>
                    </div>

                    <div className="w-full bg-[#161B22] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          rec.past_success_rate >= 80
                            ? 'bg-emerald-400'
                            : rec.past_success_rate >= 50
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${rec.past_success_rate}%` }}
                      />
                    </div>

                    {rec.last_engineer && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 pt-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Resolved by <strong className="text-slate-200">{rec.last_engineer}</strong> in past incidents</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Action Buttons */}
                <div className="pt-2 border-t border-[#30363D] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Feedback Loop (Self-Correct Memory):</span>

                  <div className="flex items-center gap-2">
                    {currentFeedback ? (
                      <div
                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border flex items-center gap-1.5 ${
                          currentFeedback === 'worked'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                        }`}
                      >
                        {currentFeedback === 'worked' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>Retained ({currentFeedback.toUpperCase()})</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleFeedback(rec.rank, rec.fix_title, 'worked')}
                          disabled={isWorking}
                          className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Fix Worked</span>
                        </button>

                        <button
                          onClick={() => handleFeedback(rec.rank, rec.fix_title, 'failed')}
                          disabled={isWorking}
                          className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Fix Failed</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
