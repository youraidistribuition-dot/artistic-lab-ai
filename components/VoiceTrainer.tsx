
import React, { useState, useRef } from 'react';
import { Mic, Upload, Play, CheckCircle2, Lock, Sparkles, Activity, X, Shield } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { VoiceSettings } from '../types';
import { BrandLogo } from './BrandLogo';

interface VoiceTrainerProps {
  onClose: () => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (v: VoiceSettings) => void;
}

export const VoiceTrainer: React.FC<VoiceTrainerProps> = ({ onClose, voiceSettings, setVoiceSettings }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [samples, setSamples] = useState<File[]>([]);
  const [customName, setCustomName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSamples([...samples, file]);
    }
  };

  const startTraining = async () => {
    if (samples.length === 0 || !customName) return;
    
    setIsProcessing(true);
    setStep(2);

    // Mock Analysis
    await audioEngine.analyzeUpload(samples[0]);
    
    // Simulate Training Delay
    setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
    }, 4000);
  };

  const saveProfile = () => {
    setVoiceSettings({
        ...voiceSettings,
        style: 'custom',
        customVoiceId: `custom-${Date.now()}`,
        customVoiceName: customName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 overflow-hidden">
        {/* BACKGROUND BRANDING ACCENT */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"><X /></button>

        {/* LOGO HEADER */}
        <div className="mb-6 flex items-start justify-between">
             <div className="flex items-center gap-3">
                <div className="h-8 w-auto">
                    <BrandLogo className="h-full w-auto" />
                </div>
                <div className="h-6 w-px bg-zinc-700"></div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    AI Voice Lab
                </span>
             </div>
        </div>

        <div className="mb-8 flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Sparkles className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Voice Identity Trainer</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 uppercase font-bold tracking-wider">Premium</span>
                    <span className="text-zinc-500 text-xs">Clone Your Voice</span>
                </div>
            </div>
        </div>

        {step === 1 && (
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm text-zinc-400 font-bold uppercase">Identity Name</label>
                    <input 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. My Artist Voice"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-sm text-zinc-400 font-bold uppercase">Training Samples</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors bg-zinc-950/50"
                    >
                        <Upload className="w-8 h-8 text-zinc-600" />
                        <div className="text-center">
                            <p className="text-zinc-300 font-medium">Upload clear vocal recordings</p>
                            <p className="text-zinc-500 text-xs mt-1">WAV/MP3. No background music.</p>
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" hidden accept="audio/*" onChange={handleFileUpload} />
                    
                    {samples.length > 0 && (
                        <div className="space-y-2">
                            {samples.map((s, i) => (
                                <div key={i} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                    <Mic className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-white flex-1 truncate">{s.name}</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <button 
                        onClick={startTraining}
                        disabled={!customName || samples.length === 0}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity mb-4"
                    >
                        Initialize Training
                    </button>
                    <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3" />
                        Your voice data is never shared or used for global training.
                    </p>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                    <div className="absolute inset-0 rounded-full border-t-4 border-purple-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrandLogo className="w-10 h-10 opacity-50" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing Vocal Patterns</h3>
                    <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                        Extracting tone, cadence, and frequency response...
                    </p>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Voice Profile Ready</h3>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-6">
                        Your custom voice identity <strong>"{customName}"</strong> has been successfully trained and mixed.
                    </p>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left mb-6">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs text-zinc-500 uppercase font-bold">Parameters Learned</span>
                             <span className="text-xs text-green-500 font-mono">100%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full"></div>
                        </div>
                    </div>
                    <button 
                        onClick={saveProfile}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20"
                    >
                        Activate Voice Identity
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
