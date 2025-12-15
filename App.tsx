
import React, { useState, useEffect } from 'react';
import { Mic, BarChart2, BookOpen, User, Music, Video, Power, Sun, Moon, Settings, X, Volume2, Disc, PenTool, Sparkles, Sliders, Check, Crown, Lock, UserPen } from 'lucide-react';
import { ProducerTab } from './components/ProducerTab';
import { StatsTab } from './components/StatsTab';
import { VeoStudio } from './components/VeoStudio';
import { LiveSession } from './components/LiveSession';
import { StudioTab } from './components/StudioTab';
import { MixTab } from './components/MixTab';
import { VoiceTrainer } from './components/VoiceTrainer';
import { BrandLogo } from './components/BrandLogo';
import { AppTab, Language, VoiceSettings, VoiceGender, VoiceStyle, UserPlan, UserUsage } from './types';

// Settings Modal Component
const SettingsModal = ({ 
    isOpen, 
    onClose, 
    voiceSettings, 
    setVoiceSettings,
    language,
    setLanguage,
    onOpenTrainer,
    userPlan,
    producerName,
    setProducerName
}: { 
    isOpen: boolean; 
    onClose: () => void;
    voiceSettings: VoiceSettings;
    setVoiceSettings: (v: VoiceSettings) => void;
    language: Language;
    setLanguage: (l: Language) => void;
    onOpenTrainer: () => void;
    userPlan: UserPlan;
    producerName: string;
    setProducerName: (name: string) => void;
}) => {
    if (!isOpen) return null;

    const styles: VoiceStyle[] = ['calm', 'direct', 'motivational', 'studio', 'energetic'];

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-neutral-800 relative animate-in zoom-in-95 duration-200">
                
                {/* Header Banner for Logo Contrast */}
                <div className="bg-zinc-950 p-6 flex flex-col items-center justify-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-12 w-auto mb-2">
                        <BrandLogo className="h-full w-auto" fallbackClass="text-xl text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        System Settings
                    </h2>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {/* Language Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-zinc-600 dark:text-neutral-500 tracking-wider">Language / Idioma</label>
                        <div className="flex bg-zinc-100 dark:bg-neutral-800 rounded-xl p-1">
                            <button 
                                onClick={() => setLanguage('pt')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${language === 'pt' ? 'bg-white dark:bg-neutral-700 shadow text-purple-600 dark:text-purple-300' : 'text-zinc-600 dark:text-neutral-400'}`}
                            >
                                Português
                            </button>
                            <button 
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-neutral-700 shadow text-purple-600 dark:text-purple-300' : 'text-zinc-600 dark:text-neutral-400'}`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-neutral-800" />

                    {/* Producer Name Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-zinc-600 dark:text-neutral-500 tracking-wider flex items-center gap-2">
                            <UserPen className="w-3 h-3" />
                            Producer Identity
                        </label>
                        <input 
                            type="text" 
                            value={producerName}
                            onChange={(e) => setProducerName(e.target.value)}
                            placeholder="Name your AI Producer (e.g. Metro, Dr. Dre...)"
                            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400"
                            maxLength={25}
                        />
                        <p className="text-[10px] text-zinc-500">This name will be used in all conversations.</p>
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-neutral-800" />

                    {/* Voice Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase text-zinc-600 dark:text-neutral-500 tracking-wider">Voice Profile</label>
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                {voiceSettings.style === 'custom' ? `Identity: ${voiceSettings.customVoiceName}` : voiceSettings.gender === 'masculine' ? 'Fenrir/Puck Core' : 'Kore/Zephyr Core'}
                            </span>
                        </div>
                        
                        {/* Custom Voice Trigger */}
                        <div 
                             onClick={() => userPlan === 'premium' ? onOpenTrainer() : null}
                             className={`p-4 rounded-xl border-2 border-dashed transition-all mb-4 group ${
                                 userPlan === 'premium' 
                                 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 cursor-pointer' 
                                 : 'bg-zinc-50 dark:bg-neutral-800 border-zinc-200 dark:border-neutral-700 opacity-70 cursor-not-allowed'
                             }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${voiceSettings.style === 'custom' ? 'bg-purple-500 text-white' : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-600 dark:text-zinc-400'}`}>
                                        {userPlan === 'premium' ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                            Voice Identity Trainer
                                            <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded font-black">PRO</span>
                                        </div>
                                        <div className="text-xs text-zinc-600 dark:text-neutral-400">
                                            {userPlan === 'premium' 
                                              ? (voiceSettings.style === 'custom' ? 'Custom identity active' : 'Train your exclusive AI voice')
                                              : 'Upgrade to unlock voice cloning'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setVoiceSettings({...voiceSettings, gender: 'masculine'})}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${voiceSettings.gender === 'masculine' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-zinc-200 dark:border-neutral-800 text-zinc-600 dark:text-neutral-400'}`}
                            >
                                Masculine
                            </button>
                            <button
                                onClick={() => setVoiceSettings({...voiceSettings, gender: 'feminine'})}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${voiceSettings.gender === 'feminine' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-zinc-200 dark:border-neutral-800 text-zinc-600 dark:text-neutral-400'}`}
                            >
                                Feminine
                            </button>
                        </div>

                        {/* Style */}
                        <div className="space-y-2">
                             <label className="text-xs text-zinc-500 dark:text-neutral-500 font-bold uppercase tracking-wide">Speaking Style</label>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {styles.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setVoiceSettings({...voiceSettings, style: s})}
                                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all capitalize ${
                                            voiceSettings.style === s 
                                            ? 'border-purple-500/50 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300' 
                                            : 'border-transparent bg-zinc-50 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 hover:bg-zinc-100 dark:hover:bg-neutral-700 hover:text-zinc-900 dark:hover:text-neutral-200'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button onClick={onClose} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Premium Modal
const PremiumModal = ({ isOpen, onClose, onUpgrade }: { isOpen: boolean; onClose: () => void; onUpgrade: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 border border-purple-500/30">
                 <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white z-10">
                    <X className="w-6 h-6" />
                 </button>

                 <div className="bg-gradient-to-br from-purple-700 to-indigo-800 p-8 text-white text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                     
                     {/* PREMIUM LOGO PLACEMENT */}
                     <div className="h-16 w-auto mx-auto mb-4 drop-shadow-2xl">
                        <BrandLogo className="h-full w-auto" fallbackClass="text-2xl text-white" />
                     </div>

                     <h2 className="text-3xl font-black tracking-tight mb-2">ArtisticLab AI PREMIUM</h2>
                     <p className="text-purple-200 font-medium">Unlock your full artistic potential.</p>
                 </div>

                 <div className="p-8 space-y-6">
                     <div className="space-y-4">
                         {[
                             "Unlimited AI Mix & Master (No daily limits)",
                             "Access all 4 Mix Presets (Raw, Loud, Dark)",
                             "Voice Identity Cloning (Train your own AI)",
                             "Unlimited Recording Length",
                             "Priority Processing Speed"
                         ].map((benefit, i) => (
                             <div key={i} className="flex items-center gap-3">
                                 <div className="p-1 bg-green-500/10 rounded-full">
                                     <Check className="w-4 h-4 text-green-500" />
                                 </div>
                                 <span className="text-zinc-800 dark:text-zinc-300 font-medium text-sm">{benefit}</span>
                             </div>
                         ))}
                     </div>

                     <button 
                        onClick={onUpgrade}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02]"
                     >
                        Upgrade Now - $9.99/mo
                     </button>
                     <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">Cancel anytime. Secure payment.</p>
                 </div>
             </div>
        </div>
    );
};

export default function App() {
  const [language, setLanguage] = useState<Language | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PRODUCER);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceTrainer, setShowVoiceTrainer] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Producer Identity State
  const [producerName, setProducerName] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('producerName') || "ArtisticLab AI";
      }
      return "ArtisticLab AI";
  });

  // User Plan State
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [usage, setUsage] = useState<UserUsage>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('trapmind_usage');
          if (saved) return JSON.parse(saved);
      }
      return { mixesToday: 0, lastMixDate: new Date().toISOString().split('T')[0] };
  });

  // Reset daily limits
  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      if (usage.lastMixDate !== today) {
          const newUsage = { mixesToday: 0, lastMixDate: today };
          setUsage(newUsage);
          localStorage.setItem('trapmind_usage', JSON.stringify(newUsage));
      }
  }, []);

  const incrementUsage = () => {
      const newUsage = { ...usage, mixesToday: usage.mixesToday + 1 };
      setUsage(newUsage);
      localStorage.setItem('trapmind_usage', JSON.stringify(newUsage));
  };

  const handleUpgrade = () => {
      setUserPlan('premium');
      setShowPremiumModal(false);
      alert("Welcome to Premium! (Simulation)");
  };

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved as 'dark' | 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Voice State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('voiceSettings');
          if (saved) return JSON.parse(saved);
      }
      return { gender: 'masculine', style: 'direct' };
  });

  // Global Assistant State with Persistence
  const [assistantEnabled, setAssistantEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('assistantEnabled');
    return saved !== 'false'; // Default to true
  });

  useEffect(() => {
    localStorage.setItem('assistantEnabled', assistantEnabled.toString());
  }, [assistantEnabled]);

  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    // Basic validation to prevent empty name
    if (producerName.trim().length === 0) return;
    localStorage.setItem('producerName', producerName);
  }, [producerName]);

  // Apply Theme Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleAssistant = () => {
    const newState = !assistantEnabled;
    setAssistantEnabled(newState);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 1. Splash Screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center flex-col animate-out fade-out duration-500 delay-[2000ms]">
         <div className="relative w-48 h-48 md:w-64 md:h-64 animate-in zoom-in-50 duration-700 ease-out">
            <BrandLogo className="w-full h-full" fallbackClass="text-3xl text-white flex-col" />
         </div>
         <div className="mt-8 flex items-center gap-2 text-neutral-500 animate-pulse">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-mono tracking-widest uppercase">Initializing AI Core</span>
         </div>
      </div>
    );
  }

  // 2. Language Selection (First Time)
  if (!language) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-500 transition-colors">
         {/* Language Selection Logo - Background Adjusted for Contrast if needed */}
         <div className="w-40 md:w-56 p-4 transition-transform hover:scale-105 duration-300">
             <BrandLogo className="w-full h-auto dark:invert-0 invert" fallbackClass="text-4xl text-zinc-900 dark:text-white flex-col" />
         </div>
         
         <div className="text-center space-y-2">
             <p className="text-zinc-700 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Your AI Artistic Producer & Career Mentor. <br/> 
                Select your language to begin.
             </p>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button 
              onClick={() => setLanguage('pt')} 
              className="group flex-1 py-5 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-neutral-800 transition-all duration-300 relative overflow-hidden shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-bold text-zinc-900 dark:text-white relative z-10">Português</span>
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className="group flex-1 py-5 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-neutral-800 transition-all duration-300 relative overflow-hidden shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-bold text-zinc-900 dark:text-white relative z-10">English</span>
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white flex flex-col overflow-hidden transition-colors duration-300">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        voiceSettings={voiceSettings}
        setVoiceSettings={setVoiceSettings}
        language={language}
        setLanguage={setLanguage}
        onOpenTrainer={() => { setShowSettings(false); setShowVoiceTrainer(true); }}
        userPlan={userPlan}
        producerName={producerName}
        setProducerName={setProducerName}
      />

      {showVoiceTrainer && (
         <VoiceTrainer 
            onClose={() => setShowVoiceTrainer(false)}
            voiceSettings={voiceSettings}
            setVoiceSettings={setVoiceSettings}
         />
      )}

      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />

      {/* 
         DESIGN RULE: Header is ALWAYS DARK to complement the Official Logo 
         regardless of the system theme. This ensures visibility of the white/gradient logo.
      */}
      <header className="h-20 border-b border-zinc-800 bg-neutral-950 flex items-center justify-between px-6 z-20 sticky top-0">
         <div className="h-10 md:h-12 w-auto flex items-center gap-4">
            {/* OFFICIAL LOGO */}
            <BrandLogo className="h-full w-auto" fallbackClass="text-xl text-white" />
            
            <button 
                onClick={() => setShowPremiumModal(true)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-lg ${
                    userPlan === 'premium' 
                    ? 'bg-zinc-900 text-purple-400 border border-purple-500/50' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-purple-500/20'
                }`}
            >
                {userPlan === 'premium' ? <Check className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                {userPlan === 'premium' ? 'Premium Active' : 'Get Premium'}
            </button>
         </div>

         <div className="flex items-center gap-2 md:gap-3">
             <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                title="Toggle Theme"
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>

             <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                title="Settings"
             >
                <Settings className="w-4 h-4" />
             </button>

             <button 
                onClick={toggleAssistant}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${
                    assistantEnabled 
                    ? 'bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                }`}
             >
                <Power className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:block">
                    {assistantEnabled ? 'ON' : 'OFF'}
                </span>
             </button>

             <button 
                onClick={() => setIsLiveOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95"
             >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline tracking-wide">LIVE</span>
             </button>
         </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
         {activeTab === AppTab.PRODUCER && (
            <ProducerTab 
                language={language} 
                assistantEnabled={assistantEnabled} 
                voiceSettings={voiceSettings}
                producerName={producerName}
            />
         )}
         {activeTab === AppTab.GROWTH && <StatsTab language={language} />}
         {activeTab === AppTab.VEO && (
            <VeoStudio 
                language={language} 
                assistantEnabled={assistantEnabled} 
            />
         )}
         {activeTab === AppTab.STUDIO && (
             <StudioTab 
                 language={language}
                 assistantEnabled={assistantEnabled}
                 voiceSettings={voiceSettings}
                 producerName={producerName}
             />
         )}
         {activeTab === AppTab.MIX && (
             <MixTab 
                 language={language}
                 assistantEnabled={assistantEnabled}
                 userPlan={userPlan}
                 usage={usage}
                 incrementUsage={incrementUsage}
                 onUpgrade={() => setShowPremiumModal(true)}
             />
         )}
         
         {activeTab === AppTab.DIARY && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-neutral-500 gap-4">
                <BookOpen className="w-12 h-12 opacity-20" />
                <span>Diary Feature Locked</span>
            </div>
         )}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-24 border-t border-zinc-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur flex items-center justify-around pb-6 px-2 z-20 transition-colors">
         <NavButton active={activeTab === AppTab.PRODUCER} onClick={() => setActiveTab(AppTab.PRODUCER)} icon={User} label="Producer" />
         <NavButton active={activeTab === AppTab.GROWTH} onClick={() => setActiveTab(AppTab.GROWTH)} icon={BarChart2} label="Stats" />
         <div className="w-px h-8 bg-zinc-200 dark:bg-neutral-800 mx-2 transition-colors"></div>
         <NavButton active={activeTab === AppTab.VEO} onClick={() => setActiveTab(AppTab.VEO)} icon={Video} label="Visuals" />
         <NavButton active={activeTab === AppTab.STUDIO} onClick={() => setActiveTab(AppTab.STUDIO)} icon={Disc} label="Studio" />
         <NavButton active={activeTab === AppTab.MIX} onClick={() => setActiveTab(AppTab.MIX)} icon={Sliders} label="Mix" />
      </nav>

      {isLiveOpen && (
          <LiveSession 
            onClose={() => setIsLiveOpen(false)} 
            language={language} 
            assistantEnabled={assistantEnabled}
            setAssistantEnabled={setAssistantEnabled}
            voiceSettings={voiceSettings}
            producerName={producerName}
          />
      )}
    </div>
  );
}

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${active ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' : 'text-zinc-500 dark:text-neutral-500 hover:text-zinc-900 dark:hover:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-900'}`}
    >
        <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
    </button>
);
