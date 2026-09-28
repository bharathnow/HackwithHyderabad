import React, { useState } from 'react';
import { DemoHeader } from './components/DemoHeader';
import { AlertIntake } from './components/AlertIntake';
import { IncidentAnalysis } from './components/IncidentAnalysis';
import { CompareToggle } from './components/CompareToggle';
import { MemorySidebar } from './components/MemorySidebar';
import { LearningCurveChart } from './components/LearningCurveChart';
import { ProactiveWarningModal } from './components/ProactiveWarningModal';
import { analyzeAlert, AnalysisResponse } from './api/client';
import { Sparkles, Layers, Shield } from 'lucide-react';

export function App() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentService, setCurrentService] = useState('payment-gateway');
  const [currentErrorCode, setCurrentErrorCode] = useState('PGW_CONN_POOL_EXHAUSTED');
  const [currentLogSnippet, setCurrentLogSnippet] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProactiveModalOpen, setIsProactiveModalOpen] = useState(false);

  const handleAnalyzeAlert = async (
    service: string,
    error_code: string,
    log_snippet: string,
    memory_enabled: boolean
  ) => {
    setLoading(true);
    setCurrentService(service);
    setCurrentErrorCode(error_code);
    setCurrentLogSnippet(log_snippet);

    try {
      const result = await analyzeAlert(service, error_code, log_snippet, memory_enabled);
      setAnalysis(result);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Alert analysis failed. Ensure backend API server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Demo Header */}
      <DemoHeader
        onSeeded={() => setRefreshTrigger((prev) => prev + 1)}
        onOpenProactiveModal={() => setIsProactiveModalOpen(true)}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Alert Intake, Agent Output, Learning Curve, Compare */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Alert Intake */}
          <AlertIntake onAnalyze={handleAnalyzeAlert} loading={loading} />

          {/* 2. Agent Analysis Result */}
          {analysis && (
            <IncidentAnalysis
              analysis={analysis}
              service={currentService}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          )}

          {/* 3. Before/After Side-by-Side Compare */}
          <CompareToggle
            service={currentService}
            errorCode={currentErrorCode}
            logSnippet={currentLogSnippet}
          />

          {/* 4. Learning Curve Chart */}
          <LearningCurveChart refreshTrigger={refreshTrigger} />

        </div>

        {/* Right Column (4 cols): Hindsight Memory Sidebar */}
        <div className="lg:col-span-4 h-full">
          <MemorySidebar
            recalledMemories={analysis?.recalled_raw_memories || []}
            hindsightReflection={analysis?.hindsight_reflection || ''}
            refreshTrigger={refreshTrigger}
          />
        </div>

      </main>

      {/* Proactive Deploy Risk Modal */}
      <ProactiveWarningModal
        isOpen={isProactiveModalOpen}
        onClose={() => setIsProactiveModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        IncidentMind • Built with Hindsight Memory (Vectorize) & Groq LLM • Fintech Payments On-Call Response
      </footer>
    </div>
  );
}

export default App;
