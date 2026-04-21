import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Phone, Calendar, Globe, Clock, Zap, 
  CheckCircle2, ArrowRight, MessageSquare, 
  BarChart3, Shield, Bot, Sparkles, Database,
  Headphones, Play, Languages
} from 'lucide-react';

// --- Components ---

const Navbar = ({ onStartDemo }: { onStartDemo: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-100 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6" />
          </div>
          <span className="text-2xl font-outfit font-bold text-slate-900 tracking-tight">2Care.ai</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it Works', 'Pricing', 'Docs'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:block text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Login
          </button>
          <button 
            onClick={onStartDemo}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Start Free Demo
          </button>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onStartDemo }: { onStartDemo: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[1000px] -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.08)_0%,transparent_50%)]" />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-100/50 blur-[100px] rounded-full" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-primary border border-blue-100 mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Next-Gen Voice AI for Clinics</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-outfit font-bold text-slate-900 leading-[1.1] mb-8"
        >
          AI Voice Agents for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Clinical Appointment Automation</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed"
        >
          Automate booking, follow-ups, and patient engagement using real-time AI conversations. 
          Reduce administrative burden by 80% while providing 24/7 patient care.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <button 
            onClick={onStartDemo}
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Start Free Demo <ArrowRight className="w-5 h-5" />
          </button>
          <button className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Play className="w-4 h-4 fill-current" /> Hear AI Voice
          </button>
        </motion.div>

        {/* Floating UI Card Preview */}
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, type: 'spring', stiffness: 50 }}
           className="relative max-w-4xl mx-auto"
        >
           <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden aspect-video group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
              
              {/* Fake UI Structure */}
              <div className="absolute inset-0 flex">
                 <div className="w-64 border-r border-slate-100 p-6 hidden md:block text-left">
                    <div className="w-full h-8 bg-slate-100 rounded-lg mb-8" />
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-full h-4 bg-slate-50 rounded-md mb-4" />
                    ))}
                 </div>
                 <div className="flex-1 p-8 flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center animate-pulse-slow">
                       <Mic className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                       <div className="h-6 w-48 bg-slate-200 rounded-full mx-auto mb-2" />
                       <div className="h-4 w-32 bg-slate-100 rounded-full mx-auto" />
                    </div>
                    <div className="w-full max-w-md space-y-3">
                       <div className="h-10 bg-slate-50 rounded-2xl border border-slate-100" />
                       <div className="h-10 bg-primary/5 rounded-2xl border border-primary/10" />
                    </div>
                 </div>
              </div>

              {/* Floating Status Badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-10 right-10 bg-white shadow-xl rounded-2xl p-4 border border-slate-50 hidden sm:block text-left"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking Status</p>
                       <p className="text-sm font-bold text-slate-800">Confirmed in 1.2s</p>
                    </div>
                 </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                className="absolute bottom-10 left-10 bg-white shadow-xl rounded-2xl p-4 border border-slate-50 hidden sm:block text-left"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xs font-bold">
                       HI
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Language Detected</p>
                       <p className="text-sm font-bold text-slate-800">Hindi (Auto-Switched)</p>
                    </div>
                 </div>
              </motion.div>
           </div>
        </motion.div>
      </div>
    </section>
  );
};

const FlowSection = () => {
  const steps = [
    { icon: <MessageSquare />, label: 'Patient Call', desc: 'Patient dials in or receives a call' },
    { icon: <Bot />, label: 'Voice AI Intervention', desc: 'AI handles the conversation naturally' },
    { icon: <Calendar />, label: 'Dynamic Booking', desc: 'Checks conflicts & schedules' },
    { icon: <Headphones />, label: 'Follow-up', desc: 'Automated post-visit checks' },
    { icon: <BarChart3 />, label: 'Patient Outcome', desc: 'Satisfied patient, zero admin work' },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-slate-900 mb-4">Patient-AI Workflow</h2>
          <p className="text-slate-600">The seamless journey from first hello to final booking.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
           {/* Line connecting steps */}
           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden md:block" />
           
           {steps.map((step, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="relative z-10 flex flex-col items-center text-center group"
             >
               <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all shadow-sm">
                  {React.cloneElement(step.icon as React.ReactElement, { className: 'w-8 h-8' })}
               </div>
               <h3 className="font-bold text-slate-800 mb-2">{step.label}</h3>
               <p className="text-xs text-slate-500 max-w-[150px]">{step.desc}</p>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { title: 'Appointment Booking', desc: 'Real-time scheduling with EHR integration.', icon: <Calendar className="text-blue-500" /> },
    { title: 'AI Voice Calls', desc: 'Natural conversations with 98% intent accuracy.', icon: <Mic className="text-purple-500" /> },
    { title: 'Multilingual Support', desc: 'Speak in English, Hindi, Tamil, and more.', icon: <Globe className="text-emerald-500" /> },
    { title: 'Smart Scheduling', desc: 'Handles complex rotations and staff shifts.', icon: <Clock className="text-amber-500" /> },
    { title: 'Conflict Resolution', desc: 'Intelligently manages overlaps and cancellations.', icon: <Zap className="text-rose-500" /> },
    { title: 'Contextual Memory', desc: 'Remembers past visits for personalized care.', icon: <Database className="text-indigo-500" /> },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-slate-900 mb-4">Everything clinical admin needs</h2>
          <p className="text-slate-600">Built for scale, privacy, and clinical efficiency.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const VoiceAgentSimulation = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am calling from City Clinic. I see you have a follow-up due tomorrow at 10 AM. Can you make it?' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, { role: 'user', text: "Actually, I have a meeting then. Can we do Wednesday afternoon?" }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: "Checking... Yes, we have a slot at 2:30 PM on Wednesday with Dr. Sharma. Should I book that for you?" }]);
      }, 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <div className="text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-6">
              REAL-TIME SIMULATION
           </div>
           <h2 className="text-4xl font-outfit font-bold text-slate-900 mb-6">Handles 24/7 patient calls without human intervention</h2>
           <p className="text-lg text-slate-600 mb-8 leading-relaxed">
             Our AI understands medical context, handles interruptions, and processes bookings in milliseconds. 
             It sounds human, but works with robot accuracy.
           </p>
           
           <div className="space-y-4">
              {[
                'Zero hold times for patients',
                'SOC2 and HIPAA compliant security',
                'Deep integration with EPIC/Cerner'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                   </div>
                   <span className="font-medium text-slate-800">{item}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative text-left">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <Mic className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Transcript</p>
                    <p className="text-sm font-bold text-white">Clinical AI Agent v2.4</p>
                 </div>
              </div>
              <div className="flex gap-1">
                 {[...Array(3)].map((_, i) => (
                   <motion.div 
                     key={i}
                     animate={{ height: [4, 12, 4] }}
                     transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                     className="w-1 bg-primary rounded-full" 
                   />
                 ))}
              </div>
           </div>

           <div className="space-y-6 h-[300px] overflow-hidden relative">
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none" />
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: m.role === 'assistant' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      m.role === 'assistant' 
                      ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                      : 'bg-primary text-white shadow-lg shadow-primary/20'
                    }`}>
                       {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
           
           <div className="mt-8 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                 <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white scale-110 animate-pulse shadow-lg shadow-primary/40">
                    <Headphones className="w-6 h-6" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const Metrics = () => {
  const stats = [
    { label: 'Reduced Manual Calls', val: '80%' },
    { label: 'Faster Bookings', val: '40%' },
    { label: 'Latency', val: '<450ms' },
    { label: 'Availability', val: '24/7' },
  ];

  return (
    <section className="py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {stats.map((s, i) => (
            <div key={i} className="text-white">
               <motion.p 
                 initial={{ opacity: 0, scale: 0.5 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 className="text-4xl md:text-6xl font-outfit font-bold mb-2"
               >
                 {s.val}
               </motion.p>
               <p className="text-blue-100 text-sm font-medium uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MultilingualSection = () => {
  const languages = [
    { lang: 'English', text: 'Book an appointment', sub: 'Primary' },
    { lang: 'Hindi', text: 'मुझे डॉक्टर से मिलना है', sub: 'मुझे अपॉइंटमेंट चाहिए' },
    { lang: 'Tamil', text: 'நாளை மருத்துவரை பார்க்க வேண்டும்', sub: 'முன்பதிவு செய்ய' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-outfit font-bold text-slate-900 mb-12">One agent, every language.</h2>
        <div className="flex flex-wrap justify-center gap-8">
           {languages.map((l, i) => (
             <motion.div 
               key={i}
               whileHover={{ scale: 1.05 }}
               className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-left min-w-[300px]"
             >
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-bold">
                      {l.lang[0]}
                   </div>
                   <span className="font-bold text-slate-900">{l.lang}</span>
                </div>
                <p className="text-xl font-medium text-slate-800 mb-2">"{l.text}"</p>
                <p className="text-sm text-slate-500">{l.sub}</p>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

const OutboundAI = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <div className="order-2 md:order-1 text-left">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900">Active Campaign: Reminders</h4>
                    <p className="text-xs text-slate-500">2,402 calls scheduled for today</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 {[
                   { name: 'John Doe', status: 'Confirmed', time: '10:30 AM', color: 'bg-emerald-50 text-emerald-600' },
                   { name: 'Sarah Miller', status: 'Rescheduled', time: '11:15 AM', color: 'bg-blue-50 text-blue-600' },
                   { name: 'Robert Fox', status: 'Calling...', time: '11:45 AM', color: 'bg-amber-50 text-amber-600 animate-pulse' },
                 ].map((row, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">JD</div>
                         <span className="text-sm font-bold text-slate-800">{row.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${row.color}`}>{row.status}</span>
                   </div>
                 ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-900">92.4%</p>
                 </div>
                 <div className="w-32 h-12">
                    <div className="flex items-end gap-1 h-full">
                       {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                         <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-primary/20 rounded-t-sm" />
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="order-1 md:order-2 text-left">
           <h2 className="text-4xl font-outfit font-bold text-slate-900 mb-6">Automate your outbound patient engagement</h2>
           <p className="text-lg text-slate-600 mb-8 leading-relaxed">
             From appointment reminders to post-surgical follow-ups. Our AI reaches out to patients, 
             gathers feedback, and updates your EHR automatically.
           </p>
           <ul className="space-y-4 text-left">
              <li className="flex items-start gap-3">
                 <div className="mt-1 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                 </div>
                 <p className="text-slate-700"><strong>90% lower cost</strong> than traditional call centers.</p>
              </li>
              <li className="flex items-start gap-3">
                 <div className="mt-1 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                 </div>
                 <p className="text-slate-700"><strong>Human-like empathy</strong> for sensitive medical follow-ups.</p>
              </li>
           </ul>
        </div>
      </div>
    </section>
  );
};

const CTA = ({ onStartDemo }: { onStartDemo: () => void }) => {
  return (
    <section className="py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-slate-900 -z-10" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#2563eb,transparent_50%)]" />
      </div>
      
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white mb-8">Start building your AI healthcare assistant</h2>
        <p className="text-blue-100 mb-12 text-lg">Join 200+ clinics automate their operations today.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <button 
             onClick={onStartDemo}
             className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/40"
           >
              Try Demo Now
           </button>
           <button className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
              Contact Sales
           </button>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-20 pb-10 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 text-left">
          <div>
             <div className="flex items-center gap-2 mb-6">
               <Bot className="w-6 h-6 text-primary" />
               <span className="text-xl font-outfit font-bold text-slate-900">2Care.ai</span>
             </div>
             <p className="text-sm text-slate-500">Transforming clinical operations with voice intelligence.</p>
          </div>
          <div>
             <h4 className="font-bold text-slate-900 mb-6">Product</h4>
             <ul className="space-y-4">
                {['Features', 'Demo', 'Docs', 'Pricing'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>
          <div>
             <h4 className="font-bold text-slate-900 mb-6">Company</h4>
             <ul className="space-y-4">
                {['About Us', 'Careers', 'Blog', 'Contact'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>
          <div>
             <h4 className="font-bold text-slate-900 mb-6">Social</h4>
             <ul className="space-y-4">
                {['Twitter', 'LinkedIn', 'GitHub'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>
        </div>
        <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-sm text-slate-400">© 2024 2Care.ai. All rights reserved.</p>
           <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary"><Languages className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-primary"><Shield className="w-5 h-5" /></a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage({ onStartDemo }: { onStartDemo: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter selection:bg-primary/10 selection:text-primary">
       <Navbar onStartDemo={onStartDemo} />
       <Hero onStartDemo={onStartDemo} />
       <FlowSection />
       <Features />
       <VoiceAgentSimulation />
       <Metrics />
       <MultilingualSection />
       <OutboundAI />
       <CTA onStartDemo={onStartDemo} />
       <Footer />
    </div>
  );
}
