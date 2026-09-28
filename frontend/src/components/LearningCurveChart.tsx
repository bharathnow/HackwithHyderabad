import React, { useEffect, useState } from 'react';
import { fetchStats, LearningCurveStats } from '../api/client';
import { TrendingUp, Award, Zap, Activity } from 'lucide-react';

interface LearningCurveChartProps {
  refreshTrigger?: number;
}

export const LearningCurveChart: React.FC<LearningCurveChartProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<LearningCurveStats | null>(null);

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  if (!stats || !stats.points || stats.points.length === 0) {
    return null;
  }

  const points = stats.points;
  const maxVal = 100;
  const minVal = 30;

  // SVG Line Path calculation
  const width = 600;
  const height = 140;
  const padding = 20;

  const getX = (idx: number) => {
    if (points.length <= 1) return width / 2;
    return padding + (idx / (points.length - 1)) * (width - padding * 2);
  };

  const getY = (val: number) => {
    const clamped = Math.min(Math.max(val, minVal), maxVal);
    return height - padding - ((clamped - minVal) / (maxVal - minVal)) * (height - padding * 2);
  };

  const pathD = points.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.success_rate);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
      
      {/* Top Banner Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Agent Learning Curve</h3>
            <p className="text-xs text-slate-400">First-Suggestion Success Rate Improvement over Time</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/60">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Current Efficacy:</span>
            <span className="font-bold text-emerald-300">{stats.current_success_rate}%</span>
          </div>

          <div className="flex items-center gap-1.5 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/60">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">Net Improvement:</span>
            <span className="font-bold text-cyan-300">+{stats.improvement_pct}%</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Graphic */}
      <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800/80">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          
          {/* Grid lines */}
          {[40, 60, 80, 100].map((val) => (
            <line
              key={val}
              x1={padding}
              y1={getY(val)}
              x2={width - padding}
              y2={getY(val)}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
          ))}

          {/* Fill Gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#chartGradient)" />
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt, i) => {
            const cx = getX(i);
            const cy = getY(pt.success_rate);
            return (
              <g key={i} className="group cursor-pointer">
                <circle cx={cx} cy={cy} r="5" className="fill-cyan-400 stroke-slate-950 stroke-2 group-hover:r-7 transition-all" />
                <title>{`Interaction ${pt.interaction}: ${pt.success_rate}% success rate (${pt.outcome})`}</title>
              </g>
            );
          })}

        </svg>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 font-mono border-t border-slate-900">
          <span>Interaction #1 (Baseline 45%)</span>
          <span>Hindsight Memory Consolidation</span>
          <span>Latest Interaction ({stats.current_success_rate}%)</span>
        </div>
      </div>

    </div>
  );
};
