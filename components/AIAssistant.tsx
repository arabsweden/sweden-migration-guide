
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getLegalAssistantResponse } from '../services/gemini';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً بك! أنا مساعدك الذكي لشؤون الهجرة. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const responseText = await getLegalAssistantResponse(input);
    const modelMessage: Message = { role: 'model', text: responseText || 'عذراً، لم أستطع الرد حالياً.' };
    
    setMessages(prev => [...prev, modelMessage]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-inner border border-slate-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t bg-slate-50 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اسأل عن القوانين..."
          className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSend}
          disabled={isTyping}
          className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 hover:scale-110 active:scale-95 disabled:bg-slate-300 transition-all duration-200 flex items-center justify-center"
          aria-label="إرسال"
        >
          <svg 
            className="w-5 h-5 transform rotate-[-45deg] mr-0.5" 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
