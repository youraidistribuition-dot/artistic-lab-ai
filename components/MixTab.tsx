
import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Download, Sliders, CheckCircle2, Music, Activity, AlertCircle, RotateCcw, Lock, Star, Loader2, Cpu, FileAudio, BarChart, AlertTriangle, ShieldCheck } from 'lucide-react';
import { audioEngine, QualityStats } from '../services/audioEngine';
import { getMixFeedback } from '../services/geminiService';
import { BrandLogo } from './BrandLogo';
import { Language, UserPlan, MixPreset, UserUsage } from '../types';
import { MIX_PRESETS, PLAN_LIMITS } from '../constants';

interface MixTabProps {
  language: Language;
  assistantEnabled: boolean;
  userPlan: UserPlan;
  usage: UserUsage;
  incrementUsage: () => void;
  onUpgrade: () => void;
}

export const MixTab: React.FC<MixTabProps> = ({ language, assistantEnabled, userPlan, usage, incrementUsage, onUpgrade }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number>(0);
  const [preset, setPreset] = useState<MixPreset>('clean');
  
  // GRANULAR FEEDBACK STATE
  const [processingState, setProcessingState] = useState<{ status: string; progress: number } | null>(null);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessedUrl(null);
      setFeedback(null);
      setError(null);
      setQualityStats(null);

      // Check duration roughly via audio element (accurate enough for this)
      const audio = new Audio(URL.createObjectURL(selectedFile));
      audio.onloadedmetadata = () => {
          setFileDuration(audio.duration);
      };
    }
  };

  const processAudio = async () => {
    if (!file || !assistantEnabled) return;

    // --- 1. CHECK DAILY LIMIT ---
    if (userPlan === 'free' && usage.mixesToday >= PLAN_LIMITS.free.maxMixesPerDay) {
        setError(language === 'pt' ? "Limite diário atingido." : "Daily mix limit reached.");
        onUpgrade(); // Trigger upgrade modal
        return;
    }

    // --- 2. CHECK DURATION LIMIT ---
    if (userPlan === 'free' && fileDuration > PLAN_LIMITS.free.maxDurationSeconds) {
        setError(language === 'pt' 
            ? `Faixa muito longa. Free: máx 2min.` 
            : `Track too long. Free plan: max 2min.`);
        onUpgrade();
        return;
    }

    // --- 3. CHECK PRESET ACCESS ---
    if (MIX_PRESETS[preset].premium && userPlan === 'free') {
        setError(language === 'pt' ? "Preset exclusivo Premium." : "Premium exclusive preset.");
        onUpgrade();
        return;
    }

    setProcessingState({ 
        status: language === 'pt' ? 'Inicializando Audio Engine...' : 'Initializing Audio Engine...', 
        progress: 5 
    });
    setError(null);

    try {
        incrementUsage();

        // Step 1: Analyze
        setProcessingState({ 
            status: language === 'pt' ? 'Analisando frequências...' : 'Analyzing frequencies...', 
            progress: 20 
        });
        await new Promise(r => setTimeout(r, 800)); // Visual pacing

        // Step 2: Processing
        setProcessingState({ 
            status: language === 'pt' ? 'Aplicando compressão e EQ...' : 'Applying compression & EQ...', 
            progress: 50 
        });
        
        const result = await audioEngine.processTrack(file, preset);
        setQualityStats(result.stats);
        
        // Step 3: Mastering
        setProcessingState({ 
            status: language === 'pt' ? 'Masterizando dinâmica...' : 'Mastering dynamics...', 
            progress: 75 
        });
        await new Promise(r => setTimeout(r, 600)); // Visual pacing
        
        // Step 4: Feedback
        setProcessingState({ 
            status: language === 'pt' ? 'Gerando relatório técnico...' : 'Generating engineer report...', 
            progress: 90 
        });
        
        const statsString = `Peak: ${result.stats.peak.toFixed(2)}, RMS: ${result.stats.rms.toFixed(3)}, Clips: ${result.stats.clippingCount}`;
        const aiFeedback = await getMixFeedback(file.name, 'mix', language, statsString);
        
        setProcessingState({ 
            status: language === 'pt' ? 'Finalizando...' : 'Finalizing...', 
            progress: 100 
        });

        setProcessedUrl(result.url);
        setFeedback(aiFeedback);

    } catch (err) {
        console.error("Mix Error", err);
        setError("Processing failed. Please try again.");
    } finally {
        setProcessingState(null);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        {language === 'pt' ? 'Estúdio de Mixagem' : 'Mix & Master Engine'}
                    </h2>
                    <p className="text-zinc-700 dark:text-neutral-400">
                        {language === 'pt' 
                        ? 'Processamento de áudio profissional instantâneo com IA.'
                        : 'Instant professional audio processing powered by AI.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* PRIVACY BADGE */}
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-neutral-500 bg-zinc-100 dark:bg-neutral-800/50 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-neutral-800" title="Your audio is processed locally and never used for training">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        <span className="hidden sm:inline">{language === 'pt' ? 'Processamento Local Seguro' : 'Secure Local Processing'}</span>
                    </div>

                    {userPlan === 'free' && (
                        <div className="bg-zinc-100 dark:bg-neutral-800 px-4 py-2 rounded-full text-xs font-mono font-bold text-zinc-600 dark:text-zinc-500">
                            {usage.mixesToday} / {PLAN_LIMITS.free.maxMixesPerDay} {language === 'pt' ? 'Mixes Hoje' : 'Mixes Today'}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT: CONTROLS */}
            <div className="space-y-6">
                
                {/* Preset Selector */}
                <div className="space-y-3">
                    <label className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400">Mix Preset</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(MIX_PRESETS) as MixPreset[]).map((key) => {
                            const p = MIX_PRESETS[key];
                            const isLocked = p.premium && userPlan === 'free';
                            return (
                                <button
                                    key={key}
                                    onClick={() => isLocked ? onUpgrade() : setPreset(key)}
                                    className={`relative p-3 rounded-xl border text-left transition-all group ${
                                        preset === key 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-zinc-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-neutral-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold text-sm capitalize ${preset === key ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-800 dark:text-neutral-300'}`}>
                                            {p.name}
                                        </span>
                                        {isLocked && <Lock className="w-3 h-3 text-purple-500" />}
                                    </div>
                                    <p className="text-[10px] text-zinc-600 dark:text-zinc-500 leading-tight pr-2">{p.description}</p>
                                    
                                    {/* Hover hint for premium */}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                                            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">UPGRADE</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Upload Area */}
                {!file ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-48 border-2 border-dashed border-zinc-300 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-neutral-900 transition-all cursor-pointer bg-zinc-50/50 dark:bg-neutral-900/20"
                    >
                        <div className="p-4 bg-zinc-200 dark:bg-neutral-800 rounded-full">
                            <Upload className="w-8 h-8 text-zinc-500 dark:text-neutral-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-zinc-900 dark:text-white">
                                {language === 'pt' ? 'Carregar Áudio' : 'Upload Audio'}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">
                                {userPlan === 'free' ? 'Free: Max 2 mins' : 'Premium: Unlimited Length'}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-2 flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> Private & Encrypted
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <FileAudio className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 dark:text-white truncate">{file.name}</p>
                                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {fileDuration > 0 ? (fileDuration / 60).toFixed(1) : '...'} min</p>
                            </div>
                            <button onClick={() => { setFile(null); setProcessedUrl(null); }} className="text-zinc-400 hover:text-red-500"><RotateCcw className="w-5 h-5" /></button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {!processedUrl ? (
                            <button
                                onClick={processAudio}
                                disabled={!!processingState || !assistantEnabled}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all overflow-hidden relative ${
                                    processingState 
                                    ? 'bg-zinc-800 cursor-not-allowed' 
                                    : !assistantEnabled 
                                        ? 'bg-zinc-300 dark:bg-neutral-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                                }`}
                            >
                                {/* Progress Bar Background */}
                                {processingState && (
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-out opacity-20" 
                                        style={{ width: `${processingState.progress}%` }}
                                    ></div>
                                )}

                                {processingState ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="relative z-10">{processingState.status}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sliders className="w-5 h-5" />
                                        {!assistantEnabled 
                                            ? (language === 'pt' ? 'IA Pausada' : 'AI Paused')
                                            : (language === 'pt' ? 'Processar' : 'Process Track')}
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                        {language === 'pt' ? 'Mixagem Completa' : 'Mixing Complete'}
                                    </span>
                                </div>

                                {/* QUALITY ALERTS */}
                                {qualityStats && qualityStats.score < 80 && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-bold text-xs uppercase">
                                            <AlertTriangle className="w-4 h-4" />
                                            Audio Quality Alert
                                        </div>
                                        {qualityStats.clipping && (
                                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                High distortion detected. Try "Clean" or "Raw" preset.
                                            </p>
                                        )}
                                        {qualityStats.rms < 0.05 && (
                                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                Output volume is low. Consider "Loud" preset.
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={togglePlay}
                                    className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    {isPlaying ? 'Pause' : 'Play Result'}
                                </button>
                                
                                <a 
                                    href={processedUrl}
                                    download={`mixed-${preset}-${file.name}`}
                                    className="block w-full text-center py-3 border border-zinc-200 dark:border-neutral-800 rounded-xl font-bold text-zinc-600 dark:text-neutral-300 hover:bg-zinc-50 dark:hover:bg-neutral-800 transition"
                                >
                                    Download WAV
                                </a>
                                
                                <audio ref={audioRef} src={processedUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                            </div>
                        )}
                    </div>
                )}
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* RIGHT: FEEDBACK & UPGRADE HINT */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 relative overflow-hidden min-h-[300px] flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-32 h-32 text-white" />
                </div>

                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">
                    {language === 'pt' ? 'Relatório do Engenheiro' : 'Engineer Report'}
                </h3>

                {processingState ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                         <div className="relative w-20 h-20">
                             <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                             <div 
                                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                                style={{ animationDuration: '1.5s' }}
                             ></div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {/* LOGO IN LOADING STATE */}
                                 <BrandLogo className="w-8 h-8 opacity-80" fallbackClass="text-white text-xs" />
                             </div>
                         </div>
                         <div className="space-y-2">
                             <p className="text-white font-medium animate-pulse">{processingState.status}</p>
                             <div className="flex justify-center gap-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                             </div>
                         </div>
                    </div>
                ) : feedback ? (
                    <div className="flex-1 space-y-4 animate-in fade-in">
                        {/* Technical Stats Overlay */}
                        {qualityStats && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700">
                                    <div className="text-[10px] text-zinc-400 uppercase">Peak Level</div>
                                    <div className={`font-mono text-sm ${qualityStats.peak > 0.98 ? 'text-red-400' : 'text-green-400'}`}>
                                        {(qualityStats.peak * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700">
                                    <div className="text-[10px] text-zinc-400 uppercase">Loudness</div>
                                    <div className="font-mono text-sm text-blue-400">
                                        {(qualityStats.rms * 100).toFixed(1)} RMS
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                                {feedback}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-center p-6 border-2 border-dashed border-zinc-800 rounded-xl">
                        <Sliders className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">
                            {language === 'pt' 
                             ? 'Selecione um preset e carregue seu áudio.' 
                             : 'Select a preset and upload audio.'}
                        </p>
                        {userPlan === 'free' && (
                            <button onClick={onUpgrade} className="mt-4 px-4 py-2 bg-purple-900/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 hover:bg-purple-900/50 transition">
                                Get Premium Presets
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
