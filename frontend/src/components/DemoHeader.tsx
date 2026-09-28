import React, { useState } from 'react';
import { Database, Shield, Zap, Flame, Command, RefreshCw } from 'lucide-react';
import { seedDatabase } from '../api/client';

interface DemoHeaderProps {
  onSeeded: () => void;
  onOpenProactiveModal: () => void;
}

export const DemoHeader: React.FC<DemoHeaderProps> = ({ onSeeded, onOpenProactiveModal }) => {
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      setSeedDone(true);
      onSeeded();
      setTimeout(() => setSeedDone(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to seed Hindsight memory database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0B0F17] sticky top-0 z-40 px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand / System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              IM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-slate-100">IncidentMind</h1>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v2.4-prod
                </span>
              </div>
              <p className="text-[11px] text-slate-400">On-Call Incident Memory & Autonomous Remediation Engine</p>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">HINDSIGHT BANK: ACTIVE</span>
            <span className="text-slate-600">|</span>
            <span>60 HISTORICAL INCIDENTS LOADED</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          
          <button
            onClick={onOpenProactiveModal}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-Deploy Risk Check</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>{seeding ? 'Seeding Memories...' : seedDone ? '✓ 60 Incidents Synced' : 'Seed Hindsight Dataset'}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
