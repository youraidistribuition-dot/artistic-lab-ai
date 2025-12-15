
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Activity, Volume2, Power } from 'lucide-react';
import { LIVE_MODEL, SYSTEM_PROMPT, VOICE_MAP } from '../constants';
import { Language, VoiceSettings } from '../types';
import { BrandLogo } from './BrandLogo';

interface LiveSessionProps {
  onClose: () => void;
  language: Language;
  assistantEnabled: boolean;
  setAssistantEnabled: (enabled: boolean) => void;
  voiceSettings: VoiceSettings;
  producerName: string;
}

// Audio helpers
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const len = new Uint8Array(int16.buffer).byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose, language, assistantEnabled, setAssistantEnabled, voiceSettings, producerName }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed' | 'paused'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Clean up refs
  const sessionRef = useRef<any>(null); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Connection Logic
  useEffect(() => {
    // IF PAUSED, DO NOT CONNECT
    if (!assistantEnabled) {
        setStatus('paused');
        return;
    }

    let cleanup = () => {};

    const startSession = async () => {
      setStatus('connecting');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        inputContextRef.current = inputAudioContext;
        audioContextRef.current = outputAudioContext;

        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Resolve voice
        const genderMap = VOICE_MAP[voiceSettings.gender];
        const voiceName = genderMap[voiceSettings.style] || 'Zephyr'; // Default fallback

        const sessionPromise = ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: SYSTEM_PROMPT(language, producerName) + "\nAUDIO RULES: If audio is unclear, ASK FOR CLARIFICATION immediately. Do NOT stay silent. Prioritize speed.",
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
          },
          callbacks: {
            onopen: () => {
              setStatus('connected');
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                if (isMuted) return; 
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                
                // Visualizer math
                let sum = 0;
                for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session: any) => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                   decode(base64Audio),
                   outputAudioContext,
                   24000,
                   1
                 );
                 
                 const source = outputAudioContext.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
              }

              const interrupted = message.serverContent?.interrupted;
              if (interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              setStatus('closed');
            },
            onerror: (err) => {
              console.error(err);
              setStatus('error');
            }
          }
        });
        
        sessionRef.current = sessionPromise;

        cleanup = () => {
            sessionPromise.then((s: any) => s.close());
            stream.getTracks().forEach(t => t.stop());
            inputAudioContext.close();
            outputAudioContext.close();
        };

      } catch (err) {
        console.error("Failed to start live session", err);
        setStatus('error');
      }
    };

    startSession();

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, assistantEnabled, voiceSettings, producerName]); 

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // RENDER PAUSED STATE
  if (status === 'paused') {
      return (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 transition-colors">
            {/* LOGO BRANDING */}
            <div className="absolute top-6 left-6 h-8 opacity-60">
                <BrandLogo className="h-full w-auto dark:invert-0 invert" fallbackClass="text-zinc-900 dark:text-white" />
            </div>

            <div className="absolute top-6 right-6">
                <button onClick={onClose} className="p-3 bg-zinc-200 dark:bg-neutral-800 text-zinc-600 dark:text-white rounded-full hover:bg-zinc-300 dark:hover:bg-neutral-700 transition">
                    <PhoneOff className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-neutral-800 flex items-center justify-center border-4 border-zinc-200 dark:border-neutral-700">
                    <Power className="w-10 h-10 text-zinc-400 dark:text-neutral-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        {language === 'pt' ? 'Assistente Pausado' : 'Assistant Paused'}
                    </h2>
                    <p className="text-zinc-600 dark:text-neutral-400">
                        {language === 'pt' 
                         ? 'Ative o assistente para iniciar a sessão ao vivo.' 
                         : 'Enable the assistant to start the live session.'}
                    </p>
                </div>
                <button 
                    onClick={() => setAssistantEnabled(true)}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2"
                >
                    <Power className="w-5 h-5" />
                    {language === 'pt' ? 'Ativar Agora' : 'Enable Now'}
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 transition-colors">
      {/* LOGO BRANDING */}
      <div className="absolute top-6 left-6 h-8 opacity-80">
          <BrandLogo className="h-full w-auto dark:invert-0 invert" fallbackClass="text-zinc-900 dark:text-white" />
      </div>

      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full hover:bg-red-200 dark:hover:bg-red-500/20 transition">
            <PhoneOff className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${status === 'connected' ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.4)]' : 'border-zinc-200 dark:border-neutral-700'}`}>
                {status === 'connecting' && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>}
                {status === 'connected' && (
                    <div className="w-full h-full rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                         <Activity className="w-16 h-16 text-purple-600 dark:text-purple-500 animate-pulse" style={{ opacity: 0.5 + volume * 5 }} />
                    </div>
                )}
                {status === 'error' && <span className="text-red-500 font-bold">ERR</span>}
            </div>
            {/* Pulsing rings */}
            {status === 'connected' && (
                <>
                  <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[ping_2s_linear_infinite]"></div>
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-[ping_3s_linear_infinite_0.5s]"></div>
                </>
            )}
        </div>

        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {language === 'pt' ? 'Sessão ao Vivo' : 'Live Session'}
            </h2>
            <p className="text-zinc-600 dark:text-neutral-400">
                {status === 'connecting' ? `Connecting to ${producerName}...` : 
                 status === 'connected' ? 'Listening...' : 'Connection Failed'}
            </p>
             <div className="text-xs text-purple-500 font-medium bg-purple-100 dark:bg-purple-900/20 py-1 px-3 rounded-full inline-block mt-2">
                Voice: {voiceSettings.gender === 'masculine' ? 'Masculine' : 'Feminine'} / {voiceSettings.style}
             </div>
        </div>

        <div className="flex gap-6">
             <button 
                onClick={toggleMute}
                className={`p-6 rounded-full transition-all duration-200 ${isMuted ? 'bg-red-500 text-white' : 'bg-zinc-200 dark:bg-neutral-800 text-zinc-700 dark:text-white hover:bg-zinc-300 dark:hover:bg-neutral-700'}`}
             >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
             </button>
        </div>
      </div>
    </div>
  );
};
