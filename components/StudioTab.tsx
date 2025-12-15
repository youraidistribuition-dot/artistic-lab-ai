
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Edit3, Zap, CheckCircle2, RotateCcw, PenTool, Sparkles, X, Volume2, History, FileText, ChevronRight, Calendar } from 'lucide-react';
import { getStudioAssist, summarizeSession, generateSpeech } from '../services/geminiService';
import { audioEngine } from '../services/audioEngine';
import { Language, VoiceSettings, StudioSessionType, StudioSessionRecord } from '../types';
import { VOICE_MAP } from '../constants';

interface StudioTabProps {
  language: Language;
  assistantEnabled: boolean;
  voiceSettings: VoiceSettings;
  producerName: string;
}

export const StudioTab: React.FC<StudioTabProps> = ({ language, assistantEnabled, voiceSettings, producerName }) => {
  const [view, setView] = useState<'active' | 'history'>('active');
  const [mode, setMode] = useState<'setup' | 'focus' | 'review'>('setup');
  
  // Session Config
  const [sessionType, setSessionType] = useState<StudioSessionType>('studio');
  const [timeSelected, setTimeSelected] = useState<number>(45); // minutes
  const [startTime, setStartTime] = useState<number>(0);

  // Active Session State
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [isActive, setIsActive] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Quick Assist State
  const [assistQuery, setAssistQuery] = useState('');
  const [assistResult, setAssistResult] = useState<string | null>(null);
  const [isAssistLoading, setIsAssistLoading] = useState(false);
  const [showAssist, setShowAssist] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Review & History State
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [history, setHistory] = useState<StudioSessionRecord[]>(() => {
      const saved = localStorage.getItem('trapmind_studio_history');
      return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('trapmind_studio_history', JSON.stringify(history));
  }, [history]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Auto-end session on timer finish
      stopSession(); 
      playAlarm();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playAlarm = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.start();
    setTimeout(() => osc.stop(), 500);
  };

  const playStudioResponse = async (text: string) => {
    if (isPlayingAudio || !text) return;
    try {
        setIsPlayingAudio(true);
        let voiceName = VOICE_MAP[voiceSettings.gender]['studio'];
        let options = {};
        if (voiceSettings.style === 'custom') {
             voiceName = voiceSettings.gender === 'masculine' ? 'Fenrir' : 'Kore';
             options = { pitch: -150, speed: 0.95 }; 
        }
        const audioBase64 = await generateSpeech(text, voiceName);
        await audioEngine.play(audioBase64, options);
        setIsPlayingAudio(false);
    } catch (e) {
        console.error("Studio TTS Error", e);
        setIsPlayingAudio(false);
    }
  };

  const startSession = () => {
    setStartTime(Date.now());
    setTimeLeft(timeSelected * 60);
    setIsActive(true);
    setMode('focus');
    setAssistResult(null);
  };

  const stopSession = () => {
    setIsActive(false);
    setMode('review');
    handleAutoSummarize();
  };

  const handleAutoSummarize = async () => {
      setIsSummarizing(true);
      const duration = Math.round((Date.now() - startTime) / 1000 / 60);
      try {
          // 1. Generate Summary
          const summaryData = await summarizeSession(notes, sessionType, duration, language);
          setCurrentSummary(summaryData);

          // 2. Save to History
          const newRecord: StudioSessionRecord = {
              id: Date.now().toString(),
              startTime,
              endTime: Date.now(),
              durationMinutes: duration || 1, // at least 1 min
              type: sessionType,
              notes: notes,
              aiSummary: summaryData.summary,
              actionItems: summaryData.actionItems
          };
          setHistory(prev => [newRecord, ...prev]);

      } catch (e) {
          console.error(e);
      } finally {
          setIsSummarizing(false);
      }
  };

  const resetSession = () => {
    setIsActive(false);
    setMode('setup');
    setNotes('');
    setCurrentSummary(null);
    setAssistResult(null);
  };

  const handleQuickAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistQuery.trim() || !assistantEnabled) return;
    setIsAssistLoading(true);
    try {
        const result = await getStudioAssist(assistQuery, notes, language, producerName);
        setAssistResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        setIsAssistLoading(false);
        setAssistQuery('');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSessionTypeIcon = (t: StudioSessionType) => {
      switch(t) {
          case 'studio': return <Volume2 className="w-5 h-5" />;
          case 'focus': return <Zap className="w-5 h-5" />;
          case 'writing': return <PenTool className="w-5 h-5" />;
          case 'meeting': return <Clock className="w-5 h-5" />;
      }
  };

  return (
    <div className={`h-[calc(100vh-140px)] flex flex-col transition-all duration-500 ${mode === 'focus' ? 'bg-zinc-950 text-zinc-100' : ''}`}>
        
        {/* TOP BAR */}
        <div className={`p-4 border-b flex items-center justify-between transition-colors ${mode === 'focus' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 dark:border-neutral-800'}`}>
            <div className="flex items-center gap-3">
                {mode !== 'focus' && (
                    <div className="flex bg-zinc-100 dark:bg-neutral-800 rounded-lg p-1">
                        <button onClick={() => setView('active')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'active' ? 'bg-white dark:bg-neutral-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-500'}`}>
                            {language === 'pt' ? 'Sessão Ativa' : 'Active Session'}
                        </button>
                        <button onClick={() => setView('history')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'history' ? 'bg-white dark:bg-neutral-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-500'}`}>
                            {language === 'pt' ? 'Histórico' : 'History'}
                        </button>
                    </div>
                )}
                {mode === 'focus' && (
                    <div className="flex items-center gap-2 text-red-500 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <span className="font-bold uppercase text-xs tracking-widest">Live Session</span>
                    </div>
                )}
            </div>
            {mode === 'focus' && (
                <div className="font-mono text-xl font-bold text-white tracking-widest">
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative flex">
            
            {/* VIEW: HISTORY */}
            {view === 'history' && mode !== 'focus' && (
                <div className="flex-1 overflow-y-auto p-6 animate-in slide-in-from-left">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <History className="w-6 h-6" />
                            {language === 'pt' ? 'Histórico de Sessões' : 'Session History'}
                        </h2>
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-neutral-800 rounded-2xl">
                                No sessions recorded yet.
                            </div>
                        ) : (
                            history.map(session => (
                                <div key={session.id} className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm hover:border-purple-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-100 dark:bg-neutral-800 rounded-lg text-zinc-500">
                                                {getSessionTypeIcon(session.type)}
                                            </div>
                                            <div>
                                                <div className="font-bold capitalize text-zinc-900 dark:text-white">{session.type} Session</div>
                                                <div className="text-xs text-zinc-500 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(session.endTime).toLocaleDateString()}
                                                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                                    {session.durationMinutes} min
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {session.aiSummary && (
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg mb-4 border border-purple-100 dark:border-purple-500/20">
                                            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">
                                                <Sparkles className="w-3 h-3" /> AI Summary
                                            </div>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{session.aiSummary}</p>
                                            
                                            {session.actionItems && session.actionItems.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/50">
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {session.actionItems.map((item, i) => (
                                                            <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400">{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {session.notes && (
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-neutral-800/50 p-3 rounded-lg font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                            {session.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: ACTIVE SETUP */}
            {view === 'active' && mode === 'setup' && (
                <div className="w-full max-w-2xl mx-auto p-6 flex flex-col justify-center space-y-12 animate-in zoom-in-95">
                    <div className="space-y-4 text-center">
                        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">Enter The Studio</h1>
                        <p className="text-zinc-600 dark:text-neutral-400">Distraction-free environment for deep work.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Session Type */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400">Session Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['studio', 'writing', 'focus', 'meeting'] as StudioSessionType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSessionType(type)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                            sessionType === type 
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                                            : 'border-zinc-200 dark:border-neutral-800 hover:border-zinc-300 dark:hover:border-neutral-700 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        {getSessionTypeIcon(type)}
                                        <span className="font-bold capitalize">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-3">
                             <label className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400">Duration</label>
                             <div className="grid grid-cols-4 gap-3">
                                {[25, 45, 60, 90].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeSelected(t)}
                                        className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                            timeSelected === t 
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' 
                                            : 'border-zinc-100 dark:border-neutral-800 hover:border-zinc-300 dark:hover:border-neutral-600 text-zinc-700 dark:text-zinc-400'
                                        }`}
                                    >
                                        {t}m
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={startSession}
                        className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        {language === 'pt' ? 'INICIAR SESSÃO' : 'START SESSION'}
                    </button>
                </div>
            )}

            {/* VIEW: FOCUS MODE & REVIEW */}
            {(mode === 'focus' || mode === 'review') && (
                <div className="flex-1 flex flex-col md:flex-row h-full">
                    {/* LEFT: Editor */}
                    <div className="flex-1 flex flex-col p-6 relative">
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={language === 'pt' ? "Escreva suas letras, ideias ou notas..." : "Write lyrics, ideas, or session notes..."}
                            className={`flex-1 w-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed ${
                                mode === 'focus' 
                                ? 'text-zinc-300 placeholder-zinc-700' 
                                : 'text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-neutral-700'
                            }`}
                        />
                        
                        {/* Overlay Controls */}
                        {mode === 'focus' && (
                            <div className="absolute bottom-6 right-6 flex gap-2">
                                <button 
                                    onClick={() => setShowAssist(!showAssist)}
                                    className="p-3 bg-zinc-800 text-purple-400 rounded-full hover:bg-zinc-700 transition shadow-lg border border-zinc-700"
                                    title="Quick Assist"
                                >
                                    <Zap className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setIsActive(!isActive)}
                                    className="p-3 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition shadow-lg border border-zinc-700"
                                >
                                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <button 
                                    onClick={stopSession}
                                    className="p-3 bg-red-900/30 text-red-500 rounded-full hover:bg-red-900/50 transition shadow-lg border border-red-900/50"
                                >
                                    <Square className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Quick Assist Panel OR Review Panel */}
                    {(showAssist || mode === 'review') && (
                        <div className={`w-full md:w-80 border-l p-4 flex flex-col ${mode === 'focus' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 dark:border-neutral-800 bg-zinc-50 dark:bg-neutral-900'}`}>
                            
                            {mode === 'focus' && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Studio Assist</h3>
                                        <button onClick={() => setShowAssist(false)}><X className="w-4 h-4 text-zinc-500" /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto mb-4">
                                        {assistResult ? (
                                            <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-2">
                                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{assistResult}</p>
                                                <button 
                                                   onClick={() => playStudioResponse(assistResult)}
                                                   className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                                   disabled={isPlayingAudio}
                                                >
                                                   <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                                                   {isPlayingAudio ? 'Speaking...' : 'Read Aloud'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-zinc-600 mt-10 text-sm">Ask for a rhyme, synonym, or quick tip.</div>
                                        )}
                                    </div>
                                    <form onSubmit={handleQuickAssist} className="relative">
                                        <input 
                                            value={assistQuery}
                                            onChange={(e) => setAssistQuery(e.target.value)}
                                            placeholder="Ask briefly..."
                                            disabled={isAssistLoading}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={isAssistLoading}
                                            className="absolute right-2 top-2 text-zinc-500 hover:text-white"
                                        >
                                            {isAssistLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        </button>
                                    </form>
                                </>
                            )}

                            {mode === 'review' && (
                                <div className="h-full flex flex-col animate-in slide-in-from-right">
                                    <h2 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white">Session Saved</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-500 mb-6">Your work has been logged.</p>

                                    <div className="flex-1 overflow-y-auto space-y-4">
                                        <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-zinc-200 dark:border-neutral-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Duration</span>
                                                <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Type</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono text-xl text-zinc-900 dark:text-white">{Math.round((Date.now() - startTime) / 1000 / 60)} min</span>
                                                <span className="bg-zinc-100 dark:bg-neutral-700 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded capitalize text-sm">{sessionType}</span>
                                            </div>
                                        </div>
                                        
                                        {isSummarizing ? (
                                            <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                                                <Sparkles className="w-6 h-6 animate-pulse text-purple-500" />
                                                <span className="text-xs">Generating Summary...</span>
                                            </div>
                                        ) : currentSummary && (
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-500/30">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                                    <label className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">AI Recap</label>
                                                </div>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">{currentSummary.summary}</p>
                                                {currentSummary.actionItems?.length > 0 && (
                                                    <ul className="space-y-1">
                                                        {currentSummary.actionItems.map((item: string, i: number) => (
                                                            <li key={i} className="text-xs flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                                <span className="mt-1 w-1 h-1 bg-purple-400 rounded-full" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-neutral-800">
                                        <button 
                                            onClick={resetSession}
                                            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                                        >
                                            New Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
