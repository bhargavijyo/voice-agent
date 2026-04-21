import React, { useState } from 'react';
import { Zap, Brain, Code, Terminal, ChevronDown, ChevronUp, Clock, Activity, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConvState {
  step:   string;
  doctor: string | null;
  date:   string | null;
  time:   string | null;
}

interface LogsPanelProps {
  intent?:           string;
  tool?:             string;
  latencyBreakdown?: { stt: number; llm: number; tts: number; total: number };
  reasoningTrace?:   string;
  sessionId?:        string;
  convState?:        ConvState;
}

const LogsPanel: React.FC<LogsPanelProps> = ({
  intent, tool, latencyBreakdown, reasoningTrace, sessionId, convState
}) => {
  const [showReasoning, setShowReasoning] = useState(true);

  const latencyStats = [
    { label: 'STT Processing', val: latencyBreakdown?.stt || 0, color: 'bg-blue-400',   max: 200 },
    { label: 'LLM Reasoning',  val: latencyBreakdown?.llm || 0, color: 'bg-purple-400', max: 2000 },
    { label: 'TTS Synthesis',  val: latencyBreakdown?.tts || 0, color: 'bg-emerald-400',max: 300 },
  ];

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-4 h-full overflow-y-auto custom-scrollbar">

      {/* ── AI Intelligence Card ── */}
      <div className="glass-card p-6 flex flex-col gap-4 rounded-3xl">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Zap className="w-3 h-3 text-amber-500 fill-current" /> AI Intelligence
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Intent</span>
            <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs font-bold font-mono capitalize">
              {intent || 'awaiting...'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tool Triggered</span>
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold font-mono flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {tool || 'none'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Session Info ── */}
      {sessionId && (
        <div className="glass-card px-5 py-4 rounded-2xl flex items-center gap-3">
          <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session ID</p>
            <p className="text-[10px] font-mono text-slate-600 truncate">{sessionId}</p>
          </div>
        </div>
      )}

      {/* ── Conversation State ── */}
      {convState && convState.step !== 'start' && (
        <div className="glass-card p-5 rounded-3xl flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Brain className="w-3 h-3 text-indigo-500" /> Booking State
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Step',   val: convState.step   },
              { label: 'Doctor', val: convState.doctor },
              { label: 'Date',   val: convState.date   },
              { label: 'Time',   val: convState.time   },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                <p className={`text-[10px] font-bold mt-0.5 ${val ? 'text-slate-800' : 'text-slate-300'}`}>
                  {val || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Latency Breakdown ── */}
      <div className="glass-card p-6 flex flex-col gap-4 rounded-3xl">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Clock className="w-3 h-3 text-primary" /> Latency
        </h3>
        <div className="flex flex-col gap-4">
          {latencyStats.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-500">{item.label}</span>
                <span className="text-slate-800">{item.val}ms</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (item.val / item.max) * 100)}%` }}
                  transition={{ duration: 0.4 }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
            </div>
          ))}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total Roundtrip</span>
            <span className={`text-sm font-bold font-mono ${(latencyBreakdown?.total || 0) < 450 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {latencyBreakdown?.total || 0}ms
            </span>
          </div>
        </div>
      </div>

      {/* ── Reasoning Trace ── */}
      <div className="flex-1 glass-card flex flex-col rounded-3xl overflow-hidden min-h-[120px]">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-all border-b border-white/40 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-slate-800">Reasoning Trace</span>
          </div>
          {showReasoning ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <AnimatePresence>
          {showReasoning && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="m-3 rounded-2xl bg-white border border-slate-100 shadow-inner p-4 font-mono max-h-[200px] overflow-y-auto custom-scrollbar">
                <div className="flex gap-2">
                  <Terminal className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    <span className="text-primary font-bold">thought: </span>
                    {reasoningTrace || 'Healthcare reasoning engine ready — awaiting user input.'}
                  </p>
                </div>

                {tool && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 bg-slate-900 p-3 rounded-xl border border-slate-800"
                  >
                    <div className="flex gap-2">
                      <Code className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase block mb-1">Tool Executed</span>
                        <pre className="text-[9px] text-slate-400 whitespace-pre-wrap break-all leading-tight">
{`{
  "tool": "${tool}",
  "status": "success"
}`}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default LogsPanel;
