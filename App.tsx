
import React, { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, EPISODES, NEWS_UPDATES } from './data';
import { Episode, Category } from './types';
import LegalDisclaimer from './components/LegalDisclaimer';
import AudioPlayer from './components/AudioPlayer';
import AIAssistant from './components/AIAssistant';
import AppSheetInfo from './components/AppSheetInfo';
import { generateEpisodeSummaryAudio, decode } from './services/gemini';
import { saveDownload, getAllDownloads, deleteDownload, clearAllDownloads, DownloadedItem } from './services/storage';

type ViewMode = 'home' | 'categories' | 'assistant' | 'favorites' | 'downloads' | 'dev';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [detailEpisode, setDetailEpisode] = useState<Episode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refreshDownloads = useCallback(async () => {
    const items = await getAllDownloads();
    setDownloadedItems(items);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sweden_imm_favs');
    if (saved) setFavorites(JSON.parse(saved));
    refreshDownloads();
  }, [refreshDownloads]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('sweden_imm_favs', JSON.stringify(newFavs));
  };

  const handleDeleteDownload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الملف؟')) {
      await deleteDownload(id);
      await refreshDownloads();
    }
  };

  const handleClearAll = async () => {
    if (confirm('هل أنت متأكد من حذف جميع التنزيلات؟')) {
      await clearAllDownloads();
      await refreshDownloads();
    }
  };

  const handleCopy = async (episode: Episode) => {
    const textToCopy = `${episode.title}\n\n${episode.script || episode.description}\n\nالمصدر: ${episode.officialLink}\n\n⚠️ تنبيه: هذا محتوى تعليمي فقط وليس استشارة قانونية.`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('تم نسخ نص الحلقة بالكامل!');
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();
    const shareText = `${episode.title}\n\n${episode.script || episode.description}\n\n⚠️ هذا محتوى تعليمي فقط وليس استشارة قانونية. تحقق دائماً من موقع مصلحة الهجرة السويدية: ${episode.officialLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy(episode);
    }
  };

  const handleDownload = async (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();
    if (downloadingId) return;

    try {
      setDownloadingId(episode.id);
      const contentToVoice = `${episode.title}. ${episode.script || episode.description}`;
      const audioData = await generateEpisodeSummaryAudio(contentToVoice);
      
      if (audioData) {
        const decodedData = decode(audioData);
        const blob = new Blob([decodedData], { type: 'audio/pcm' });
        
        await saveDownload(episode, blob);
        await refreshDownloads();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = episode.title.replace(/[^\u0621-\u064A\w\s]/gi, '').replace(/\s+/g, '-');
        a.download = `Sverige-Podcast-${safeTitle}.pcm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredEpisodes = EPISODES.filter(e => {
    const matchesSearch = e.title.includes(searchQuery) || e.description.includes(searchQuery);
    const matchesCategory = selectedCategory ? e.categoryId === selectedCategory.id : true;
    const matchesFav = view === 'favorites' ? favorites.includes(e.id) : true;
    return matchesSearch && matchesCategory && matchesFav;
  });

  const latestEpisodes = [...EPISODES].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  ).slice(0, 3);

  const totalStorageMB = (downloadedItems.reduce((acc, item) => acc + item.blob.size, 0) / (1024 * 1024)).toFixed(1);

  const renderEpisodeCard = (ep: Episode, isDownloadView = false) => {
    const isDownloaded = downloadedItems.some(i => i.id === ep.id);
    const isCurrentlyDownloading = downloadingId === ep.id;

    return (
      <div 
        key={ep.id} 
        onClick={() => setDetailEpisode(ep)}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-4 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98] group relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-slate-800 text-base leading-tight flex-1 line-clamp-2">{ep.title}</h4>
          <div className="flex gap-1 mr-2">
            <button 
              onClick={(e) => handleShare(e, ep)}
              className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="مشاركة"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => toggleFavorite(ep.id, e)} 
              className={`p-1.5 rounded-full transition-colors ${favorites.includes(ep.id) ? 'text-yellow-400 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400 hover:bg-yellow-50'}`}
              title="أضف للمفضلة"
            >
              <svg className={`w-5 h-5 ${favorites.includes(ep.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{ep.description}</p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold tracking-tight shadow-sm ${
              ep.level === 'مبتدئ' ? 'bg-emerald-500' : ep.level === 'متوسط' ? 'bg-orange-500' : 'bg-rose-500'
            }`}>
              {ep.level}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {ep.duration} دقيقة
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDownloadView ? (
              <button 
                onClick={(e) => handleDeleteDownload(ep.id, e)}
                className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                title="حذف الملف"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                حذف
              </button>
            ) : (
              <button 
                onClick={(e) => handleDownload(e, ep)}
                disabled={isDownloaded || isCurrentlyDownloading}
                className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm ${
                  isDownloaded 
                    ? 'bg-green-50 text-green-600 border border-green-100 cursor-default' 
                    : isCurrentlyDownloading 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {isCurrentlyDownloading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    جاري التحميل...
                  </>
                ) : isDownloaded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    تم التحميل
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    تحميل للاستماع
                  </>
                )}
              </button>
            )}

            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 font-sans text-right" dir="rtl">
      <header className="bg-blue-900 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-40 transition-all">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <h1 className="text-2xl font-bold">🇸🇪 هجرة السويد</h1>
              <p className="text-blue-200 text-xs mt-1">دليلك الكامل لقوانين الإقامة</p>
            </div>
            <button 
              onClick={() => setView('dev')}
              className="bg-white/10 p-2 rounded-full hover:bg-white/20"
              title="إعدادات المطور"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن موضوع (مثلاً: دبلن، راتب، سكن)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-blue-800/50 border border-blue-700 rounded-2xl py-3 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-blue-300 transition-all text-white text-right"
            />
            <svg className="w-5 h-5 absolute right-3 top-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <LegalDisclaimer />
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">نسخة إرشادية: المساعد الذكي وتوليد الصوت غير مفعّلين حالياً. المعلومات القانونية تحتاج التحقق من المصادر الرسمية.</div>

        {view === 'home' && (
          <div className="animate-fade-in space-y-6">
            <section>
              <h2 className="text-lg font-bold mb-3 text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                آخر التحديثات القانونية
              </h2>
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x scrollbar-hide">
                {NEWS_UPDATES.map(news => (
                  <a href={news.sourceUrl} key={news.id} target="_blank" className="min-w-[280px] snap-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 block group hover:border-blue-200">
                    <p className="text-xs text-blue-600 font-bold mb-1">{news.date}</p>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{news.titleAr}</h3>
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-800">أحدث الحلقات الصوتية</h2>
              <div className="space-y-4">
                {latestEpisodes.map(ep => renderEpisodeCard(ep))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-800">تصفح حسب الفئة</h2>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => { setSelectedCategory(cat); setView('categories'); }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-all active:scale-95"
                  >
                    <span className="text-3xl mb-2">{cat.icon}</span>
                    <h3 className="font-bold text-slate-800 text-xs">{cat.titleAr}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">{cat.episodeCount} حلقة</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {(view === 'categories' || view === 'favorites') && (
          <section className="animate-slide-left">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => { setView('home'); setSelectedCategory(null); }} className="flex items-center gap-2 text-blue-600 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                العودة
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                {view === 'favorites' ? 'المفضلات' : selectedCategory?.titleAr}
              </h2>
            </div>
            
            <div className="space-y-4">
              {filteredEpisodes.length > 0 ? filteredEpisodes.map(ep => renderEpisodeCard(ep)) : (
                <div className="text-center py-12 text-slate-400 italic">لا توجد نتائج تطابق بحثك</div>
              )}
            </div>
          </section>
        )}

        {view === 'downloads' && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">التنزيلات</h2>
                <p className="text-xs text-slate-500">{downloadedItems.length} ملفات • {totalStorageMB} ميجا بايت</p>
              </div>
              {downloadedItems.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-xs font-bold text-red-500 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-50"
                >
                  حذف الكل
                </button>
              )}
            </div>

            <div className="space-y-4">
              {downloadedItems.length > 0 ? downloadedItems.map(item => renderEpisodeCard(item.episode, true)) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="text-4xl mb-4 text-slate-200">📥</div>
                  <p className="text-slate-400 text-sm">لا توجد حلقات محملة حالياً</p>
                  <button onClick={() => setView('home')} className="mt-4 text-blue-600 font-bold text-sm">تصفح الحلقات</button>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'assistant' && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-slate-800">المساعد القانوني الذكي</h2>
            <AIAssistant />
          </section>
        )}

        {view === 'dev' && (
          <AppSheetInfo />
        )}
      </main>

      {/* Detail Modal */}
      {detailEpisode && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center animate-fade-in" onClick={() => setDetailEpisode(null)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-800 leading-tight pr-4">{detailEpisode.title}</h2>
              <button onClick={() => setDetailEpisode(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <span className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold uppercase shadow-sm">{detailEpisode.level}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold shadow-sm">⏱️ {detailEpisode.duration} دقيقة</span>
            </div>

            <div className="space-y-6 pb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  وصف الحلقة
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{detailEpisode.description}</p>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2">
                    <span className="text-xl">📜</span> نص الشرح القانوني الكامل
                  </h3>
                  <button 
                    onClick={() => handleCopy(detailEpisode)}
                    className="text-[11px] bg-white text-blue-700 px-3 py-1 rounded-lg font-bold shadow-sm hover:bg-blue-100 transition-colors"
                  >
                    نسخ النص
                  </button>
                </div>
                <div className="text-blue-800 text-sm whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-xl">
                  {detailEpisode.script || "لا يتوفر نص كامل لهذه الحلقة حالياً."}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sticky bottom-0 bg-white">
                <button 
                  onClick={() => { setActiveEpisode(detailEpisode); setDetailEpisode(null); }}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  تشغيل الصوت (الشرح الكامل)
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleShare(e, detailEpisode)}
                    className="flex-1 bg-slate-100 py-3 rounded-2xl text-slate-700 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                    مشاركة
                  </button>
                  <button 
                    onClick={(e) => handleDownload(e, detailEpisode)}
                    disabled={downloadedItems.some(i => i.id === detailEpisode.id)}
                    className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                      downloadedItems.some(i => i.id === detailEpisode.id) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {downloadingId === detailEpisode.id ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : downloadedItems.some(i => i.id === detailEpisode.id) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    )}
                    {downloadedItems.some(i => i.id === detailEpisode.id) ? 'تم التنزيل' : 'تنزيل'}
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
                <p className="font-bold mb-1">🔗 المصدر الرسمي والقانوني:</p>
                تم استخلاص هذه المعلومات من قانون الأجانب السويدي وموقع مصلحة الهجرة. يمكنك مراجعة المصدر مباشرة:
                <a href={detailEpisode.officialLink} target="_blank" className="block text-blue-700 font-bold underline mt-2 break-all">
                  {detailEpisode.officialLink}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-4 py-3 flex justify-between items-center z-50">
        <button onClick={() => { setView('home'); setSelectedCategory(null); }} className={`flex flex-col items-center gap-1 transition-colors flex-1 ${view === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button onClick={() => setView('favorites')} className={`flex flex-col items-center gap-1 transition-colors flex-1 ${view === 'favorites' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span className="text-[10px] font-bold">المفضلة</span>
        </button>
        <button onClick={() => setView('downloads')} className={`flex flex-col items-center gap-1 transition-colors flex-1 ${view === 'downloads' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span className="text-[10px] font-bold">التنزيلات</span>
        </button>
        <button onClick={() => setView('assistant')} className={`flex flex-col items-center gap-1 transition-colors flex-1 ${view === 'assistant' ? 'text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
          <span className="text-[10px] font-bold">المساعد</span>
        </button>
      </nav>

      {activeEpisode && (
        <AudioPlayer episode={activeEpisode} onClose={() => setActiveEpisode(null)} />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-left { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-slide-left { animation: slide-left 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-in; }
        body { text-align: right; }
      `}</style>
    </div>
  );
};

export default App;
