
import { GoogleGenAI, GenerateContentResponse, Modality, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_PROMPT, STANDARD_MODEL, THINKING_MODEL, FAST_MODEL, TTS_MODEL, TRANSCRIPTION_MODEL, VEO_MODEL } from "../constants";
import { Language, StudioSessionType } from "../types";

// Helper to get client
const getClient = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

// --- Orchestration Logic ---

interface ChatParams {
  message: string;
  history: { role: 'user' | 'model'; content: string }[];
  language: Language;
  mode: 'fast' | 'standard' | 'deep';
  useGrounding?: 'search' | 'maps';
  location?: { lat: number; lng: number };
  producerName?: string;
}

// MEMORY OPTIMIZER: Prune history to keep context fresh and lightweight
const pruneHistory = (history: { role: 'user' | 'model'; content: string }[], limit: number = 12) => {
  // 1. Remove empty messages
  const validHistory = history.filter(h => h.content && h.content.trim().length > 0);
  
  // 2. Keep only the last N turns (user + model pairs typically)
  // We prioritize recent context over old context.
  if (validHistory.length > limit) {
    return validHistory.slice(validHistory.length - limit);
  }
  return validHistory;
};

// Non-streaming fallback (legacy or tools)
export const sendMessage = async ({ message, history, language, mode, useGrounding, location, producerName }: ChatParams) => {
  const ai = getClient();
  const { model, config } = configureChat(language, mode, useGrounding, location, producerName);

  // Apply Memory Optimization
  const optimizedHistory = pruneHistory(history);

  const chat = ai.chats.create({
    model,
    config,
    history: optimizedHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  try {
    const result = await chat.sendMessage({ message });
    return {
      text: result.text,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

// STREAMING IMPLEMENTATION (Performance Optimized)
export const sendMessageStream = async function* ({ message, history, language, mode, useGrounding, location, producerName }: ChatParams) {
  const ai = getClient();
  const { model, config } = configureChat(language, mode, useGrounding, location, producerName);

  // Apply Memory Optimization
  const optimizedHistory = pruneHistory(history);

  const chat = ai.chats.create({
    model,
    config,
    history: optimizedHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  try {
    const result = await chat.sendMessageStream({ message });
    
    for await (const chunk of result) {
        if (chunk.text) {
            yield { 
                text: chunk.text, 
                groundingMetadata: chunk.candidates?.[0]?.groundingMetadata 
            };
        }
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

// Helper to configure model/tools
const configureChat = (language: Language, mode: string, useGrounding: string | undefined, location: any, producerName?: string) => {
  let model = STANDARD_MODEL;
  let config: any = {
    systemInstruction: SYSTEM_PROMPT(language, producerName),
  };

  // 1. Intelligence Routing
  if (mode === 'deep') {
    model = THINKING_MODEL;
    config.thinkingConfig = { thinkingBudget: 16000 }; 
  } else if (mode === 'fast') {
    model = FAST_MODEL;
  }

  // 2. Tool Integration
  if (useGrounding === 'search') {
    model = STANDARD_MODEL;
    config.tools = [{ googleSearch: {} }];
  } else if (useGrounding === 'maps' && location) {
    model = STANDARD_MODEL;
    config.tools = [{ googleMaps: {} }];
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    };
  }
  
  return { model, config };
};

// --- Studio Focus AI ---

export const getStudioAssist = async (query: string, context: string, language: Language, producerName: string = "ArtisticLab AI") => {
  const ai = getClient();
  const prompt = `
    CONTEXT: User is in "Studio Focus Mode".
    AI Identity: ${producerName}
    CURRENT TASK/LYRICS: "${context}"
    USER QUERY: "${query}"
    
    RULES:
    1. BE EXTREMELY CONCISE. No pleasantries.
    2. Focus strictly on execution (rhymes, flows, technical tip).
    3. Max 2 sentences unless asked for a list.
    4. Language: ${language === 'pt' ? 'Portuguese' : 'English'}.
  `;

  // Use FAST_MODEL for instant studio replies
  const response = await ai.models.generateContent({
    model: FAST_MODEL, 
    contents: prompt
  });

  return response.text || "";
};

export const summarizeSession = async (
    notes: string, 
    type: StudioSessionType, 
    duration: number, 
    language: Language
) => {
  const ai = getClient();
  const prompt = `
    Role: Professional Music Manager & Studio Assistant.
    Task: Summarize a finished session.
    
    Data:
    - Type: ${type}
    - Duration: ${duration} minutes
    - User Notes/Lyrics: "${notes}"
    
    Output JSON format:
    {
      "summary": "Brief 1-2 sentence overview of what was achieved.",
      "actionItems": ["List item 1", "List item 2"]
    }
    
    Language: ${language === 'pt' ? 'Portuguese' : 'English'}.
    Keep it professional, encouraging, and clear.
  `;

  const response = await ai.models.generateContent({
    model: STANDARD_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
      return JSON.parse(response.text || "{}");
  } catch (e) {
      console.error("Session Summary Parse Error", e);
      return { summary: "Session completed.", actionItems: [] };
  }
};

// --- Mix Engineer AI ---

export const getMixFeedback = async (
    fileName: string, 
    type: 'mix' | 'master', 
    language: Language,
    technicalStats?: string
) => {
  const ai = getClient();
  const prompt = `
    Role: Professional AI Audio Engineer.
    Task: Provide a short, reassuring technical summary after processing a track.
    Context: 
    - File: ${fileName}
    - Process: ${type === 'mix' ? 'Automatic Mixing' : 'AI Mastering'}
    - Technical Analysis: ${technicalStats || 'N/A'}
    
    Output Rules:
    - 2-3 Bullet points MAX.
    - Mention 2 specific improvements.
    - If technical stats show clipping or low RMS, WARN THE USER gently.
    - Professional but accessible tone.
    - Language: ${language === 'pt' ? 'Portuguese' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: prompt
  });

  return response.text || "";
};

// --- Intelligent Agenda ---

export const generateMonthlyAgenda = async (
  month: string,
  goals: string,
  language: Language
) => {
  const ai = getClient();
  const prompt = `
    Role: Expert Artist Career Planner.
    Task: Create a structured Monthly Agenda based on user goals.
    
    Month: ${month}
    User Goals: "${goals}"
    Language: ${language === 'pt' ? 'Portuguese' : 'English'}
    
    Output strictly valid JSON structure:
    {
       "overview": "Motivational summary of the month's strategy (2 sentences)",
       "weeks": [
          {
             "weekNumber": 1,
             "focus": "Main focus of the week",
             "days": [
                { "dayName": "Mon", "tasks": ["Task 1", "Task 2"] },
                { "dayName": "Tue", "tasks": ["Task 1"] },
                { "dayName": "Wed", "tasks": ["Task 1", "Task 2"] },
                { "dayName": "Thu", "tasks": ["Task 1"] },
                { "dayName": "Fri", "tasks": ["Task 1", "Task 2"] },
                { "dayName": "Sat", "tasks": ["Task 1"] },
                { "dayName": "Sun", "tasks": ["Rest/Review"] }
             ]
          },
          ... (Repeat for 4 weeks)
       ]
    }
    
    Rules:
    - Be realistic. Don't overload.
    - Balance studio time, writing, promotion, and rest.
    - If goals are vague, infer steps needed for a Rap/Trap artist.
  `;

  const response = await ai.models.generateContent({
    model: STANDARD_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
      return JSON.parse(response.text || "{}");
  } catch (e) {
      console.error("Agenda Gen Error", e);
      return null;
  }
};

// --- Audio Transcription ---

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getClient();
  const base64Audio = await blobToBase64(audioBlob);
  
  // Optimized for Speed & Raw Intent
  const response = await ai.models.generateContent({
    model: TRANSCRIPTION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/wav',
            data: base64Audio
          }
        },
        { text: "TRANSCRIPTION RULES: 1. Transcribe exactly what is said. 2. Capture slang. 3. Ignore stuttering. 4. If unclear, return empty string." }
      ]
    }
  });

  return response.text || "";
};

// --- TTS ---

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir') => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  
  return base64Audio;
};

// --- Veo Video Generation ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', apiKey: string) => {
  // Use the provided API key (from user selection)
  const ai = getClient(apiKey);

  let operation = await ai.models.generateVideos({
    model: VEO_MODEL,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: aspectRatio,
      // resolution: '720p' // default for fast preview
    }
  });

  // STABILITY FIX: Add polling timeout/counter to prevent infinite loops
  let attempts = 0;
  const MAX_ATTEMPTS = 60; // 5 minutes timeout (60 * 5s)

  while (!operation.done) {
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error("Video generation timed out. Please try again.");
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
    operation = await ai.operations.getVideosOperation({ operation: operation });
    attempts++;
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed or returned no URI");

  // Fetch the actual video bytes using the key
  const response = await fetch(`${videoUri}&key=${apiKey}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// --- Utils ---

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
