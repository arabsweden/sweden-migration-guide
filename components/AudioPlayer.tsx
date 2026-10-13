
import React, { useState, useRef } from 'react';
import { Episode } from '../types';
import { generateEpisodeSummaryAudio, decode, decodeAudioData } from '../services/gemini';

interface AudioPlayerProps {
  episode: Episode;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ episode, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handlePlayTTS = async () => {
    if (isPlaying) {
      if (sourceRef.current) sourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    setAudioError('');
    setIsLoading(true);
    // نستخدم السكربت الكامل للقراءة إذا توفر، وإلا نستخدم الوصف
    const contentToRead = `${episode.title}. ${episode.script || episode.description}`;
    const audioData = await generateEpisodeSummaryAudio(contentToRead);
    
    if (audioData) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      sourceRef.current = source;
      setIsPlaying(true);
    }
    if (!audioData) setAudioError('توليد الصوت غير مفعّل في هذه النسخة؛ يلزم ربط Gemini بأمان أولاً.');
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50 animate-slide-up" dir="rtl">
      <>{audioError && <p role="status" className="max-w-md mx-auto mb-2 text-xs text-amber-800">{audioError}</p>}<div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-right">
          <button 
            onClick={handlePlayTTS}
            disabled={isLoading}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 disabled:bg-slate-400"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <div>
            <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{episode.title}</h4>
            <p className="text-[10px] text-slate-500">{isPlaying ? 'جاري الاستماع للشرح الكامل...' : 'اضغط للاستماع للشرح القانوني'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div></>
    </div>
  );
};

export default AudioPlayer;
