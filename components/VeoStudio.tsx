
import React, { useState, useEffect } from 'react';
import { Video, Loader2, Play, AlertCircle, PowerOff, Sparkles } from 'lucide-react';
import { generateVideo } from '../services/geminiService';
import { BrandLogo } from './BrandLogo';
import { Language } from '../types';

interface VeoStudioProps {
  language: Language;
  assistantEnabled: boolean;
}

export const VeoStudio: React.FC<VeoStudioProps> = ({ language, assistantEnabled }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // USER FEEDBACK: Cycling loading messages
  const [loadingPhase, setLoadingPhase] = useState(0);
  const LOADING_MSGS = language === 'pt' 
      ? ['Iniciando Veo Engine...', 'Alocando GPU...', 'Renderizando Frames...', 'Refinando Detalhes...', 'Finalizando Output...']
      : ['Initializing Veo Engine...', 'Allocating GPU...', 'Rendering Frames...', 'Refining Details...', 'Finalizing Output...'];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
        setLoadingPhase(0);
        interval = setInterval(() => {
            setLoadingPhase(p => (p + 1) % LOADING_MSGS.length);
        }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading, language]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!assistantEnabled) return; // Block trigger
    
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
        
        const url = await generateVideo(prompt, aspectRatio, process.env.API_KEY!);
        setVideoUrl(url);

    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes("Requested entity was not found")) {
             setError(language === 'pt' ? "Erro de chave API. Selecione novamente." : "API Key Error. Please select again.");
             if (window.aistudio) await window.aistudio.openSelectKey();
        } else {
            setError(language === 'pt' ? "Falha ao gerar vídeo. Tente novamente." : "Failed to generate video. Try again.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-500 bg-clip-text text-transparent transition-colors">
          Veo Visual Studio
        </h2>
        <p className="text-zinc-700 dark:text-neutral-400">
          {language === 'pt' 
            ? "Crie visualizers incríveis para suas faixas usando IA."
            : "Create incredible visualizers for your tracks using AI."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-neutral-300">
                    {language === 'pt' ? 'Descreva o visual' : 'Describe the visual'}
                </label>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={!assistantEnabled}
                        placeholder={
                            !assistantEnabled
                            ? (language === 'pt' ? "Assistente Pausado. Ative para gerar." : "Assistant Paused. Turn ON to generate.")
                            : (language === 'pt' 
                                ? "Ex: Um rapper caminhando por uma cidade cyberpunk chuvosa, luzes neon, cinematográfico..." 
                                : "Ex: A rapper walking through a rainy cyberpunk city, neon lights, cinematic...")
                        }
                        className={`w-full h-32 bg-white dark:bg-neutral-900 border rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none resize-none transition-all placeholder-zinc-500 dark:placeholder-neutral-600 ${
                            !assistantEnabled 
                            ? 'border-zinc-200 dark:border-neutral-800 text-zinc-500 dark:text-neutral-500 cursor-not-allowed' 
                            : 'border-zinc-300 dark:border-neutral-800 focus:ring-2 focus:ring-purple-500'
                        }`}
                    />
                    {!assistantEnabled && (
                        <div className="absolute top-4 right-4 text-zinc-400 dark:text-neutral-600">
                            <PowerOff className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                 <label className="text-sm font-bold text-zinc-800 dark:text-neutral-300">Aspect Ratio</label>
                 <div className="flex gap-4">
                     <button 
                        onClick={() => setAspectRatio('16:9')}
                        disabled={!assistantEnabled}
                        className={`px-4 py-2 rounded-lg border transition-all font-medium ${
                            !assistantEnabled ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800' :
                            aspectRatio === '16:9' ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-white dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800 text-zinc-700 dark:text-neutral-400'
                        }`}
                     >
                        16:9 (Landscape)
                     </button>
                     <button 
                        onClick={() => setAspectRatio('9:16')}
                        disabled={!assistantEnabled}
                        className={`px-4 py-2 rounded-lg border transition-all font-medium ${
                            !assistantEnabled ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800' :
                            aspectRatio === '9:16' ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-white dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800 text-zinc-700 dark:text-neutral-400'
                        }`}
                     >
                        9:16 (Stories/Reels)
                     </button>
                 </div>
            </div>

            <div className="pt-4">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt || !assistantEnabled}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                        !assistantEnabled 
                        ? 'bg-zinc-300 dark:bg-neutral-800 text-zinc-500 dark:text-neutral-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-900/20 hover:shadow-purple-900/40 disabled:opacity-50'
                    }`}
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : !assistantEnabled ? <PowerOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    {assistantEnabled 
                        ? (language === 'pt' ? 'Gerar Visualizer' : 'Generate Visualizer')
                        : (language === 'pt' ? 'IA Pausada' : 'AI Paused')}
                </button>
                <p className="mt-2 text-xs text-center text-zinc-600 dark:text-neutral-500">
                   {language === 'pt' ? 'Requer API Key paga. Pode levar 1-2 min.' : 'Requires paid API Key. Takes 1-2 min.'}
                </p>
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>

        <div className="bg-zinc-100 dark:bg-neutral-900 rounded-2xl border border-zinc-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden min-h-[300px] relative group transition-colors">
            {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-purple-600 dark:text-purple-300 animate-in zoom-in-95 duration-500">
                    <div className="relative">
                        <div className="w-16 h-16 animate-pulse">
                            <BrandLogo className="w-full h-full dark:invert-0 invert" fallbackClass="text-zinc-900 dark:text-white flex-col text-[10px]" />
                        </div>
                        <Sparkles className="w-5 h-5 absolute -top-1 -right-1 animate-pulse text-purple-400" />
                    </div>
                    
                    {/* CYCLING STATUS MESSAGES */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold animate-pulse text-center px-4" key={loadingPhase}>
                            {LOADING_MSGS[loadingPhase]}
                        </span>
                        <div className="flex gap-1 mt-2">
                             {LOADING_MSGS.map((_, i) => (
                                 <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === loadingPhase ? 'bg-purple-500 scale-125' : 'bg-zinc-300 dark:bg-neutral-700'}`}></div>
                             ))}
                        </div>
                    </div>
                </div>
            ) : videoUrl ? (
                <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain"
                />
            ) : (
                <div className="text-zinc-500 dark:text-neutral-600 flex flex-col items-center gap-2">
                    <Video className="w-12 h-12" />
                    <span>{language === 'pt' ? 'Pré-visualização' : 'Preview Area'}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
