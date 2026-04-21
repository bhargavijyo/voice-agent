import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, Activity, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import ChatBubble from './ChatBubble';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  intent?: string;
  tool?: string;
  language?: string;
}

interface ConvState {
  step:   string;
  doctor: string | null;
  date:   string | null;
  time:   string | null;
}

interface VoicePanelProps {
  isCalling:     boolean;
  onToggleCall:  () => void;
  messages:      Message[];
  status:        'idle' | 'listening' | 'processing' | 'speaking';
  onSendMessage: (text: string) => void;
  convState:     ConvState;
}

const STATUS_COLORS: Record<string, string> = {
  idle:       'bg-slate-300',
  listening:  'bg-green-500',
  processing: 'bg-blue-500',
  speaking:   'bg-purple-500',
};

const VoicePanel: React.FC<VoicePanelProps> = ({
  isCalling, onToggleCall, messages, status, onSendMessage, convState
}) => {
  const [timer, setTimer]     = useState(0);
  const inputRef              = useRef<HTMLInputElement>(null);
  const transcriptRef         = useRef<HTMLDivElement>(null);

  // Call timer
  useEffect(() => {
    let id: any;
    if (isCalling) {
      id = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(id);
  }, [isCalling]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (val) {
      onSendMessage(val);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // ── Booking progress bar ──
  const BOOKING_STEPS = ['ask_doctor', 'ask_date', 'ask_time', 'confirm', 'done'];
  const currentStepIdx = BOOKING_STEPS.indexOf(convState.step);
  const isBookingActive = currentStepIdx >= 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">

      {/* ── Header ── */}
      <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]} animate-pulse`} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{status}</span>
          </div>
          {isCalling && (
            <span className="text-sm font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              {formatTime(timer)}
            </span>
          )}
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* ── Booking Progress Bar ── */}
      <AnimatePresence>
        {isBookingActive && convState.step !== 'start' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 py-3 border-b border-slate-50 bg-blue-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Booking in Progress</span>
              <span className="text-[10px] font-mono text-slate-400">step: {convState.step}</span>
            </div>
            <div className="flex gap-3 text-[10px]">
              {[
                { label: 'Doctor', val: convState.doctor },
                { label: 'Date',   val: convState.date },
                { label: 'Time',   val: convState.time },
              ].map(slot => (
                <div key={slot.label} className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                  slot.val ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {slot.val && <CheckCircle2 className="w-3 h-3" />}
                  <span className="font-bold">{slot.label}:</span>
                  <span>{slot.val || '—'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Speaking Waveform ── */}
      <AnimatePresence>
        {status === 'speaking' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-purple-50 flex items-center justify-center gap-1 overflow-hidden flex-shrink-0"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [6, 22, 6] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                className="w-1 bg-purple-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Listening Waveform ── */}
      <AnimatePresence>
        {status === 'listening' && isCalling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 32 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-green-50 flex items-center justify-center gap-1 overflow-hidden flex-shrink-0"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 14, 4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                className="w-1 bg-green-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transcript ── */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 custom-scrollbar min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
            <Activity className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Press the mic to begin a conversation</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} text={msg.text} />
          ))
        )}
      </div>

      {/* ── Input / Controls ── */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">

          {/* Mic / End-call button */}
          <div className="flex items-center gap-10">
            {isCalling && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => { window.speechSynthesis.cancel(); }}
                className="p-4 bg-white shadow-md border border-slate-100 rounded-2xl text-slate-500 hover:text-red-500 transition-colors"
                title="Stop Speaking"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}

            <button
              onClick={onToggleCall}
              className={`relative group transition-all duration-500 active:scale-95 ${isCalling ? 'w-24 h-24' : 'w-20 h-20'}`}
            >
              {/* Glow */}
              <div className={`absolute -inset-4 rounded-full transition-all duration-700 blur-xl ${
                isCalling ? 'bg-red-500/20 opacity-100' : 'bg-primary/20 opacity-0 group-hover:opacity-100'
              }`} />

              <div className={`w-full h-full rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${
                isCalling ? 'bg-red-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
              }`}>
                {isCalling ? <Phone className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
              </div>

              {/* Listening rings */}
              {status === 'listening' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                  <div className="absolute inset-0 border-4 border-green-400 rounded-3xl animate-[ping_1.5s_infinite]" />
                  <div className="absolute inset-0 border-4 border-green-400 rounded-3xl animate-[ping_1.5s_infinite_0.5s]" />
                </div>
              )}
            </button>

            {isCalling && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 bg-white shadow-md border border-slate-100 rounded-2xl flex items-center justify-center text-primary"
              >
                <Activity className="w-5 h-5" />
              </motion.div>
            )}
          </div>

          {/* Text input */}
          <form onSubmit={handleSubmit} className="w-full relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={isCalling ? 'Type a message or speak...' : 'Press mic to start...'}
              disabled={!isCalling}
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-24 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm shadow-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isCalling}
              className="absolute right-3 top-2.5 bottom-2.5 px-4 bg-primary/10 text-primary font-bold text-[10px] rounded-xl hover:bg-primary/20 transition-all uppercase tracking-widest disabled:opacity-30"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoicePanel;
