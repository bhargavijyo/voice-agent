import React from 'react';
import { motion } from 'framer-motion';
import { User, Activity } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text }) => {
  const isUser = role === 'user';
  
  if (role === 'system') {
    return (
      <div className="flex justify-center my-2">
         <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200">
           {text}
         </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        isUser ? 'bg-primary text-white' : 'bg-white border border-slate-100 text-slate-400'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Activity className="w-5 h-5 text-primary" />}
      </div>
      
      <div className={`max-w-[80%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
        isUser 
        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' 
        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
      }`}>
        <p className="font-medium">{text}</p>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
