import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Activity, Play, ArrowLeft, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import VoicePanel from './components/VoicePanel';
import LogsPanel from './components/LogsPanel';
import LandingPage from './LandingPage';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  intent?: string;
  tool?: string;
  language?: string;
}

interface LatencyBreakdown {
  stt: number;
  llm: number;
  tts: number;
  total: number;
}

interface ConvState {
  step: string;
  doctor: string | null;
  date: string | null;
  time: string | null;
}

// ─────────────────────────────────────────
// App
// ─────────────────────────────────────────

const App = () => {
  const [showDemo,          setShowDemo]         = useState(false);
  const [isCalling,         setIsCalling]        = useState(false);
  const [messages,          setMessages]         = useState<Message[]>([]);
  const [status,            setStatus]           = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [lastAgentData,     setLastAgentData]    = useState<any>({});
  const [latencyBreakdown,  setLatencyBreakdown] = useState<LatencyBreakdown>({ stt: 0, llm: 0, tts: 0, total: 0 });
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [convState,         setConvState]        = useState<ConvState>({ step: 'start', doctor: null, date: null, time: null });
  const [sessionId,         setSessionId]        = useState<string>('');

  const wsRef          = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  // Track calling state in a ref so callbacks always see the current value
  const isCallingRef   = useRef(false);

  const patient = {
    name:          'Alex Johnson',
    id:            'PT-8821-X',
    preferredLang: 'EN | HI | TA',
    lastVisit:     '2024-04-12',
  };

  // ─────────────────────────────────────────
  // TTS (SpeechSynthesis)
  // ─────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text); // ← fixed: was SpeechUtterance
    utterance.rate   = 1.0;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Prefer a natural English voice if available
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) || voices[0];
      if (preferred) utterance.voice = preferred;
    };
    loadVoices();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
    }

    utterance.onstart = () => setStatus('speaking');

    utterance.onend = () => {
      if (isCallingRef.current) {
        setStatus('listening');
        // Restart STT after AI finishes speaking
        try {
          recognitionRef.current?.start();
        } catch (_) {
          // Ignore "already started" errors
        }
      }
    };

    utterance.onerror = () => {
      if (isCallingRef.current) setStatus('listening');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // ─────────────────────────────────────────
  // STT (Web Speech API)
  // ─────────────────────────────────────────

  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous      = false; // single-shot — restarted manually after each turn
    recognition.interimResults  = false;
    recognition.lang            = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        sendMessage(transcript.trim());
      }
    };

    // Auto-restart only if still in a call AND not currently speaking
    recognition.onend = () => {
      // noop — we restart manually in utterance.onend to avoid feedback loop
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[STT] error:', e.error);
      }
    };

    recognitionRef.current = recognition;
  }, []); // Run once on mount

  // ─────────────────────────────────────────
  // WebSocket message router
  // ─────────────────────────────────────────

  const handleWsMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);

    // session_init — store the server-assigned session ID
    if (data.type === 'session_init') {
      setSessionId(data.session_id);
      return;
    }

    if (data.type === 'error') {
      setMessages(prev => [...prev, { role: 'system', text: `Error: ${data.message}` }]);
      setStatus('listening');
      return;
    }

    // agent_response
    const agentData = data.agent_data || {};
    const responseText = data.text || '';

    // Append AI message (never replace)
    setMessages(prev => [...prev, {
      role:     'assistant',
      text:     responseText,
      intent:   agentData.intent,
      tool:     agentData.tool_call?.name,
      language: agentData.language,
    }]);

    setLastAgentData(agentData);

    // Update conversation state extracted from agent
    if (agentData.next_state) {
      setConvState({
        step:   agentData.next_state.step   || 'start',
        doctor: agentData.next_state.doctor || null,
        date:   agentData.next_state.date   || null,
        time:   agentData.next_state.time   || null,
      });
    }

    // Update latency panel
    if (data.latency) {
      setLatencyBreakdown({
        stt:   data.latency.STT   || 0,
        llm:   data.latency.LLM   || 0,
        tts:   data.latency.TTS   || 0,
        total: data.latency.TOTAL || 0,
      });
    }

    // Speak the response
    speak(responseText);
  }, [speak]);

  // ─────────────────────────────────────────
  // Send message to backend
  // ─────────────────────────────────────────

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!text.trim()) return;

    // Stop listening while we wait for AI response
    recognitionRef.current?.stop();
    setStatus('processing');

    // Append user message immediately (optimistic)
    setMessages(prev => [...prev, { role: 'user', text }]);

    wsRef.current.send(JSON.stringify({ text, patient_id: patient.id }));
  }, [patient.id]);

  // ─────────────────────────────────────────
  // Start / stop call
  // ─────────────────────────────────────────

  const toggleCall = useCallback(() => {
    if (isCalling) {
      // End call
      wsRef.current?.close();
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      isCallingRef.current = false;
      setIsCalling(false);
      setStatus('idle');
      setConvState({ step: 'start', doctor: null, date: null, time: null });
      return;
    }

    // Start call
    setIsCalling(true);
    isCallingRef.current = true;
    setStatus('listening');
    setMessages([]); // fresh transcript for new call

    const socket = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = socket;

    socket.onopen = () => {
      // Show system message
      setMessages([{ role: 'system', text: 'Secure HIPAA Line Established' }]);

      // Welcome message (local TTS only — no round-trip needed)
      const welcome = 'Hello! I\'m your 2Care AI assistant. I can help you book, cancel, or reschedule appointments. How can I help you today?';
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role:     'assistant',
          text:     welcome,
          language: 'English',
          intent:   'greeting',
        }]);
        speak(welcome);
      }, 400);
    };

    socket.onmessage = handleWsMessage;

    socket.onclose = () => {
      isCallingRef.current = false;
      setIsCalling(false);
      setStatus('idle');
      recognitionRef.current?.stop();
    };

    socket.onerror = (err) => {
      console.error('[WS] error', err);
      setMessages(prev => [...prev, { role: 'system', text: 'Connection error — please check the backend is running on port 8000.' }]);
    };
  }, [isCalling, handleWsMessage, speak]);

  // ─────────────────────────────────────────
  // Keep isCallingRef in sync with state
  // ─────────────────────────────────────────

  useEffect(() => {
    isCallingRef.current = isCalling;
    if (isCalling) {
      // Start STT when call begins
      try { recognitionRef.current?.start(); } catch (_) {}
    }
  }, [isCalling]);

  // ─────────────────────────────────────────
  // Outbound campaign
  // ─────────────────────────────────────────

  const startCampaign = async () => {
    setIsCampaignRunning(true);
    try {
      await fetch('http://localhost:8000/api/campaign/start', { method: 'POST' });
      setMessages(prev => [...prev, { role: 'system', text: 'Outbound campaign started — 2,402 reminder calls queued.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'system', text: 'Campaign start failed — backend unavailable.' }]);
    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  if (!showDemo) {
    return <LandingPage onStartDemo={() => setShowDemo(true)} />;
  }

  return (
    <div className="h-screen w-full flex p-6 gap-8 bg-[#f8fafc] overflow-hidden font-inter">

      {/* Back button */}
      <div className="fixed top-8 left-8 z-[60]">
        <button
          onClick={() => { setShowDemo(false); if (isCalling) toggleCall(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-slate-100 text-slate-500 hover:text-primary transition-all text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      <Sidebar patient={patient} />

      <div className="flex-1 flex flex-col gap-6">
        {/* Status bar */}
        <div className="flex justify-between items-center px-4 pt-12 md:pt-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100">
              <Activity className="w-3 h-3 text-emerald-500" /> {status}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100">
              <Zap className="w-3 h-3 text-amber-500" /> {latencyBreakdown.total}ms
            </div>
            {convState.step !== 'start' && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                Step: {convState.step}
              </div>
            )}
          </div>
          <button
            onClick={startCampaign}
            disabled={isCampaignRunning}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
              isCampaignRunning ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            {isCampaignRunning ? 'Campaign Active' : 'Start Outbound Campaign'}
          </button>
        </div>

        <VoicePanel
          isCalling={isCalling}
          onToggleCall={toggleCall}
          messages={messages}
          status={status}
          onSendMessage={sendMessage}
          convState={convState}
        />
      </div>

      <LogsPanel
        intent={lastAgentData.intent}
        tool={lastAgentData.tool_call?.name ?? lastAgentData.tool_call}
        latencyBreakdown={latencyBreakdown}
        reasoningTrace={lastAgentData.reasoning_trace}
        sessionId={sessionId}
        convState={convState}
      />

      {/* Connecting overlay */}
      <AnimatePresence>
        {isCalling && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center gap-8"
          >
            <div className="w-32 h-32 bg-primary rounded-3xl flex items-center justify-center animate-pulse shadow-2xl shadow-primary/30 rotate-12">
              <Phone className="w-12 h-12 text-white fill-current -rotate-12" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-outfit font-bold text-slate-800">Establishing Secure Channel</h2>
              <p className="text-slate-400 font-medium mt-2">Connecting to Healthcare AI Cluster...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
