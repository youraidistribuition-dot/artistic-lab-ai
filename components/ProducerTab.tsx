
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Play, Square, BrainCircuit, Search, MapPin, Loader, Info, PowerOff, Trash2, Mic2 } from 'lucide-react';
import { sendMessageStream, transcribeAudio, generateSpeech } from '../services/geminiService';
import { audioEngine } from '../services/audioEngine';
import { Message, Language, VoiceSettings } from '../types';
import { VOICE_MAP } from '../constants';

interface ProducerTabProps {
  language: Language;
  assistantEnabled: boolean;
  voiceSettings: VoiceSettings;
  producerName: string;
}

export const ProducerTab: React.FC<ProducerTabProps> = ({ language, assistantEnabled, voiceSettings, producerName }) => {
  // INITIALIZE STATE FROM LOCAL STORAGE
  const [messages, setMessages] = useState<Message[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('trapmind_chat_history');
          if (saved) {
              try {
                  return JSON.parse(saved);
              } catch (e) {
                  console.error("Failed to parse chat history");
              }
          }
      }
      return [{
        id: 'welcome',
        role: 'model',
        content: language === 'pt' 
          ? `E aí. Eu sou o ${producerName}, seu produtor. Qual a visão pra hoje?` 
          : `Yo. I'm ${producerName}, your producer. What's the vision for today?`,
        timestamp: Date.now()
      }];
  });

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(''); // USER FEEDBACK STATE
  
  const [isRecording, setIsRecording] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // PERSIST MESSAGES TO LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem('trapmind_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // MANUAL MEMORY RESET
  const clearHistory = () => {
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: language === 'pt' 
          ? "Memória limpa. Vamos começar do zero." 
          : "Memory cleared. Let's start fresh.",
        timestamp: Date.now(),
        metadata: { isSystem: true }
      };
      setMessages([welcomeMsg]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setProcessingStatus('');

    // --- ASSISTANT PAUSED CHECK ---
    if (!assistantEnabled) {
        setTimeout(() => {
            const systemMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: language === 'pt' 
                    ? "⚠️ Seu assistente IA está pausado. Ative-o para continuar." 
                    : "⚠️ Your AI Assistant is currently paused. Turn it on to continue.",
                timestamp: Date.now(),
                metadata: { isSystem: true }
            };
            setMessages(prev => [...prev, systemMsg]);
        }, 300);
        return;
    }

    setIsProcessing(true);

    // Create a placeholder message for streaming content
    const responseId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        content: '', // Start empty
        timestamp: Date.now()
    }]);

    try {
      let mode: 'fast' | 'standard' | 'deep' = 'standard';
      let grounding: 'search' | 'maps' | undefined = undefined;

      if (useThinking) mode = 'deep';
      else if (inputText.toLowerCase().includes('studio') || inputText.toLowerCase().includes('estúdio') || inputText.toLowerCase().includes('venue')) {
          grounding = 'maps';
      } else if (inputText.toLowerCase().includes('news') || inputText.toLowerCase().includes('trend') || inputText.toLowerCase().includes('latest') || inputText.toLowerCase().includes('lançamento')) {
          grounding = 'search';
      } else if (inputText.length < 50 && !useThinking) {
          // PERFORMANCE: Default to fast model for short queries
          mode = 'fast';
      }

      // Stream the response
      const stream = sendMessageStream({
        message: userMsg.content,
        // Send filtered history to avoid token overload
        history: messages.filter(m => !m.metadata?.isSystem).map(m => ({ role: m.role, content: m.content })),
        language,
        mode,
        useGrounding: grounding,
        location,
        producerName
      });

      let fullText = '';
      
      for await (const chunk of stream) {
          fullText += chunk.text;
          
          setMessages(prev => prev.map(msg => {
              if (msg.id === responseId) {
                  return {
                      ...msg,
                      content: fullText,
                      metadata: chunk.groundingMetadata ? { groundingChunks: chunk.groundingMetadata.groundingChunks } : msg.metadata
                  };
              }
              return msg;
          }));
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => {
          // If error occurs, update the last message or add error
          return prev.map(msg => {
              if (msg.id === responseId) {
                  return {
                      ...msg,
                      content: msg.content + (language === 'pt' ? '\n(Erro de conexão. Tente novamente.)' : '\n(Connection error. Try again.)'),
                      metadata: { isSystem: true }
                  };
              }
              return msg;
          });
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = async () => {
    if (!assistantEnabled) return; 

    if (!isRecording) {
      setIsRecording(true);
      // In a real implementation this would start the mic stream
      // Here we simulate triggering file input as "stopping"
    } else {
      setIsRecording(false);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
           setIsProcessing(true);
           setProcessingStatus(language === 'pt' ? 'Ouvindo & Transcrevendo...' : 'Listening & Transcribing...');
           try {
             const text = await transcribeAudio(file);
             
             if (!text || text.trim().length === 0) {
                 const failMsg: Message = {
                     id: Date.now().toString(),
                     role: 'model',
                     content: language === 'pt' 
                        ? "Não peguei essa. Pode repetir?" 
                        : "I might've missed that — can you say it again real quick?",
                     timestamp: Date.now(),
                     metadata: { isSystem: true }
                 };
                 setMessages(prev => [...prev, failMsg]);
             } else {
                 setInputText(text);
             }
           } catch (e) {
             console.error(e);
             setMessages(prev => [...prev, {
                 id: Date.now().toString(),
                 role: 'model',
                 content: language === 'pt' ? "Erro no áudio. Digita pra mim?" : "Audio glitch. Can you type it?",
                 timestamp: Date.now(),
                 metadata: { isSystem: true }
             }]);
           } finally {
             setIsProcessing(false);
             setProcessingStatus('');
           }
        }
      };
      input.click();
    }
  };

  const playTTS = async (text: string) => {
    if (!assistantEnabled || isPlayingAudio) return; 

    try {
      setIsPlayingAudio(true);
      // Resolve voice name from map
      let voiceName = 'Fenrir';
      let options = {};

      if (voiceSettings.style === 'custom') {
          // Simulate Custom Identity using Pitch/Rate modifications on a base voice
          voiceName = voiceSettings.gender === 'masculine' ? 'Fenrir' : 'Kore'; 
          options = { pitch: -150, speed: 0.95 }; // Deeper, slower for "Identity" effect
      } else {
          const genderMap = VOICE_MAP[voiceSettings.gender];
          voiceName = genderMap[voiceSettings.style] || genderMap['direct'];
      }

      const audioBase64 = await generateSpeech(text, voiceName);
      
      // Use Audio Engine to play mixed version
      await audioEngine.play(audioBase64, options);
      
      setIsPlayingAudio(false);

    } catch (err) {
      console.error("TTS Error", err);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Header / Mode Toggles */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-neutral-800 transition-colors">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${assistantEnabled ? 'bg-green-500 animate-pulse' : 'bg-zinc-400 dark:bg-neutral-600'}`}></div>
            <span className="text-xs font-mono text-zinc-600 dark:text-neutral-400">
                {assistantEnabled ? 'ONLINE' : 'OFFLINE'}
            </span>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={clearHistory}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title={language === 'pt' ? 'Limpar Memória' : 'Clear Memory'}
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <button 
                onClick={() => assistantEnabled && setUseThinking(!useThinking)}
                disabled={!assistantEnabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    !assistantEnabled 
                        ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-neutral-800 text-zinc-500 dark:text-neutral-500'
                        : useThinking 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 hover:bg-zinc-200 dark:hover:bg-neutral-700'
                }`}
            >
                <BrainCircuit className="w-3 h-3" />
                {language === 'pt' ? 'Modo Estratégia' : 'Strategy Mode'}
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-2`}>
                <div className={`p-4 rounded-2xl transition-colors ${
                    msg.metadata?.isSystem 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200' 
                        : msg.role === 'user' 
                            ? 'bg-zinc-200 dark:bg-neutral-800 text-zinc-900 dark:text-white rounded-br-none' 
                            : 'bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-900/50 dark:to-purple-900/50 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-50 rounded-bl-none'
                }`}>
                    <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                        {msg.content}
                        {msg.role === 'model' && isProcessing && msg.content === '' && (
                            <span className="inline-block w-1.5 h-4 bg-purple-500 ml-1 animate-pulse align-middle"></span>
                        )}
                    </p>
                    
                    {/* Grounding Sources */}
                    {msg.metadata?.groundingChunks && (
                       <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                          {msg.metadata.groundingChunks.map((chunk: any, i: number) => {
                             if (chunk.web?.uri) {
                                return (
                                    <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300 hover:underline bg-blue-100 dark:bg-blue-900/20 p-2 rounded">
                                        <Search className="w-3 h-3" />
                                        {chunk.web.title}
                                    </a>
                                )
                             }
                             if (chunk.maps?.uri) {
                                return (
                                    <a key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-green-600 dark:text-green-300 hover:underline bg-green-100 dark:bg-green-900/20 p-2 rounded">
                                        <MapPin className="w-3 h-3" />
                                        Map Result
                                    </a>
                                )
                             }
                             return null;
                          })}
                       </div>
                    )}
                </div>
                
                {/* Actions for Model Messages */}
                {msg.role === 'model' && !msg.metadata?.isSystem && assistantEnabled && msg.content !== '' && (
                    <div className="flex items-center gap-2 px-2">
                        <button onClick={() => playTTS(msg.content)} className="p-1.5 text-zinc-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-white transition">
                             {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
          </div>
        ))}
        {/* Removed generic loader in favor of typing cursor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur pb-8 transition-colors">
        
        {/* Feedback Status */}
        {processingStatus && (
            <div className="absolute top-0 left-0 right-0 -translate-y-full p-2 text-center">
                 <span className="bg-zinc-100 dark:bg-neutral-800 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-900/30 flex items-center gap-2 w-fit mx-auto animate-in slide-in-from-bottom-2 fade-in">
                     <Mic2 className="w-3 h-3 animate-pulse" />
                     {processingStatus}
                 </span>
            </div>
        )}

        <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <button 
                onClick={handleMicClick}
                disabled={!assistantEnabled}
                className={`p-4 rounded-full transition hover:bg-zinc-200 dark:hover:bg-neutral-700 flex-shrink-0 ${
                    !assistantEnabled 
                    ? 'bg-zinc-100 dark:bg-neutral-900 text-zinc-400 dark:text-neutral-600 cursor-not-allowed' 
                    : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
                {assistantEnabled ? <Mic className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
            </button>
            <div className={`flex-1 border rounded-2xl overflow-hidden transition-all ${
                !assistantEnabled 
                ? 'bg-zinc-50 dark:bg-neutral-900/50 border-zinc-200 dark:border-neutral-800' 
                : 'bg-zinc-50 dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800 focus-within:ring-1 focus-within:ring-purple-500'
            }`}>
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={
                        !assistantEnabled 
                        ? (language === 'pt' ? "Assistente Pausado. Ative para conversar." : "Assistant Paused. Turn ON to chat.")
                        : (language === 'pt' ? "Fala comigo..." : `Talk to ${producerName}...`)
                    }
                    disabled={!assistantEnabled && false} // Allow typing but warn on send
                    className={`w-full bg-transparent border-none p-4 text-zinc-900 dark:text-white focus:outline-none resize-none max-h-32 ${!assistantEnabled ? 'text-zinc-500 dark:text-neutral-500 cursor-not-allowed' : 'placeholder-zinc-500 dark:placeholder-neutral-600'}`}
                    rows={1}
                />
            </div>
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isProcessing}
                className={`p-4 rounded-full transition flex-shrink-0 ${
                    !assistantEnabled 
                    ? 'bg-zinc-100 dark:bg-neutral-800 text-zinc-400 dark:text-neutral-500' 
                    : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                }`}
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};
